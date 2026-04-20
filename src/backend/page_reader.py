"""
Page Reader — fetches and extracts readable content from source URLs.

This is the key differentiator vs Perplexity-lite clones: instead of relying
solely on search snippets, we read the actual top source pages to get richer,
more accurate context for answer synthesis.
"""

import asyncio
import re
from dataclasses import dataclass, field
from typing import Optional

import httpx


@dataclass
class PageContent:
    url: str
    title: str
    content: str
    excerpt: str = ""
    error: Optional[str] = None


def _strip_html(raw: str) -> str:
    """Remove HTML tags, normalize whitespace."""
    # Remove script and style blocks
    raw = re.sub(r"(?is)<script[^>]*>.*?</script>", "", raw)
    raw = re.sub(r"(?is)<style[^>]*>.*?</style>", "", raw)
    # Remove HTML comments
    raw = re.sub(r"<!--.*?-->", "", raw, flags=re.DOTALL)
    # Remove all remaining tags
    raw = re.sub(r"<[^>]+>", " ", raw)
    # Normalize whitespace
    raw = re.sub(r"[ \t]+", " ", raw)
    raw = re.sub(r"\n{3,}", "\n\n", raw)
    return raw.strip()


def _extract_title(raw: str) -> str:
    """Extract <title> content or first <h1>."""
    title_match = re.search(r"(?i)<title[^>]*>([^<]+)</title>", raw)
    if title_match:
        return _strip_html(title_match.group(1)).strip()
    h1_match = re.search(r"(?i)<h1[^>]*>([^<]+)</h1>", raw)
    if h1_match:
        return _strip_html(h1_match.group(1)).strip()
    return ""


async def fetch_page(
    client: httpx.AsyncClient,
    url: str,
    timeout: float = 10.0,
    max_chars: int = 4000,
) -> PageContent:
    """Fetch a single URL and extract readable text content."""
    try:
        response = await client.get(
            url,
            timeout=httpx.Timeout(timeout),
            headers={
                "User-Agent": (
                    "Mozilla/5.0 (compatible; Farfalle/1.0; "
                    "+https://github.com/farfalle search bot)"
                ),
                "Accept": "text/html,application/xhtml+xml",
                "Accept-Language": "en-US,en;q=0.9",
            },
            follow_redirects=True,
        )
        response.raise_for_status()

        content_type = response.headers.get("content-type", "")
        if "text/html" not in content_type and "text/plain" not in content_type:
            return PageContent(
                url=url,
                title="",
                content="",
                error=f"Non-HTML content type: {content_type}",
            )

        raw = response.text
        title = _extract_title(raw)
        text = _strip_html(raw)

        # Collapse to a single paragraph-ish block for context use
        text = re.sub(r"\n{3,}", "\n\n", text)
        text = re.sub(r"[ \t]+", " ", text).strip()
        text = text[:max_chars]

        excerpt = text[:300].strip() + ("..." if len(text) > 300 else "")

        return PageContent(
            url=url,
            title=title,
            content=text,
            excerpt=excerpt,
        )
    except httpx.TimeoutException:
        return PageContent(url=url, title="", content="", error="Timeout")
    except httpx.HTTPStatusError as e:
        return PageContent(url=url, title="", content="", error=f"HTTP {e.response.status_code}")
    except Exception as e:
        return PageContent(url=url, title="", content="", error=str(e))


async def read_pages(
    urls: list[str],
    max_pages: int = 4,
    concurrency: int = 3,
    timeout: float = 10.0,
    max_chars: int = 4000,
) -> list[PageContent]:
    """
    Fetch multiple URLs in parallel, respecting concurrency limits.

    Args:
        urls: List of URLs to fetch
        max_pages: Maximum number of pages to fetch (takes top N)
        concurrency: Max concurrent requests
        timeout: Per-request timeout in seconds
        max_chars: Max characters to extract per page

    Returns:
        List of PageContent objects (some may have error set)
    """
    urls = urls[:max_pages]
    semaphore = asyncio.Semaphore(concurrency)

    async def bounded_fetch(url: str) -> PageContent:
        async with semaphore:
            async with httpx.AsyncClient() as client:
                return await fetch_page(client, url, timeout=timeout, max_chars=max_chars)

    pages = await asyncio.gather(*[bounded_fetch(url) for url in urls])
    return [p for p in pages if p.content]  # Drop pages that failed silently


def format_pages_for_context(pages: list[PageContent]) -> str:
    """Format fetched pages into a context string for the LLM."""
    if not pages:
        return ""

    parts = []
    for i, page in enumerate(pages, 1):
        if page.error:
            continue
        parts.append(
            f"--- Source {i}: {page.title or page.url} ---\n"
            f"URL: {page.url}\n"
            f"{page.content[:3000]}"
        )
    return "\n\n".join(parts)
