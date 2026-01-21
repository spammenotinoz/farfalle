"use client";

import { ArrowUpRight, Sparkles, TrendingUp, Globe, Lightbulb, RefreshCw, LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTrendingTopics, groupTopicsByCategory, TrendingTopic } from "@/services/trending";
import { Button } from "./ui/button";
import { useState } from "react";

interface Category {
  name: string;
  icon: LucideIcon;
  color: string;
}

const categories: Category[] = [
  { name: "Technology", icon: TrendingUp, color: "text-blue-500" },
  { name: "Science", icon: Lightbulb, color: "text-green-500" },
  { name: "Business", icon: Globe, color: "text-purple-500" },
  { name: "World", icon: Globe, color: "text-orange-500" },
  { name: "Entertainment", icon: Sparkles, color: "text-pink-500" },
  { name: "Sports", icon: TrendingUp, color: "text-red-500" },
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
      className="group flex items-center justify-between p-3 rounded-xl bg-card/50 hover:bg-card border border-border/50 hover:border-tint/30 transition-all duration-200 text-left w-full"
    >
      <div className="flex items-center gap-3">
        {category && (
          <div className={`p-2 rounded-lg bg-muted ${category.color}`}>
            <category.icon size={14} />
          </div>
        )}
        <span className="text-sm font-medium group-hover:text-tint transition-colors line-clamp-1 flex-1">
          {topic.title}
        </span>
      </div>
      <ArrowUpRight
        size={14}
        className="opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-1 text-tint ml-2"
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
        {topics.map((topic, index) => (
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

const LoadingSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 bg-muted rounded animate-pulse" />
          <div className="w-16 h-4 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          {[...Array(2)].map((_, j) => (
            <div key={j} className="h-10 bg-muted/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp size={14} />
          <span>Trending topics</span>
          {error && (
            <span className="text-xs text-destructive">(failed to load)</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => refetch()}
          disabled={loading}
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Category filter buttons */}
          {!selectedCategory && Object.keys(groupedTopics).length > 1 && (
            <div className="flex flex-wrap gap-2">
              {Object.keys(groupedTopics).slice(0, 4).map((category) => {
                const categoryConfig = categories.find((c) => c.name === category);
                const Icon = categoryConfig?.icon || TrendingUp;
                const colorClass = categoryConfig?.color || "text-tint";

                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted text-xs font-medium transition-colors"
                  >
                    <Icon size={12} className={colorClass} />
                    {category}
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected category back button */}
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-xs text-muted-foreground hover:text-tint transition-colors flex items-center gap-1 mb-2"
            >
              ← Back to all categories
            </button>
          )}

          {/* Topic sections */}
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

          {/* Empty state */}
          {topics.length === 0 && !loading && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No trending topics available. Try again later.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
