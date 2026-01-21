import { ArrowUpRight, Sparkles, TrendingUp, Globe, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

const starterQuestions = [
  {
    category: "Trending",
    icon: TrendingUp,
    questions: [
      "What is the latest news about AI?",
      "Stock market predictions for 2024",
      "Climate change updates",
    ],
  },
  {
    category: "Research",
    icon: Lightbulb,
    questions: [
      "What is ChatGPT?",
      "Eight Sleep mattress reviews",
      "How does quantum computing work?",
    ],
  },
  {
    category: "Current Events",
    icon: Globe,
    questions: [
      "Election results 2024",
      "Sports scores today",
      "Technology news this week",
    ],
  },
];

export const StarterQuestionsList = ({
  handleSend,
}: {
  handleSend: (question: string) => void;
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
        <Sparkles size={14} />
        <span>Try asking about</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {starterQuestions.map((category, catIndex) => (
          <motion.div
            key={category.category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIndex * 0.1 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-foreground/70">
              <category.icon size={14} className="text-tint" />
              <span>{category.category}</span>
            </div>

            <ul className="space-y-2">
              {category.questions.map((question, index) => (
                <motion.li
                  key={question}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: catIndex * 0.1 + index * 0.05 }}
                >
                  <button
                    onClick={() => handleSend(question)}
                    className="w-full text-left px-4 py-3 rounded-xl bg-card/50 hover:bg-card border border-border/50 hover:border-tint/30 transition-all duration-200 group"
                  >
                    <span className="text-sm font-medium group-hover:text-tint transition-colors line-clamp-1">
                      {question}
                    </span>
                    <ArrowUpRight
                      size={14}
                      className="inline-block ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-tint"
                    />
                  </button>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
