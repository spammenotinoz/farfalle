import json
import os
import re
from abc import ABC, abstractmethod

import httpx
from dotenv import load_dotenv
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
    def __init__(self, model: str = "thinking-latest"):
        self.api_key = os.environ.get("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")

        self.base_url = os.environ.get("OPENAI_API_BASE", "https://api.openai.com/v1")
        self.model = model
        self.client = httpx.AsyncClient(timeout=60.0)

    async def astream(self, prompt: str) -> str:
        url = f"{self.base_url}/chat/completions"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        data = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "stream": True,
        }

        full_response = ""
        async with self.client.stream("POST", url, json=data, headers=headers) as response:
            async for chunk in response.aiter_lines():
                if chunk.startswith("data: "):
                    chunk_data = chunk[6:]
                    if chunk_data != "[DONE]":
                        json_data = json.loads(chunk_data)
                        delta = json_data.get("choices", [{}])[0].get("delta", {}).get("content")
                        if delta:
                            full_response += delta
        return full_response

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

        # For Gemini, add JSON mode instruction to the prompt
        instruction = f'\n\nRespond with valid JSON matching this schema:\n{response_model.model_json_schema()}'
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

        # Extract JSON from the response (handle markdown code blocks)
        json_match = re.search(r'```json\s*(\{.*?\})\s*```', content, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
        else:
            # Try to find any JSON object
            json_match = re.search(r'\{[^{}]*\}', content, re.DOTALL)
            if json_match:
                json_str = json_match.group(0)
            else:
                json_str = content

        try:
            return response_model.model_validate_json(json_str)
        except Exception:
            return None

    async def close(self):
        await self.client.aclose()
