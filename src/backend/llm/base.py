import os
from abc import ABC, abstractmethod
import asyncio

import instructor
from dotenv import load_dotenv
from instructor.client import T
from litellm import completion
from litellm.utils import validate_environment
from llama_index.core.base.llms.types import (
    CompletionResponse,
    CompletionResponseAsyncGen,
)
from llama_index.llms.litellm import LiteLLM

load_dotenv()


class BaseLLM(ABC):
    @abstractmethod
    async def astream(self, prompt: str) -> CompletionResponseAsyncGen:
        pass

    @abstractmethod
    def complete(self, prompt: str) -> CompletionResponse:
        pass

    @abstractmethod
    async def structured_complete(self, response_model: type[T], prompt: str) -> T:
        pass


class EveryLLM(BaseLLM):
    def __init__(
        self,
        model: str,
        litellm_api_base: str,
    ):
        self.model = model
        self.litellm_api_base = litellm_api_base
        self.api_key = os.getenv("LITELLM_API_KEY")
        
        # Create a wrapper function that mimics the OpenAI client structure
        class ChatCompletions:
            @staticmethod
            def create(*args, **kwargs):
                return completion(*args, **kwargs)
        
        class Chat:
            completions = ChatCompletions()
        
        class Client:
            chat = Chat()
        
        # Use the wrapper with instructor
        self.client = instructor.patch(Client())

    async def astream(self, prompt: str) -> CompletionResponseAsyncGen:
        response = completion(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            stream=True,
            api_base=self.litellm_api_base,
            api_key=self.api_key,
        )
        
        async for chunk in response:
            yield chunk

    def complete(self, prompt: str) -> CompletionResponse:
        return completion(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            api_base=self.litellm_api_base,
            api_key=self.api_key,
        )

    async def structured_complete(self, response_model: type[T], prompt: str) -> T:
        return await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            response_model=response_model,
            api_base=self.litellm_api_base,
            api_key=self.api_key,
        )