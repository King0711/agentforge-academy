"""
Step 4 of the Customer Support RAG Bot - exposes answer_question() as a
FastAPI endpoint you can call from a website, Slack bot, or curl.

Run it with:  uvicorn main:app --reload
"""

from fastapi import FastAPI
from pydantic import BaseModel
from rag import answer_question
from sdt_ai import AIError

app = FastAPI()


class ChatRequest(BaseModel):
    question: str


@app.post("/chat")
def chat(request: ChatRequest):
    question = request.question.strip()
    if not question:
        return {"answer": "Please ask a question.", "sources": []}

    try:
        return answer_question(question)
    except AIError as problem:
        return {"answer": f"AI request failed: {problem}", "sources": []}


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    print("This is a FastAPI app - run it with: uvicorn main:app --reload")
    print('Then POST to http://localhost:8000/chat with {"question": "..."}')
