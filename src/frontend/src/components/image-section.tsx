/* eslint-disable @next/next/no-img-element */
"use client";
import { Skeleton } from "./ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Grid3X3, Rows3 } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export const ImageSectionSkeleton = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
      {[...Array(6)].map((_, index) => (
        <div key={`image-skeleton-${index}`} className="aspect-square">
          <Skeleton className="w-full h-full rounded-lg bg-card" />
        </div>
      ))}
    </div>
  );
};

export function ImageSection({ images }: { images: string[] }) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  if (images && images.length > 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">
            {images.length} images
          </h3>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 size={14} />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              onClick={() => setViewMode("list")}
            >
              <Rows3 size={14} />
            </Button>
          </div>
        </div>

        <div
          className={cn(
            viewMode === "grid"
              ? "grid grid-cols-2 md:grid-cols-3 gap-2"
              : "flex flex-col gap-2"
          )}
        >
          <AnimatePresence>
            {images.map((image, index) => (
              <motion.a
                key={image}
                href={image}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "relative overflow-hidden group bg-muted rounded-lg transition-all duration-200",
                  viewMode === "grid"
                    ? "aspect-square"
                    : "aspect-video"
                )}
              >
                <img
                  src={image}
                  alt={`Image ${index + 1}`}
                  className={cn(
                    "w-full h-full object-cover transition-all duration-300 group-hover:scale-105",
                    viewMode === "list" && "object-top"
                  )}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-black/60 text-white p-1.5 rounded-md">
                    <ExternalLink size={14} />
                  </div>
                </div>
              </motion.a>
            ))}
          </AnimatePresence>
        </div>
      </div>
    );
  }
  return null;
}
