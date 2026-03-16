"""PDF text extraction."""

import httpx
import pdfplumber
import io


def extract_text_from_pdf_url(pdf_url: str) -> str:
    """Download a PDF from a URL and extract all text."""
    response = httpx.get(pdf_url, timeout=60.0, follow_redirects=True)
    response.raise_for_status()

    text_parts = []
    with pdfplumber.open(io.BytesIO(response.content)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)

    return "\n\n".join(text_parts)
