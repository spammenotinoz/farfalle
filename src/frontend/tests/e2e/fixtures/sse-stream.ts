// Builds a deterministic Server-Sent Events stream that mirrors what the
// backend emits for a Pro Search ("Deep Research") run. Used by Playwright
// route mocking so the test never touches search providers or LLMs.
//
// Each `data:` line is a serialized ChatResponseEvent from generated/types.gen.ts.

type SseEvent = { event: string; data: unknown };

function encode(events: SseEvent[]): string {
  return (
    events
      .map(
        (e) =>
          `event: ${e.event}\ndata: ${JSON.stringify({ event: e.event, data: e.data })}\n\n`,
      )
      .join("") + ":keepalive\n\n"
  );
}

export const FIXTURE_QUERY = "What is reciprocal rank fusion?";
export const FIXTURE_REPORT_TEXT =
  "Reciprocal Rank Fusion combines ranked lists by summing 1/(k+rank) per item.";
export const FIXTURE_SOURCE_HOST = "example.com";
export const FIXTURE_FAILED_COUNT = 1;
export const FIXTURE_PAGES_TOTAL = 3;

const sources = [
  {
    title: "RRF explained",
    url: "https://example.com/rrf",
    content: "An overview of reciprocal rank fusion.",
    image: null,
  },
  {
    title: "Fusion ranking benchmarks",
    url: "https://benchmarks.example.com/fusion",
    content: "Empirical comparison of fusion strategies.",
    image: null,
  },
  {
    title: "Search ranking primer",
    url: "https://docs.example.com/ranking",
    content: "Ranking fundamentals for IR systems.",
    image: null,
  },
];

const reportTokens = FIXTURE_REPORT_TEXT.split(/(\s+)/);

export function buildFixture(): string {
  return encode([
    {
      event: "agent-query-plan",
      data: {
        event_type: "agent-query-plan",
        steps: ["Survey RRF literature", "Synthesize a sourced answer"],
      },
    },
    {
      event: "agent-search-queries",
      data: {
        event_type: "agent-search-queries",
        step_number: 0,
        queries: ["reciprocal rank fusion", "RRF k parameter"],
      },
    },
    {
      event: "agent-read-results",
      data: {
        event_type: "agent-read-results",
        step_number: 0,
        results: sources,
      },
    },
    { event: "agent-finish", data: { event_type: "agent-finish" } },
    {
      event: "begin-stream",
      data: { event_type: "begin-stream", query: FIXTURE_QUERY },
    },
    {
      event: "search-results",
      data: {
        event_type: "search-results",
        results: sources,
        images: [],
        failed_count: 0,
      },
    },
    {
      event: "agent-read-pages",
      data: {
        event_type: "agent-read-pages",
        current: 1,
        total: FIXTURE_PAGES_TOTAL,
        current_url: sources[0].url,
        failed_count: 0,
      },
    },
    {
      event: "agent-read-pages",
      data: {
        event_type: "agent-read-pages",
        current: 2,
        total: FIXTURE_PAGES_TOTAL,
        current_url: sources[1].url,
        failed_count: 0,
      },
    },
    {
      event: "agent-read-pages",
      data: {
        event_type: "agent-read-pages",
        current: FIXTURE_PAGES_TOTAL,
        total: FIXTURE_PAGES_TOTAL,
        current_url: sources[2].url,
        failed_count: FIXTURE_FAILED_COUNT,
      },
    },
    ...reportTokens.map((tok) => ({
      event: "text-chunk",
      data: { event_type: "text-chunk", text: tok },
    })),
    {
      event: "related-queries",
      data: {
        event_type: "related-queries",
        related_queries: ["What is BM25?", "How does TF-IDF work?"],
      },
    },
    {
      event: "final-response",
      data: {
        event_type: "final-response",
        message: FIXTURE_REPORT_TEXT,
      },
    },
    {
      event: "stream-end",
      data: { event_type: "stream-end", thread_id: null },
    },
  ]);
}
