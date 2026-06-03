import pdfplumber

def extract_text_from_pdf(file_path: str) -> str:
    """Extracts text from a given PDF file."""
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"Error extracting PDF: {e}")
    return text

def extract_text_from_docx(file_path: str) -> str:
    """Extracts text from a given DOCX file."""
    # Placeholder for docx extraction (e.g., using python-docx)
    return ""
