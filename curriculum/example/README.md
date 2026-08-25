# The smallest possible example

Three files. This is the shape every agent in Builder 1 takes.

```
example/
├── llm.py         ← the shim. Same file in every project. Students never edit it.
├── my_agent.py    ← the agent. This is the part students write (with AI help).
└── notes.txt      ← something to feed it.
```

## Run it

```bash
pip install google-genai groq python-dotenv
export GEMINI_API_KEY="your_free_key_from_aistudio.google.com"
python my_agent.py notes.txt
```

You should get three bullet points summarising the standup notes.

## The point

Look at `my_agent.py`. One AI-related line:

```python
from llm import chat
```

That's it. It never mentions Gemini, Groq, Claude, or any SDK. It asks `chat()` for an
answer and gets text back.

Now switch provider — get a free key at console.groq.com and:

```bash
export GROQ_API_KEY="your_groq_key"
export LLM_PROVIDER="groq"
python my_agent.py notes.txt
```

Same output, different company, **and you did not touch `my_agent.py`.**

That is the whole idea. Every agent across the four weeks works this way: `llm.py`
handles the AI provider, the agent handles the actual job. When a company changes its
pricing or retires a model, students change one line instead of rewriting twelve agents.
