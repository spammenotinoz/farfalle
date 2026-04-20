import {
  CameraIcon,
  ListPlusIcon,
  StarIcon,
  TextSearchIcon,
  BotIcon,
} from "lucide-react";
import { motion } from "framer-motion";

export const Section = ({
  title,
  children,
  animate = true,
  streaming = false,
  icon: Icon,
}: {
  title: "Sources" | "Answer" | "Related" | "Images";
  children: React.ReactNode;
  animate?: boolean;
  streaming?: boolean;
  icon?: React.ComponentType<{ size?: number }>;
}) => {
  const iconMap = {
    Sources: TextSearchIcon,
    Answer: BotIcon,
    Related: ListPlusIcon,
    Images: CameraIcon,
  };

  const IconComponent = Icon || iconMap[title] || StarIcon;

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 20 } : undefined}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      transition={animate ? { duration: 0.4 } : undefined}
      className={cn("flex flex-col mb-6")}
    >
      <div className="flex items-center space-x-2 mb-3">
        {streaming ? (
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          >
            <IconComponent size={18} className="text-tint" />
          </motion.div>
        ) : (
          <IconComponent size={18} className="text-tint/80" />
        )}
        <div className="text-sm font-medium text-foreground/80">{title}</div>
      </div>
      <div className="pl-6">{children}</div>
    </motion.div>
  );
};
