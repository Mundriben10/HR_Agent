import fitz  # PyMuPDF
import docx
import json
import io

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extracts text from a PDF file."""
    text = ""
    try:
        pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
        for page_num in range(pdf_document.page_count):
            page = pdf_document.load_page(page_num)
            text += page.get_text()
        pdf_document.close()
    except Exception as e:
        print(f"Error parsing PDF: {e}")
        return ""
    return text

def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extracts text from a DOCX file."""
    text = ""
    try:
        doc = docx.Document(io.BytesIO(file_bytes))
        for para in doc.paragraphs:
            text += para.text + "\n"
    except Exception as e:
        print(f"Error parsing DOCX: {e}")
        return ""
    return text

def extract_text_from_json(file_bytes: bytes) -> str:
    """Extracts a structured string from a LinkedIn JSON export."""
    try:
        data = json.loads(file_bytes.decode('utf-8'))
        # We assume the JSON has some common LinkedIn fields, or just dump the whole thing nicely
        # For simplicity, we just convert the structured JSON into a YAML-like text format
        # so the LLM can easily read it.
        text = json.dumps(data, indent=2)
        return text
    except Exception as e:
        print(f"Error parsing JSON: {e}")
        return ""
