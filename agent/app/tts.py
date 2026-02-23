"""
Text-to-Speech via ElevenLabs API.

Converts text to mp3 audio bytes, returned as a base64 string.
Uses httpx for async HTTP calls to the ElevenLabs REST API.
"""

import base64
import logging
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

ELEVENLABS_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech"


async def text_to_speech(text: str) -> str | None:
    """
    Convert text to speech using ElevenLabs API.
    Returns base64-encoded mp3 string, or None on failure.
    """
    if not settings.ELEVEN_LABS_API_KEY:
        return None

    url = f"{ELEVENLABS_TTS_URL}/{settings.ELEVEN_LABS_VOICE_ID}"

    try:
        headers = {
            "xi-api-key": settings.ELEVEN_LABS_API_KEY,
            "Content-Type": "application/json",
        }
        body = {
                    "text": text,
                    "model_id": settings.ELEVEN_LABS_MODEL_ID,
                }
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                url,
                params={"output_format": "mp3_44100_64"},
                headers=headers,
                json=body,
            )
            resp.raise_for_status()
            audio_bytes = resp.content
            return base64.b64encode(audio_bytes).decode("utf-8")
    except Exception:
        logger.exception("TTS failed for text: %s...", text[:50])
        return None
