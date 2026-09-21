"""
Step 3 of the Invoice Processing Agent (continued) - watches the
invoices/ folder and processes any new PDF automatically.
"""

import os
import time

from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

# A file appearing in a folder doesn't mean it's finished being written -
# a slow upload or sync client can trigger on_created before all bytes
# have landed. This delay gives that a moment to finish before PyPDF2
# tries to read a half-written file.
PROCESS_DELAY_SECONDS = 2


def is_pdf_file(path):
    """Pure function - tested below without touching the filesystem."""
    return path.lower().endswith(".pdf")


class InvoiceHandler(FileSystemEventHandler):
    """
    Calls process_fn(path) for every new .pdf file created in the
    watched folder. Kept as its own class so is_pdf_file() above can be
    tested without ever starting a real filesystem watcher.
    """

    def __init__(self, process_fn):
        self.process_fn = process_fn

    def on_created(self, event):
        if event.is_directory or not is_pdf_file(event.src_path):
            return
        time.sleep(PROCESS_DELAY_SECONDS)
        self.process_fn(event.src_path)


def start_watching(folder, process_fn):
    """
    Watches folder forever, calling process_fn(path) for each new PDF.
    Also processes any PDF already sitting in the folder at startup, so
    invoices dropped in while the script wasn't running still get caught.
    """
    for filename in os.listdir(folder):
        if is_pdf_file(filename):
            process_fn(os.path.join(folder, filename))

    handler = InvoiceHandler(process_fn)
    observer = Observer()
    observer.schedule(handler, folder, recursive=False)
    observer.start()

    print(f"Watching {folder}/ for new invoices. Press Ctrl+C to stop.")
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()


if __name__ == "__main__":
    # Run this file on its own to check the pure filtering logic works -
    # no filesystem watcher started, no PDFs needed:  python watcher.py
    assert is_pdf_file("invoice.pdf") is True
    assert is_pdf_file("INVOICE.PDF") is True
    assert is_pdf_file("readme.txt") is False
    assert is_pdf_file("invoice.pdf.tmp") is False
    print("is_pdf_file() correctly recognises .pdf files regardless of case, and rejects everything else.")
    print("\nAll checks passed. To actually watch a folder, run main.py with no arguments (Build 4).")
