/* eslint-disable @next/next/no-img-element */
"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "./ui/skeleton";
import { SearchResult } from "../../generated";
import { ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const SearchResultsSkeleton = () => (
  <div className="grid grid-cols-2 gap-2">
    {[...Array(4)].map((_, i) => (
      <Skeleton key={i} className="rounded-xl h-24 bg-card" />
    ))}
  </div>
);

export const Logo = ({ url, size = 16 }: { url: string; size?: number }) => (
  <div className="rounded overflow-hidden bg-muted p-0.5 flex-shrink-0">
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
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

export function SearchResults({ results }: { results: SearchResult[] }) {
  const [showAll, setShowAll] = useState(false);
  const display = showAll ? results : results.slice(0, 4);
  const extra = results.length - 4;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">
          {results.length} sources
        </span>
        {extra > 0 && !showAll && (
          <button
            className="text-xs text-tint hover:opacity-70 transition-opacity"
            onClick={() => setShowAll(true)}
          >
            View all →
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <AnimatePresence>
          {display.map(({ title, url, content }, i) => (
            <motion.a
              key={`src-${i}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ delay: i * 0.04, duration: 0.2 }}
            >
              <Card className="h-full rounded-xl border border-border hover:border-tint/40 hover:shadow-sm transition-all duration-200 overflow-hidden bg-card">
                <CardContent className="p-3 flex flex-col gap-1.5">
                  <div className="flex items-start gap-2">
                    <Logo url={url} size={14} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-2 leading-tight text-foreground">
                        {title}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatHostname(url)}
                      </p>
                    </div>
                    <ExternalLink
                      size={10}
                      className="flex-shrink-0 text-muted-foreground mt-0.5"
                    />
                  </div>
                  {content && (
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">
                      {content}
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.a>
          ))}
        </AnimatePresence>
      </div>

      {showAll && extra > 0 && (
        <button
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-1.5 transition-colors"
          onClick={() => setShowAll(false)}
        >
          Show fewer
        </button>
      )}
    </div>
  );
}
