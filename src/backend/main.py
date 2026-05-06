import asyncio
import json
import os
import traceback
from typing import Generator
from urllib.parse import urlparse

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sse_starlette.sse import EventSourceResponse, ServerSentEvent

from backend.agent_search import stream_pro_search_qa
from backend.db.chat import get_chat_history, get_thread
from backend.db.engine import get_session
from backend.schemas import (
    ChatHistoryResponse,
    ChatRequest,
    ChatResponseEvent,
    ErrorStream,
    StreamEvent,
    ThreadResponse,
)
from backend.utils import strtobool
from backend.validators import validate_model

load_dotenv()


def create_error_event(detail: str):
    obj = ChatResponseEvent(
        data=ErrorStream(detail=detail),
        event=StreamEvent.ERROR,
    )
    return ServerSentEvent(
        data=json.dumps(jsonable_encoder(obj)),
        event=StreamEvent.ERROR,
    )


def configure_middleware(app: FastAPI):
    # Allow credentials=True requires explicit origins (cannot use "*").
    # Safelist the production frontend and backend origins — add more here or
    # via env vars.
    allowed_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        os.environ.get("FRONTEND_ORIGIN", ""),
        os.environ.get("BACKEND_ORIGIN", ""),
    ]
    # NEXT_PUBLIC_API_URL may include a path suffix (e.g. /back); extract only
    # the origin (scheme + host + optional port) so CORS matching works correctly.
    api_url = os.environ.get("NEXT_PUBLIC_API_URL", "").rstrip("/")
    if api_url:
        try:
            allowed_origins.append(f"{urlparse(api_url).scheme}://{urlparse(api_url).netloc}")
        except Exception:
            allowed_origins.append(api_url)
    allowed_origins = [o for o in allowed_origins if o]  # drop empty strings

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

    # Strip chunked encoding and prevent buffering proxies from holding SSE.
    # Some CDN/proxies (Cloudflare, CloudFront) suppress Transfer-Encoding: chunked
    # unless Content-Encoding is also set. Safari is particularly sensitive to
    # this — a buffered response arrives with Content-Length, which causes
    # fetch() to wait indefinitely for that many bytes before exposing the body.
    @app.middleware("http")
    async def prevent_sse_buffering(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Accel-Buffering"] = "no"
        response.headers["Cache-Control"] = "no-cache"
        # Safari requires Content-Length to be absent for streaming responses.
        # If set, the browser waits for the full Content-Length before delivering
        # any body bytes to JavaScript, which makes SSE appear broken.
        if request.url.path in ("/chat",):
            if "content-length" in response.headers:
                del response.headers["content-length"]
        return response

    # CORSMiddleware handles all OPTIONS preflights automatically; no explicit
    # route needed. The explicit route was causing problems because it bypassed
    # the middleware's header injection when it was defined outside configure_middleware.
    # (Removed explicit @app.options handler)

    @app.options("/{path:path}")
    async def preflight(path: str):
        return {"ok": True}


def create_app() -> FastAPI:
    app = FastAPI()
    configure_middleware(app)
    return app


app = create_app()


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Log 422 details so we can see exactly what Safari is sending vs. what we expect."""
    print(f"[422 ValidationError] path={request.url.path} errors={exc.errors()}")
    raise exc


@app.post("/chat")
async def chat(
    chat_request: ChatRequest, request: Request, session: Session = Depends(get_session)
) -> Generator[ChatResponseEvent, None, None]:
    async def generator():
        try:
            validate_model(chat_request.model)
            chat_request.pro_search = True
            async for obj in stream_pro_search_qa(
                request=chat_request, session=session
            ):
                if await request.is_disconnected():
                    break
                yield json.dumps(jsonable_encoder(obj))
                await asyncio.sleep(0)
        except Exception as e:
            print(traceback.format_exc())
            yield create_error_event(str(e))
            await asyncio.sleep(0)
            return

    return EventSourceResponse(generator(), media_type="text/event-stream")  # type: ignore


@app.get("/history")
async def recents(session: Session = Depends(get_session)) -> ChatHistoryResponse:
    DB_ENABLED = strtobool(os.environ.get("DB_ENABLED", "true"))
    if DB_ENABLED:
        try:
            history = get_chat_history(session=session)
            return ChatHistoryResponse(snapshots=history)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    else:
        raise HTTPException(
            status_code=400,
            detail="Chat history is not available when DB is disabled. Please try self-hosting the app by following the instructions here: https://github.com/rashadphz/farfalle",
        )


@app.get("/thread/{thread_id}")
async def thread(
    thread_id: int, session: Session = Depends(get_session)
) -> ThreadResponse:
    thread = get_thread(session=session, thread_id=thread_id)
    return thread
