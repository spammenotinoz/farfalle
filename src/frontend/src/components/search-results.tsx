/* eslint-disable @next/next/no-img-element */
"use client";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "./ui/skeleton";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { SearchResult } from "../../generated";
import { ExternalLink, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const SearchResultsSkeleton = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {[...Array(4)].map((_, index) => (
        <div key={`skeleton-${index}`} className="p-3">
          <Skeleton className="rounded-lg h-24 bg-card" />
        </div>
      ))}
    </div>
  );
};

export const Logo = ({ url, size = 16 }: { url: string; size?: number }) => {
  return (
    <div className="rounded-md overflow-hidden relative bg-muted p-1">
      <img
        className="block relative"
        src={`https://www.google.com/s2/favicons?sz=${size}&domain=${url}`}
        alt="favicon"
        width={size}
        height={size}
      />
    </div>
  );
};

export function SearchResults({ results }: { results: SearchResult[] }) {
  const [showAll, setShowAll] = useState(false);

  const displayedResults = showAll ? results : results.slice(0, 4);
  const additionalCount = results.length > 4 ? results.length - 4 : 0;

  const formatHostname = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {results.length} sources
        </h3>
        {additionalCount > 0 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="text-xs text-tint hover:underline flex items-center gap-1"
          >
            View all
            <ArrowRight size={12} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <AnimatePresence>
          {displayedResults.map(({ title, url, content }, index) => {
            const formattedUrl = formatHostname(url);

            return (
              <motion.div
                key={`source-${index}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <Card className="h-full rounded-xl border-border/50 hover:border-tint/50 hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden">
                        <CardContent className="p-3 flex flex-col h-full">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <Logo url={url} size={20} />
                            <ExternalLink
                              size={12}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
                            />
                          </div>

                          <p className="text-xs font-medium line-clamp-2 text-foreground/80 group-hover:text-tint transition-colors">
                            {title}
                          </p>

                          <div className="mt-auto pt-2 flex items-center gap-1">
                            <span className="text-[10px] text-muted-foreground truncate">
                              {formattedUrl}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </a>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80 p-0" side="top">
                    <div className="flex flex-col">
                      <div className="p-3 border-b bg-muted/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Logo url={url} size={24} />
                          <span className="text-xs text-muted-foreground truncate">
                            {formattedUrl}
                          </span>
                        </div>
                        <h4 className="font-medium text-sm">{title}</h4>
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-muted-foreground line-clamp-4">
                          {content}
                        </p>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {showAll && additionalCount > 0 && (
        <button
          onClick={() => setShowAll(false)}
          className="w-full text-center text-xs text-muted-foreground hover:text-tint transition-colors py-2"
        >
          Show fewer sources
        </button>
      )}
    </div>
  );
}
