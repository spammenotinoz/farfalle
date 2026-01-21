import os
from abc import ABC, abstractmethod

import instructor
from dotenv import load_dotenv
from openai import AsyncOpenAI
from pydantic import BaseModel

load_dotenv()


class BaseLLM(ABC):
    @abstractmethod
    async def astream(self, prompt: str) -> str:
        pass

    @abstractmethod
    async def complete(self, prompt: str) -> str:
        pass

    @abstractmethod
    async def structured_complete(self, response_model: type[BaseModel], prompt: str) -> BaseModel:
        pass


class OpenAILLM(BaseLLM):
    def __init__(self, model: str = "gemini-3-flash"):
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")

        base_url = os.environ.get("OPENAI_API_BASE")

        self.client = instructor.apatch(
            AsyncOpenAI(api_key=api_key, base_url=base_url),
            mode=instructor.Mode.JSON,
        )
        self.model = model

    async def astream(self, prompt: str) -> str:
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            stream=True,
        )
        full_response = ""
        async for chunk in response:
            if chunk.choices[0].delta.content:
                full_response += chunk.choices[0].delta.content
        return full_response

    async def complete(self, prompt: str) -> str:
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.choices[0].message.content or ""

    async def structured_complete(self, response_model: type[BaseModel], prompt: str) -> BaseModel:
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            response_model=response_model,
        )
        return response
