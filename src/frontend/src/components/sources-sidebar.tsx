/* eslint-disable @next/next/no-img-element */
"use client";
import { SearchResult } from "../../generated";
import { ExternalLink, BookOpen } from "lucide-react";
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

interface SourcesSidebarProps {
  results: SearchResult[];
}

export function SourcesSidebar({ results }: SourcesSidebarProps) {
  if (!results || results.length === 0) return null;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <BookOpen size={14} className="text-tint" />
          <h2 className="text-sm font-semibold text-foreground">
            Sources
          </h2>
          <span className="text-xs text-muted-foreground font-mono">
            {results.length}
          </span>
        </div>
      </div>

      {results.map(({ title, url, content }, index) => {
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
            {/* Header row: favicon + domain + number */}
            <div className="source-card-header">
              <Logo url={url} size={14} />
              <span className="source-card-domain">{domain}</span>
              <span className="ml-auto text-[10px] font-mono text-tint/70">
                [{index + 1}]
              </span>
            </div>

            {/* Title */}
            <p className="source-card-title">{title}</p>

            {/* Snippet */}
            {content && (
              <p className="source-card-snippet mt-1.5">{content}</p>
            )}

            {/* Open link */}
            <div className="source-card-open">
              <ExternalLink size={10} />
              <span>Open</span>
            </div>
          </motion.a>
        );
      })}
    </div>
  );
}
