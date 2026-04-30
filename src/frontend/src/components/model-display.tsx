"use client";

import * as React from "react";
import { Cpu, Terminal, Zap } from "lucide-react";
import { ChatModel } from "../../generated";

type ModelDisplay = {
  name: string;
  smallIcon: React.ReactNode;
};

export const modelMap: Record<ChatModel, ModelDisplay> = {
  [ChatModel.FAST]: {
    name: "Fast",
    smallIcon: <Zap className="w-4 h-4" />,
  },
  [ChatModel.THINKING]: {
    name: "Research",
    smallIcon: <Cpu className="w-4 h-4" />,
  },
  [ChatModel.TECHNICAL]: {
    name: "Technical",
    smallIcon: <Terminal className="w-4 h-4" />,
  },
};
