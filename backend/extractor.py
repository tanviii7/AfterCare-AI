import os
from pypdf import PdfReader
from io import BytesIO
from google import genai
from google.genai import types
from backend.config import settings

class ReportExtractor:
    def __init__(self):
        self.client = None
        if settings.GEMINI_API_KEY:
            try:
                self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
            except Exception as e:
                print(f"Extractor GenAI Init Error: {e}")

    def extract_text_from_pdf(self, file_bytes: bytes) -> str:
        """Extracts text from a standard PDF using pypdf."""
        try:
            pdf_file = BytesIO(file_bytes)
            reader = PdfReader(pdf_file)
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
            
            # If text is empty, it might be a scanned PDF. Attempt OCR using Gemini if available.
            if not text.strip() and self.client:
                text = self.extract_ocr_from_file(file_bytes, "application/pdf")
            
            return text
        except Exception as e:
            print(f"Error reading PDF: {e}")
            return ""

    def extract_ocr_from_file(self, file_bytes: bytes, mime_type: str) -> str:
        """Sends the document/image to Gemini for OCR and text extraction."""
        if not self.client:
            return "Gemini API key missing. Cannot perform OCR on scanned files or images."

        try:
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[
                    types.Part.from_bytes(
                        data=file_bytes,
                        mime_type=mime_type
                    ),
                    "Please extract all text and values from this medical document. Do not summarize or omit results. Maintain the layout structure (test names, reference values, and patient readings) exactly."
                ]
            )
            return response.text
        except Exception as e:
            print(f"OCR Extraction Error: {e}")
            return f"Error extracting text from file via OCR: {str(e)}"

    def summarize_and_analyze(self, text: str, surgery_type: str = None) -> dict:
        """Uses Gemini to summarize the medical report, translate terms, and suggest recovery highlights."""
        if not self.client:
            return {
                "summary": "Summary unavailable: Gemini API key missing.",
                "analysis": "Analysis unavailable: Gemini API key missing."
            }

        try:
            prompt = f"""
            Analyze the following medical report text for a patient who recently underwent {surgery_type or 'surgery'}.
            Provide a clean JSON structure with exactly two keys:
            1. 'summary': A simple, 3-4 sentence explanation of the report in patient-friendly, non-technical language.
            2. 'recommendations': A list of 3-5 specific recovery actions or precautions the patient should follow based on these results.

            Report Text:
            {text}

            Response MUST be a valid JSON. Do not include markdown code blocks in the json itself.
            """
            
            response = self.client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            
            import json
            result = json.loads(response.text)
            return result
        except Exception as e:
            print(f"Summarize and Analyze Error: {e}")
            return {
                "summary": "Failed to analyze report: An error occurred during Gemini summarization.",
                "recommendations": [
                    "Check with your doctor regarding the specific parameters of your report.",
                    "Ensure you schedule follow-up blood tests as instructed by your hospital.",
                    "Track symptoms such as fever, swelling, or pain changes closely."
                ]
            }

report_extractor = ReportExtractor()
