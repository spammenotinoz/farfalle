import { PlusIcon, Sparkles, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function RelatedQuestions({
  questions,
  onSelect,
}: {
  questions: string[];
  onSelect: (question: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
        <Sparkles size={12} />
        <span>Related questions</span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {questions.map((question, index) => (
          <motion.button
            key={`question-${index}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelect(question)}
            className="group flex items-center justify-between p-3 rounded-xl bg-card/50 hover:bg-card border border-border/50 hover:border-tint/30 transition-all duration-200 text-left"
          >
            <span className="text-sm font-medium group-hover:text-tint transition-colors line-clamp-1">
              {question}
            </span>
            <ArrowRight
              size={14}
              className="flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-1 text-tint"
            />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
