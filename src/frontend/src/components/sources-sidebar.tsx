/* eslint-disable @next/next/no-img-element */
"use client";
import { SearchResult } from "../../generated";
import { ExternalLink, BookOpen, Loader2, ShieldCheck, Globe } from "lucide-react";
import { motion } from "framer-motion";

const Logo = ({ url, size = 16 }: { url: string; size?: number }) => (
  <div className="flex-shrink-0 rounded overflow-hidden relative bg-muted">
    <img
      className="block"
      src={`https://www.google.com/s2/favicons?sz=${size}&domain=${url}`}
      alt="favicon"
      width={size}
      height={size}
    />
  </div>
);

function formatHostname(url: string) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function uniqueDomainCount(results: SearchResult[]): number {
  const set = new Set<string>();
  for (const r of results) {
    try {
      set.add(new URL(r.url).hostname.replace("www.", ""));
    } catch {
      set.add(r.url);
    }
  }
  return set.size;
}

interface SourcesSidebarProps {
  results: SearchResult[];
  isLive?: boolean;
}

export function SourcesSidebar({ results, isLive = false }: SourcesSidebarProps) {
  if (!results || results.length === 0) return null;

  const domainCount = uniqueDomainCount(results);

  return (
    <div className="space-y-1">
      <div className="mb-4 px-1">
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-tint" />
          <h2 className="text-sm font-semibold text-foreground">Sources</h2>
          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            {results.length}
          </span>
          {isLive && (
            <span className="ml-auto inline-flex items-center gap-1 rounded bg-tint/10 px-1.5 py-0.5 text-[10px] font-medium text-tint">
              <Loader2 className="h-3 w-3 animate-spin" />
              Live
            </span>
          )}
        </div>

        {/* Stat strip — gives the sidebar a sense of corpus shape at a glance. */}
        <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Globe size={11} className="text-tint/80" />
            <span className="tabular-nums font-medium text-foreground/70">{domainCount}</span>
            <span>{domainCount === 1 ? "domain" : "domains"}</span>
          </span>
          <span className="h-3 w-px bg-border" aria-hidden="true" />
          <span className="inline-flex items-center gap-1">
            <ShieldCheck size={11} className="text-emerald-500" />
            Cited inline
          </span>
        </div>
      </div>

      {results.map((result, index) => {
        const { title, url, content } = result;
        const domain = formatHostname(url);
        return (
          <motion.a
            key={`sidebar-source-${index}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="source-card block group"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04, duration: 0.25 }}
          >
            {/* Citation rail — the bold [N] makes the visual link from prose to source. */}
            <span className="source-card-rail" aria-hidden="true">
              {index + 1}
            </span>

            {/* Header row: favicon + domain */}
            <div className="flex items-center gap-1.5">
              <Logo url={url} size={14} />
              <span className="source-card-domain truncate">{domain}</span>
              <ExternalLink
                size={10}
                className="ml-auto flex-shrink-0 text-muted-foreground/0 transition-colors group-hover:text-tint"
              />
            </div>

            {/* Title */}
            <p className="source-card-title mt-1">{title}</p>

            {/* Snippet */}
            {content && (
              <p className="source-card-snippet mt-1.5">{content}</p>
            )}

            {/* Inline thumbnail from article — avoids unrelated image search */}
            {result.image && (
              <div className="mt-2 rounded-md overflow-hidden bg-muted">
                <img
                  src={result.image}
                  alt={title}
                  className="w-full h-20 object-cover"
                />
              </div>
            )}
          </motion.a>
        );
      })}
    </div>
  );
}
