import re
import io
import pdfplumber
import docx2txt

def clean_text(text: str) -> str:
    """Clean excess whitespaces and consecutive newlines to optimize tokens."""
    if not text:
        return ""
    # Replace 3 or more consecutive newlines with 2 newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Replace multiple spaces/tabs with a single space
    text = re.sub(r'[ \t]+', ' ', text)
    # Strip leading/trailing whitespaces
    return text.strip()

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract and clean text from a PDF file using pdfplumber."""
    text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return clean_text(text)

def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract and clean text from a DOCX file using docx2txt."""
    text = docx2txt.process(io.BytesIO(file_bytes))
    return clean_text(text)
