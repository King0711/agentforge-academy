"""
Step 2 of the HR Recruitment Screening Agent (part 1) - extracts text
from every CV PDF in a folder.
"""

import os

from PyPDF2 import PdfReader


def read_cvs(folder="cvs"):
    """
    Reads every .pdf file in folder and returns {path: extracted_text}.

        cvs = read_cvs("cvs")

    Skips any file that isn't a .pdf, and skips (with a printed warning,
    not a crash) any PDF that fails to extract at all - a single
    corrupted file in a folder of 20 CVs shouldn't stop the other 19
    from being screened.
    """
    texts = {}
    for filename in sorted(os.listdir(folder)):
        if not filename.lower().endswith(".pdf"):
            continue
        path = os.path.join(folder, filename)
        try:
            reader = PdfReader(path)
            texts[path] = "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as problem:
            print(f"Skipped {filename}: could not read as a PDF ({problem})")
    return texts


if __name__ == "__main__":
    print("This file only wraps real PDF reads from disk - there's no")
    print("offline self-test here. It's exercised for real in Build 3's batch.py,")
    print("once you have real CV PDFs in your cvs/ folder.")
