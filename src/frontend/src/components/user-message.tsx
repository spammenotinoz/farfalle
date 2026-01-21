import { ChatMessage } from "../../generated";
import { User, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export const UserMessageContent = ({ message }: { message: ChatMessage }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-6"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-tint/10 flex items-center justify-center">
          <User className="w-5 h-5 text-tint" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl md:text-2xl font-semibold leading-tight">
            {message.content}
          </h2>
        </div>
      </div>
    </motion.div>
  );
};
