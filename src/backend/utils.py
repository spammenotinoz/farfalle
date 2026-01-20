import os

from backend.constants import ChatModel


def is_local_model(model: ChatModel) -> bool:
    return False


def strtobool(val: str | bool) -> bool:
    if isinstance(val, bool):
        return val
    return val.lower() in ("true", "1", "t")


DB_ENABLED = strtobool(os.environ.get("DB_ENABLED", "true"))
PRO_MODE_ENABLED = strtobool(os.environ.get("PRO_MODE_ENABLED", "true"))
