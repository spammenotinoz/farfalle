"use client";
import * as React from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BrainIcon,
  RabbitIcon,
  Zap,
  Cpu,
  Terminal,
} from "lucide-react";
import { useConfigStore, useChatStore } from "@/stores";
import { ChatModel } from "../../generated";
import { isCloudModel, isLocalModel } from "@/lib/utils";

import _ from "lodash";
import { env } from "@/env.mjs";
import { motion } from "framer-motion";

type Model = {
  name: string;
  description: string;
  value: string;
  smallIcon: React.ReactNode;
  icon: React.ReactNode;
  color: string;
};

export const modelMap: Record<ChatModel, Model> = {
  [ChatModel.FAST]: {
    name: "Fast",
    description: "",
    value: ChatModel.FAST,
    smallIcon: <Zap className="w-4 h-4" />,
    icon: <Zap className="w-5 h-5" />,
    color: "text-cyan-500",
  },
  [ChatModel.POWERFUL]: {
    name: "Powerful",
    description: "",
    value: ChatModel.POWERFUL,
    smallIcon: <Cpu className="w-4 h-4" />,
    icon: <Cpu className="w-5 h-5" />,
    color: "text-pink-500",
  },
  [ChatModel.TECHNICAL]: {
    name: "Technical",
    description: "",
    value: ChatModel.TECHNICAL,
    smallIcon: <Terminal className="w-4 h-4" />,
    icon: <Terminal className="w-5 h-5" />,
    color: "text-yellow-500",
  },
};

const cloudModelMap: Partial<Record<ChatModel, Model>> = _.pickBy(
  modelMap,
  (_, key) => isCloudModel(key as ChatModel),
);

const ModelItem: React.FC<{ model: Model }> = ({ model }) => (
  <SelectItem
    key={model.value}
    value={model.value}
    className="flex flex-col items-start p-3"
  >
    <div className="flex items-center space-x-3 w-full">
      <div className={`p-2 rounded-lg bg-muted ${model.color}`}>
        {model.icon}
      </div>
      <div className="flex flex-col">
        <span className="font-semibold">{model.name}</span>
        <span className="text-xs text-muted-foreground">{model.description}</span>
      </div>
    </div>
  </SelectItem>
);

export function ModelSelection() {
  const { model, setModel } = useConfigStore();
  const selectedModel = modelMap[model] ?? modelMap[ChatModel.FAST];

  return (
    <Select
      defaultValue={model}
      value={model}
      onValueChange={(value) => {
        if (value) {
          setModel(value as ChatModel);
        }
      }}
    >
      <SelectTrigger className="w-fit space-x-2 bg-transparent outline-none border-none select-none focus:ring-0 shadow-none transition-all duration-200 ease-in-out text-sm h-8 px-2 hover:bg-muted/50 rounded-md">
        <SelectValue>
          <div className="flex items-center space-x-2">
            <div className={`${selectedModel.color}`}>
              {selectedModel.smallIcon}
            </div>
            <span className="font-medium">{selectedModel.name}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="w-[280px]">
        <SelectGroup className="w-full">
          <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Available Models
          </div>
          {Object.values(cloudModelMap).map((model) => (
            <ModelItem key={model.value} model={model} />
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
