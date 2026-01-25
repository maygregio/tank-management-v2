"""Shared utilities for AI-based extraction from documents."""
import json
import logging
import os
from typing import Any

import fitz  # pymupdf
from openai import OpenAI

logger = logging.getLogger(__name__)

# OpenAI client - initialized lazily
_client: OpenAI | None = None


def get_openai_client() -> OpenAI:
    """Get or create a singleton OpenAI client."""
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is not set")
        _client = OpenAI(api_key=api_key)
    return _client


class AIExtractionError(Exception):
    """Raised when AI extraction fails to produce valid JSON."""
    def __init__(self, message: str, raw_content: str | None = None):
        self.message = message
        self.raw_content = raw_content
        super().__init__(self.message)


def parse_ai_json_response(content: str) -> Any:
    """Parse JSON from an AI response, handling code fences and errors.

    Args:
        content: Raw response content from the AI model

    Returns:
        Parsed JSON data (list or dict)

    Raises:
        AIExtractionError: If the response cannot be parsed as JSON
    """
    if not content:
        raise AIExtractionError("Empty response from AI model", content)

    content = content.strip()

    # Handle markdown code blocks if present
    if content.startswith("```"):
        lines = content.split("\n")
        # Remove first and last lines (``` markers)
        if len(lines) >= 2:
            content = "\n".join(lines[1:-1])
        if content.startswith("json"):
            content = content[4:].strip()

    try:
        return json.loads(content)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse AI response as JSON: {e}")
        logger.debug(f"Raw content: {content[:500]}")
        raise AIExtractionError(
            f"AI response is not valid JSON: {e}",
            raw_content=content
        ) from e


def extract_text_from_pdf(pdf_content: bytes) -> str:
    """Extract text content from PDF bytes.

    Args:
        pdf_content: Raw PDF file bytes

    Returns:
        Extracted text from all pages
    """
    doc = fitz.open(stream=pdf_content, filetype="pdf")
    text_parts = []
    for page in doc:
        text_parts.append(page.get_text())
    doc.close()
    return "\n".join(text_parts)


def call_openai_extraction(
    system_prompt: str,
    user_prompt: str,
    max_tokens: int = 4000
) -> Any:
    """Call OpenAI API for extraction and parse the JSON response.

    Args:
        system_prompt: System message describing the extraction task
        user_prompt: User message with the content to extract from
        max_tokens: Maximum tokens for the response

    Returns:
        Parsed JSON data from the AI response

    Raises:
        AIExtractionError: If the response cannot be parsed as JSON
    """
    client = get_openai_client()

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0,
        max_tokens=max_tokens
    )

    content = response.choices[0].message.content
    if content is None:
        raise AIExtractionError("AI model returned no content")

    return parse_ai_json_response(content)
