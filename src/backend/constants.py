import os
from enum import Enum

from dotenv import load_dotenv

load_dotenv()


class ChatModel(str, Enum):
    CLAUDE_4_SONNET = "claude-4-sonnet"
    GPT_4_1 = "gpt-4.1"
    GPT_4_1_mini = "gpt-4.1-mini"
    COMMAND_R = "command-r"

    # Local models
    LOCAL_LLAMA_3 = "llama3.1"
    LOCAL_GEMMA = "gemma"
    LOCAL_MISTRAL = "mistral"
    LOCAL_PHI3_14B = "phi3:14b"

    # Custom models
    CUSTOM = "custom"


model_mappings: dict[ChatModel, str] = {
    ChatModel.GPT_4_1: "gpt-4.1",
    ChatModel.GPT_4_1_mini: "gpt-4.1-mini",
    ChatModel.CLAUDE_4_SONNET: "openai/claude-4-sonnet",
}


def get_model_string(model: ChatModel) -> str:
    if model == ChatModel.CUSTOM:
        custom_model = os.environ.get("CUSTOM_MODEL")
        if custom_model is None:
            raise ValueError("CUSTOM_MODEL is not set")
        return custom_model

    if model in {ChatModel.GPT_4_1_mini, ChatModel.GPT_4_1, ChatModel.CLAUDE_4_SONNET}:
        openai_mode = os.environ.get("OPENAI_MODE", "openai")
        if openai_mode == "azure":
            # Currently deployments are named "gpt-35-turbo" and "gpt-4o"
            name = model_mappings[model].replace(".", "")
            return f"azure/{name}"

    return model_mappings[model]
