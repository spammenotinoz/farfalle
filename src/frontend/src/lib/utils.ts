import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { ChatModel } from "../../generated";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isLocalModel(model: ChatModel) {
  return !isCloudModel(model);
}

export function isCloudModel(model: ChatModel) {
  return [
    ChatModel.LLAMA_3_70B,
    ChatModel.GPT_4O,
    ChatModel.GPT_4O_MINI,
	ChatModel.Claude-3.5-Sonnet,
  ].includes(model);
}
