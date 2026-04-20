import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { SearchIcon, WandSparklesIcon } from "lucide-react";

// ─── Thinking Dots ─────────────────────────────────────────────────────
const ThinkingDots = () => (
  <div className="flex items-center gap-1 py-1">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-1.5 h-1.5 rounded-full bg-tint"
        animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
        transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity, ease: "easeInOut" }}
      />
    ))}
  </div>
);

// ─── Search Progress Indicator ─────────────────────────────────────────
interface SearchStep {
  label: string;
  status: "pending" | "active" | "done";
}

export const SearchProgressBar = ({ steps }: { steps: SearchStep[] }) => {
  const activeIndex = steps.findIndex((s) => s.status === "active");
  const doneCount = steps.filter((s) => s.status === "done").length;
  const progress = doneCount / steps.length;

  return (
    <div className="flex flex-col gap-2 py-2">
      {/* Progress bar */}
      <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-tint rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Step labels */}
      <div className="flex flex-col gap-1.5">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                step.status === "done"
                  ? "bg-tint/20"
                  : step.status === "active"
                  ? "bg-tint/20"
                  : "bg-muted"
              }`}
            >
              {step.status === "done" ? (
                <svg className="w-2.5 h-2.5 text-tint" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : step.status === "active" ? (
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-tint"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              ) : (
                <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              )}
            </div>
            <span
              className={`text-xs transition-colors ${
                step.status === "pending"
                  ? "text-muted-foreground/50"
                  : step.status === "active"
                  ? "text-foreground/70"
                  : "text-foreground/50"
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Streaming Answer Skeleton ──────────────────────────────────────────
const ANSWER_SKELETON_LINES = [
  "w-full",
  "w-11/12",
  "w-4/5",
  "w-full",
  "w-3/4",
  "w-11/12",
  "w-5/6",
  "w-full",
  "w-2/3",
  "w-4/5",
  "w-11/12",
];

export const StreamingAnswerSkeleton = ({ isPro }: { isPro?: boolean }) => (
  <div className="flex flex-col gap-3 py-2">
    {isPro && (
      <div className="flex items-center gap-2 mb-1">
        <WandSparklesIcon size={14} className="text-tint animate-pulse" />
        <span className="text-xs text-muted-foreground">Researching your question...</span>
      </div>
    )}
    {ANSWER_SKELETON_LINES.map((w, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0 }}
        animate={{ opacity: i === 0 ? 1 : [0.5, 0.8, 0.5] }}
        transition={{
          opacity: { duration: 0.4, delay: i * 0.08 },
          animate: {
            opacity: { duration: 1.5, delay: i * 0.1, repeat: Infinity, repeatDelay: 0.5 },
          },
        }}
      >
        <div className={`h-2 rounded bg-muted ${w}`} />
      </motion.div>
    ))}
    {/* Streaming cursor */}
    <div className="streaming-cursor" />
  </div>
);

// ─── Research Card (for search results) ────────────────────────────────
export const ResearchCard = ({
  title,
  url,
  snippet,
  favicon,
  index,
  isStreaming,
}: {
  title: string;
  url: string;
  snippet: string;
  favicon?: string;
  index: number;
  isStreaming?: boolean;
}) => {
  const domain = (() => {
    try { return new URL(url).hostname.replace("www.", ""); }
    catch { return url; }
  })();

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="source-card block group"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
    >
      <div className="source-card-header">
        {favicon && (
          <img src={favicon} alt="" className="w-3.5 h-3.5 rounded" width={14} height={14} />
        )}
        <span className="source-card-domain">{domain}</span>
        <span className="ml-auto text-[10px] font-mono text-tint/60">[{index + 1}]</span>
      </div>
      <p className="source-card-title">{title}</p>
      {snippet && <p className="source-card-snippet mt-1">{snippet}</p>}
      <div className="source-card-open">
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
          <path d="M1 11L11 1M11 1H5M11 1V7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Open</span>
      </div>
    </motion.a>
  );
};
