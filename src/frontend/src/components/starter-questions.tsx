"use client";

import {
  ArrowUpRight,
  BriefcaseBusiness,
  FlaskConical,
  Globe,
  Landmark,
  Lightbulb,
  LucideIcon,
  RefreshCw,
  SearchCheck,
  TrendingUp,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  groupTopicsByCategory,
  TrendingTopic,
  useTrendingTopics,
} from "@/services/trending";
import { Button } from "./ui/button";
import { useState } from "react";

interface Category {
  name: string;
  icon: LucideIcon;
  color: string;
}

const categories: Category[] = [
  { name: "Technology", icon: TrendingUp, color: "text-blue-500" },
  { name: "Science", icon: FlaskConical, color: "text-green-500" },
  { name: "Business", icon: BriefcaseBusiness, color: "text-violet-500" },
  { name: "World", icon: Globe, color: "text-orange-500" },
  { name: "Policy", icon: Landmark, color: "text-amber-500" },
  { name: "Strategy", icon: Lightbulb, color: "text-rose-500" },
];

const researchPrompts = [
  "Compare the current AI search market: Perplexity, ChatGPT Search, Gemini, and You.com",
  "What are the strongest arguments for and against small modular nuclear reactors?",
  "Deep dive into the economics and supply chain risks of sodium-ion batteries",
  "Analyze the latest evidence on GLP-1 drugs and long-term cardiovascular outcomes",
  "What should a mid-market company know before moving from PostgreSQL to distributed SQL?",
  "Research the state of autonomous coding agents and where they still fail",
];

const TopicCard = ({
  topic,
  index,
  onSelect,
}: {
  topic: TrendingTopic;
  index: number;
  onSelect: (question: string) => void;
}) => {
  const category = categories.find((c) => c.name === topic.category);

  return (
    <motion.button
      key={topic.id}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => onSelect(topic.title)}
      className="group flex w-full items-center justify-between rounded-md border border-border/50 bg-card/70 p-3 text-left transition-all duration-200 hover:border-tint/30 hover:bg-card"
    >
      <div className="flex min-w-0 items-center gap-3">
        {category && (
          <div className={`rounded-md bg-muted p-2 ${category.color}`}>
            <category.icon size={14} />
          </div>
        )}
        <span className="line-clamp-2 flex-1 text-sm font-medium leading-snug transition-colors group-hover:text-tint">
          {topic.title}
        </span>
      </div>
      <ArrowUpRight
        size={14}
        className="ml-2 shrink-0 text-tint opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
      />
    </motion.button>
  );
};

const CategorySection = ({
  category,
  topics,
  onSelect,
}: {
  category: string;
  topics: TrendingTopic[];
  onSelect: (question: string) => void;
}) => {
  const categoryConfig = categories.find((c) => c.name === category);
  const Icon = categoryConfig?.icon || TrendingUp;
  const colorClass = categoryConfig?.color || "text-tint";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground/70">
        <Icon size={14} className={colorClass} />
        <span>{category}</span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {topics.slice(0, 4).map((topic, index) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            index={index}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
};

const PromptGrid = ({ handleSend }: { handleSend: (question: string) => void }) => (
  <div className="grid gap-2 sm:grid-cols-2">
    {researchPrompts.map((prompt) => (
      <button
        key={prompt}
        onClick={() => handleSend(prompt)}
        className="group flex w-full items-center justify-between rounded-md border bg-card/70 p-3 text-left transition-colors hover:border-tint/40"
      >
        <span className="text-sm font-medium leading-snug">{prompt}</span>
        <ArrowUpRight
          size={14}
          className="ml-3 shrink-0 text-tint opacity-70 transition-transform group-hover:translate-x-0.5"
        />
      </button>
    ))}
  </div>
);

export const StarterQuestionsList = ({
  handleSend,
}: {
  handleSend: (question: string) => void;
}) => {
  const { topics, loading, error, refetch } = useTrendingTopics();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const groupedTopics = groupTopicsByCategory(topics);
  const displayedCategories = selectedCategory
    ? { [selectedCategory]: groupedTopics[selectedCategory] || [] }
    : groupedTopics;

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <SearchCheck size={14} />
          <span>Research starting points</span>
          {error && (
            <span className="text-xs text-destructive">(live topics unavailable)</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() => refetch()}
          disabled={loading}
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      <div className="space-y-6">
        <PromptGrid handleSend={handleSend} />

        {!selectedCategory && Object.keys(groupedTopics).length > 1 && (
          <div className="flex flex-wrap gap-2">
            {Object.keys(groupedTopics)
              .slice(0, 4)
              .map((category) => {
                const categoryConfig = categories.find((c) => c.name === category);
                const Icon = categoryConfig?.icon || TrendingUp;
                const colorClass = categoryConfig?.color || "text-tint";

                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className="flex items-center gap-1.5 rounded-md bg-muted/50 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                  >
                    <Icon size={12} className={colorClass} />
                    {category}
                  </button>
                );
              })}
          </div>
        )}

        {selectedCategory && (
          <button
            onClick={() => setSelectedCategory(null)}
            className="mb-2 flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-tint"
          >
            Back to all categories
          </button>
        )}

        <AnimatePresence mode="wait">
          {Object.entries(displayedCategories).map(([category, categoryTopics]) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <CategorySection
                category={category}
                topics={categoryTopics}
                onSelect={handleSend}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
