import os
from enum import Enum

from dotenv import load_dotenv

load_dotenv()


class ChatModel(str, Enum):
    FAST = "fast-latest"
    THINKING = "thinking-latest"
    TECHNICAL = "technical-latest"


def get_model_string(model: ChatModel) -> str:
    return model.value
