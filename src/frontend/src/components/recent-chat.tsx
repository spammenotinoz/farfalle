import { HourglassIcon } from "lucide-react";
import { ChatModel, ChatSnapshot } from "../../generated";
import moment from "moment";
import Link from "next/link";
import { modelMap } from "./model-display";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function RecentChat({
  id,
  title,
  date,
  preview,
  model_name,
}: ChatSnapshot) {
  const formattedDate = moment(date).fromNow();
  const model =
    model_name in modelMap ? modelMap[model_name as ChatModel] : null;

  return (
    <motion.div whileHover={{ scale: 1.01 }} transition={{ duration: 0.2 }}>
      <Link
        href={`/search/${id}`}
        className="flex-1 rounded-md flex-col cursor-pointer transition-all duration-200 group bg-card hover:bg-card/80 border border-border/50 hover:border-tint/30 no-underline block"
      >
        <div className="p-4 flex flex-col justify-between h-full space-y-3">
          <div className="flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <h1 className="line-clamp-1 text-foreground font-medium group-hover:text-tint transition-colors">
                {title}
              </h1>
              <ArrowRight
                size={16}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:translate-x-1 text-tint"
              />
            </div>
            <p className="text-foreground/60 line-clamp-2 text-sm mt-1">
              {preview}
            </p>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <div className="flex items-center space-x-1 text-foreground/50">
              <HourglassIcon className="w-3 h-3" />
              <p className="text-xs">{formattedDate}</p>
            </div>
            <div className="flex items-center space-x-2 text-foreground/50">
              {model?.smallIcon}
              <p className="font-medium text-xs">{model?.name}</p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
