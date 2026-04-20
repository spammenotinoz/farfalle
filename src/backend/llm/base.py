import json
import os
import re
from abc import ABC, abstractmethod
from typing import AsyncIterator

import httpx
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()


class BaseLLM(ABC):
    @abstractmethod
    async def astream(self, prompt: str) -> AsyncIterator[str]:
        """Stream tokens one at a time as an async generator."""
        pass

    @abstractmethod
    async def astream_tokens(self, prompt: str) -> AsyncIterator[str]:
        """Alias for astream - yields tokens one at a time."""
        pass

    @abstractmethod
    async def complete(self, prompt: str) -> str:
        pass

    @abstractmethod
    async def structured_complete(self, response_model: type[BaseModel], prompt: str) -> BaseModel:
        pass


class OpenAILLM(BaseLLM):
    def __init__(self, model: str = "thinking-latest"):
        self.api_key = os.environ.get("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")

        self.base_url = os.environ.get("OPENAI_API_BASE", "https://api.openai.com/v1")
        self.model = model
        self.client = httpx.AsyncClient(timeout=120.0)

    async def astream(self, prompt: str) -> AsyncIterator[str]:
        """Yield tokens one at a time for true streaming."""
        url = f"{self.base_url}/chat/completions"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        data = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "stream": True,
        }

        async with self.client.stream("POST", url, json=data, headers=headers) as response:
            async for chunk in response.aiter_lines():
                if chunk.startswith("data: "):
                    chunk_data = chunk[6:]
                    if chunk_data != "[DONE]":
                        try:
                            json_data = json.loads(chunk_data)
                            delta = json_data.get("choices", [{}])[0].get("delta", {}).get("content")
                            if delta:
                                yield delta
                        except json.JSONDecodeError:
                            continue

    async def astream_tokens(self, prompt: str) -> AsyncIterator[str]:
        """Alias for astream."""
        async for token in self.astream(prompt):
            yield token

    async def complete(self, prompt: str) -> str:
        url = f"{self.base_url}/chat/completions"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        data = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
        }

        response = await self.client.post(url, json=data, headers=headers)
        response.raise_for_status()
        json_data = response.json()
        return json_data.get("choices", [{}])[0].get("message", {}).get("content", "")

    async def structured_complete(self, response_model: type[BaseModel], prompt: str) -> BaseModel:
        url = f"{self.base_url}/chat/completions"
        headers = {"Authorization": f"Bearer {self.api_key}"}

        fields = []
        for name, field_info in response_model.model_fields.items():
            fields.append('"' + name + '": "<value>"')
        schema_str = '{"' + response_model.__name__ + '": {' + ', '.join(fields) + '}}'
        instruction = "\n\nIMPORTANT: Respond ONLY with valid JSON matching this exact schema:\n" + schema_str + "\nDo not include any text outside the JSON."
        full_prompt = prompt + instruction

        data = {
            "model": self.model,
            "messages": [{"role": "user", "content": full_prompt}],
            "temperature": 0.1,
        }

        response = await self.client.post(url, json=data, headers=headers)
        response.raise_for_status()
        json_data = response.json()
        content = json_data.get("choices", [{}])[0].get("message", {}).get("content", "")

        json_match = re.search(r'```json\s*(\{.*?\})\s*```', content, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
        else:
            json_match = re.search(r'\{[\s\S]*\}', content)
            if json_match:
                json_str = json_match.group(0)
            else:
                json_str = content

        json_str = json_str.strip()
        if not json_str.startswith('{'):
            first_brace = json_str.find('{')
            if first_brace != -1:
                json_str = json_str[first_brace:]

        try:
            return response_model.model_validate_json(json_str)
        except Exception:
            defaults = {}
            for name, field_info in response_model.model_fields.items():
                if field_info.default is not None:
                    defaults[name] = field_info.default
                elif field_info.default_factory is not None:
                    defaults[name] = field_info.default_factory()
            return response_model.model_construct(**defaults)

    async def close(self):
        await self.client.aclose()
