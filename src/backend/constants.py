import os
from enum import Enum

from dotenv import load_dotenv

load_dotenv()


class ChatModel(str, Enum):
    CLAUDE_3_5_SONNET = "Claude 3.5 Sonnet"
    GPT_4o = "gpt-4o"
    GPT_4o_mini = "gpt-4o-mini"
    COMMAND_R = "command-r"

    # Local models
    LOCAL_LLAMA_3 = "llama3.1"
    LOCAL_GEMMA = "gemma"
    LOCAL_MISTRAL = "mistral"
    LOCAL_PHI3_14B = "phi3:14b"

    # Custom models
    CUSTOM = "custom"


model_mappings: dict[ChatModel, str] = {
    ChatModel.GPT_4o: "gpt-4o",
    ChatModel.GPT_4o_mini: "gpt-4o-mini",
    ChatModel.CLAUDE_3_5_SONNET: "Claude 3.5 Sonnet",
}


def get_model_string(model: ChatModel) -> str:
    if model == ChatModel.CUSTOM:
        custom_model = os.environ.get("CUSTOM_MODEL")
        if custom_model is None:
            raise ValueError("CUSTOM_MODEL is not set")
        return custom_model

    if model in {ChatModel.GPT_4o_mini, ChatModel.GPT_4o}:
        openai_mode = os.environ.get("OPENAI_MODE", "openai")
        if openai_mode == "azure":
            # Currently deployments are named "gpt-35-turbo" and "gpt-4o"
            name = model_mappings[model].replace(".", "")
            return f"azure/{name}"

    return model_mappings[model]
