import os

from backend.constants import ChatModel


def validate_model(model: ChatModel):
    GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
    if not GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY environment variable not found")
    return True
