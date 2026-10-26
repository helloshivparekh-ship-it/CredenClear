import asyncio
import pymupdf
from google import genai
from google.genai import types

from coi_parser import COIExtraction

# 1. Initialize the async client
client = genai.Client()

async def parse_coi_async(pdf_path: str, semaphore: asyncio.Semaphore) -> dict:
    # The semaphore ensures we don't blast the API with 1,000 requests at once
    async with semaphore:
        # Convert PDF to bytes (keep this synchronous or run in a thread pool)
        doc = pymupdf.open(pdf_path)
        page = doc.load_page(0)
        image_bytes = page.get_pixmap(dpi=150).tobytes("png")

        prompt = "Extract the COI fields..."

        # 2. Use the async version of the Gemini client (client.aio)
        response = await client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                prompt,
                types.Part.from_bytes(data=image_bytes, mime_type='image/png')
            ],
            config={
                'response_mime_type': 'application/json',
                'response_schema': COIExtraction,
                'temperature': 0.0
            }
        )
        return response.parsed

async def process_thousands_of_pdfs(pdf_paths: list[str]):
    # Allow 10 PDFs to be processed at the exact same time
    semaphore = asyncio.Semaphore(10) 
    
    # Create a list of tasks
    tasks = [parse_coi_async(pdf, semaphore) for pdf in pdf_paths]
    
    # Run them all concurrently
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return results