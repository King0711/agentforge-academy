"""
Step 1 of the Contract Clause Extractor (part 1).

Extracts plain text from a PDF or DOCX contract. Newlines are kept
intact since contracts use them as structural cues (section breaks,
numbered clauses) that the AI can use to navigate the document.
"""

from PyPDF2 import PdfReader
from docx import Document


def read_contract(path):
    """
    Reads a .pdf or .docx contract and returns its text, or raises
    ValueError for any other extension.

        text = read_contract("nda.pdf")
    """
    if path.lower().endswith(".pdf"):
        reader = PdfReader(path)
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    if path.lower().endswith(".docx"):
        document = Document(path)
        return "\n".join(paragraph.text for paragraph in document.paragraphs)

    raise ValueError(f"Unsupported file type: {path}. This project reads .pdf and .docx only.")


if __name__ == "__main__":
    print("This file only wraps real PDF/DOCX reads from disk - there's no")
    print("offline self-test here. Run it against a real sample contract in Build 1's")
    print("verify step, once you have one.")
