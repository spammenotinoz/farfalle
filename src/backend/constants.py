import os
from enum import Enum

from dotenv import load_dotenv

load_dotenv()


class ChatModel(str, Enum):
    FAST = "gemini-2.5-flash-lite"
    POWERFUL = "gemini-3-flash"
    TECHNICAL = "gemini-3-flash-technical"


def get_model_string(model: ChatModel) -> str:
    return model.value
