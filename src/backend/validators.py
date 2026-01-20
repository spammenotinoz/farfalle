import os

from backend.constants import ChatModel


def validate_model(model: ChatModel):
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    if not OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY environment variable not found")
    return True
