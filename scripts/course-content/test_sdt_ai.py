import copy, importlib, io, json, os, runpy, contextlib, sys
import requests

class Resp:
    def __init__(self, status, payload=None, text=None):
        self.status_code = status
        self._payload = payload
        self.text = text if text is not None else json.dumps(payload)
    def json(self):
        if self._payload is None: raise ValueError("no json")
        return self._payload

calls, queue, sleeps = [], [], []
def fake_post(url, headers=None, json=None, timeout=None, params=None, **kw):
    calls.append({"url": url, "headers": copy.deepcopy(headers), "json": copy.deepcopy(json), "params": params, "timeout": timeout})
    r = queue.pop(0)
    if isinstance(r, Exception): raise r
    return r

ENV_KEYS = ("AI_PROVIDER", "GEMINI_API_KEY", "GEMINI_MODEL", "ANTHROPIC_API_KEY", "CLAUDE_MODEL")
def load(env):
    for k in ENV_KEYS: os.environ.pop(k, None)
    os.environ.update(env)
    import sdt_ai
    m = importlib.reload(sdt_ai)
    m.load_dotenv = lambda *a, **k: None
    m.requests.post = fake_post
    m.time.sleep = lambda s: sleeps.append(s)
    calls.clear(); queue.clear(); sleeps.clear()
    return m

def gok(parts, finish="STOP", usage=None):
    c = {"content": {"role": "model", "parts": parts}, "finishReason": finish}
    d = {"candidates": [c]}
    if usage: d["usageMetadata"] = usage
    return Resp(200, d)

def cok(text, usage=None, stop="end_turn"):
    return Resp(200, {"content": [{"type": "text", "text": text}], "stop_reason": stop, "usage": usage or {"input_tokens": 5, "output_tokens": 7}})

failures = 0
def check(name, cond, detail=""):
    global failures
    print(("PASS " if cond else "FAIL ") + name + ("" if cond else f"  -> {detail}"))
    if not cond: failures += 1

def err(m, fn, needle):
    try:
        r = fn(); return False, f"no error, returned {r!r}"
    except m.AIError as e:
        return needle in str(e), str(e)

G = {"AI_PROVIDER": "gemini", "GEMINI_API_KEY": "gkey-SECRET"}
C = {"AI_PROVIDER": "claude", "ANTHROPIC_API_KEY": "ckey-SECRET"}

# ---------- provider selection ----------
m = load({})
good, msg = err(m, lambda: m.ask_ai("hi"), "No AI provider configured.")
check("no keys -> No AI provider configured", good, msg)
check("no-provider message unchanged", msg == "No AI provider configured.\nAdd ONE of these pairs to your .env file:\n\n    AI_PROVIDER=gemini\n    GEMINI_API_KEY=paste_your_free_key_here\n\n  ...or...\n\n    AI_PROVIDER=claude\n    ANTHROPIC_API_KEY=paste_your_own_key_here\n\nGet a free Gemini key at https://aistudio.google.com/apikey", msg)
m = load({"GEMINI_API_KEY": "g"}); check("auto-detect gemini", m._get_provider() == "gemini")
m = load({"ANTHROPIC_API_KEY": "c"}); check("auto-detect claude", m._get_provider() == "claude")
m = load({"AI_PROVIDER": " Claude ", "GEMINI_API_KEY": "g", "ANTHROPIC_API_KEY": "c"}); check("explicit provider wins, case/space-insensitive", m._get_provider() == "claude")
m = load({"AI_PROVIDER": "gemini"})
good, msg = err(m, lambda: m.ask_ai("hi"), "no GEMINI_API_KEY was found"); check("gemini w/o key -> clear error", good, msg)
m = load({"AI_PROVIDER": "claude"})
good, msg = err(m, lambda: m.ask_ai("hi"), "no ANTHROPIC_API_KEY was found"); check("claude w/o key -> clear error", good, msg)

# ---------- gemini ----------
m = load(G); queue.append(gok([{"text": "Hello there my good friend"}], usage={"promptTokenCount": 8, "candidatesTokenCount": 6}))
r = m.ask_ai_detailed("hi", max_tokens=50)
c0 = calls[0]
check("gemini default model flash-latest", c0["url"] == "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent", c0["url"])
check("key sent in x-goog-api-key header", c0["headers"] == {"x-goog-api-key": "gkey-SECRET"}, c0["headers"])
check("key not in URL or params", "SECRET" not in c0["url"] and not c0["params"], c0)
check("thinkingBudget 0", c0["json"]["generationConfig"].get("thinkingConfig") == {"thinkingBudget": 0}, c0["json"])
check("maxOutputTokens = max_tokens + 1024", c0["json"]["generationConfig"]["maxOutputTokens"] == 1074, c0["json"])
check("user content shape", c0["json"]["contents"] == [{"role": "user", "parts": [{"text": "hi"}]}], c0["json"])
check("no systemInstruction by default", "systemInstruction" not in c0["json"])
check("detailed dict", r == {"text": "Hello there my good friend", "input_tokens": 8, "output_tokens": 6}, r)

m = load(G); queue.append(gok([{"text": "x"}])); m.ask_ai("hi", system="Be terse")
check("gemini systemInstruction", calls[0]["json"]["systemInstruction"] == {"parts": [{"text": "Be terse"}]}, calls[0]["json"])
m = load(G); queue.append(gok([{"text": "x"}])); r = m.ask_ai_detailed("hi")
check("missing usage -> None tokens", r == {"text": "x", "input_tokens": None, "output_tokens": None}, r)

m = load(G); queue.append(gok([{"text": "thinking...", "thought": True}, {"text": "Part one. ", "thoughtSignature": "abc"}, {"text": "Part two."}]))
r = m.ask_ai("hi"); check("joins non-thought parts", r == "Part one. Part two.", r)

m = load(G); queue.append(Resp(200, {"candidates": [{"content": {"role": "model"}, "finishReason": "MAX_TOKENS"}]}))
good, msg = err(m, lambda: m.ask_ai("hi", max_tokens=50), "ran out of room"); check("MAX_TOKENS empty -> ran out of room", good and "max_tokens=4000" in msg and "1074" in msg, msg)
m = load(G); queue.append(Resp(200, {"candidates": [{"finishReason": "MAX_TOKENS"}]}))
good, msg = err(m, lambda: m.ask_ai("hi", max_tokens=3000), "max_tokens=6000"); check("MAX_TOKENS no content key", good, msg)
m = load(G); queue.append(gok([{"text": "partial"}], finish="MAX_TOKENS")); check("MAX_TOKENS with text returns text", m.ask_ai("hi") == "partial")
m = load(G); queue.append(Resp(200, {"candidates": [{"content": {"parts": []}, "finishReason": "RECITATION"}]}))
good, msg = err(m, lambda: m.ask_ai("hi"), "empty answer (finishReason: RECITATION)"); check("RECITATION empty -> readable", good, msg)
m = load(G); queue.append(Resp(200, {"candidates": [{"finishReason": "SAFETY"}]}))
good, msg = err(m, lambda: m.ask_ai("hi"), "safety filter"); check("SAFETY", good, msg)
m = load(G); queue.append(Resp(200, {"promptFeedback": {"blockReason": "PROHIBITED_CONTENT"}}))
good, msg = err(m, lambda: m.ask_ai("hi"), "refused the prompt (PROHIBITED_CONTENT)"); check("blockReason", good, msg)
m = load(G); queue.append(Resp(200, {"weird": 1}))
good, msg = err(m, lambda: m.ask_ai("hi"), "Unexpected reply from Gemini"); check("no candidates", good, msg)

m = load(G); queue.extend([Resp(503, text="overloaded"), Resp(503, text="overloaded"), gok([{"text": "ok"}])])
check("503 retried then succeeds", m.ask_ai("hi") == "ok" and len(calls) == 3 and sleeps == [3, 3], (len(calls), sleeps))
m = load(G); queue.extend([Resp(500, text="internal"), gok([{"text": "ok"}])])
check("500 retried", m.ask_ai("hi") == "ok" and len(calls) == 2)
m = load(G); queue.extend([Resp(503, text="x")] * 3)
good, msg = err(m, lambda: m.ask_ai("hi"), "unavailable after 3 tries"); check("503 x3 -> unavailable", good and len(calls) == 3 and sleeps == [3, 3], (msg, sleeps))
m = load(G); queue.append(Resp(429, text="quota"))
good, msg = err(m, lambda: m.ask_ai("hi"), "rate limit"); check("429", good and len(calls) == 1, msg)
m = load(G); queue.append(Resp(404, text="models/gemini-flash-latest is not found"))
good, msg = err(m, lambda: m.ask_ai("hi"), "updated copy of sdt_ai.py"); check("404 default -> course page advice", good, msg)
m = load({**G, "GEMINI_MODEL": "gemini-2.5-flash"}); queue.append(Resp(404, text="no longer available"))
good, msg = err(m, lambda: m.ask_ai("hi"), "delete that line"); check("404 pinned -> delete GEMINI_MODEL", good and "/models/gemini-2.5-flash:" in calls[0]["url"], msg)
m = load(G); queue.extend([Resp(400, text='{"error": {"message": "Unknown name \\"thinkingConfig\\""}}'), gok([{"text": "ok"}])])
r = m.ask_ai("hi"); check("400 thinking -> retried without thinkingConfig", r == "ok" and "thinkingConfig" not in calls[1]["json"]["generationConfig"] and "thinkingConfig" in calls[0]["json"]["generationConfig"], calls)
m = load(G); queue.append(Resp(400, text="API key not valid"))
good, msg = err(m, lambda: m.ask_ai("hi"), "double check your GEMINI_API_KEY"); check("400 bad key", good and len(calls) == 1, msg)
m = load({**G, "GEMINI_MODEL": "gemini-3.7-pro"}); queue.append(gok([{"text": "ok"}])); m.ask_ai("hi")
check("pro model -> no thinkingConfig", "thinkingConfig" not in calls[0]["json"]["generationConfig"], calls[0]["json"])
m = load(G); queue.append(Resp(403, text="PERMISSION_DENIED"))
good, msg = err(m, lambda: m.ask_ai("hi"), "status 403"); check("other status", good, msg)
m = load(G); queue.append(requests.ConnectionError("https://x/?key=gkey-SECRET"))
try:
    m.ask_ai("hi"); check("network error", False, "no error")
except m.AIError as e:
    check("network error -> readable", "Could not reach Gemini" in str(e), str(e))
    check("network error chain suppressed (no key leak in traceback)", e.__suppress_context__ is True and e.__cause__ is None, (e.__cause__, e.__suppress_context__))

# ---------- claude ----------
m = load(C); queue.append(cok("Hi there friend", usage={"input_tokens": 11, "output_tokens": 4}))
r = m.ask_ai_detailed("hi", system="Be nice", max_tokens=50)
c0 = calls[0]
check("claude url", c0["url"] == "https://api.anthropic.com/v1/messages", c0["url"])
check("claude headers", c0["headers"] == {"x-api-key": "ckey-SECRET", "anthropic-version": "2023-06-01", "Content-Type": "application/json"}, c0["headers"])
check("claude payload", c0["json"] == {"model": "claude-haiku-4-5", "max_tokens": 50, "messages": [{"role": "user", "content": "hi"}], "system": "Be nice"}, c0["json"])
check("claude detailed dict", r == {"text": "Hi there friend", "input_tokens": 11, "output_tokens": 4}, r)
m = load(C); queue.append(cok("x")); m.ask_ai("hi"); check("claude no system key by default", "system" not in calls[0]["json"])
m = load(C); queue.append(Resp(200, {"content": [{"type": "thinking", "thinking": "hmm"}, {"type": "text", "text": "A"}, {"type": "text", "text": "B"}], "usage": {}}))
check("claude joins text blocks only", m.ask_ai("hi") == "AB")
m = load(C); queue.append(Resp(401, {"type": "error", "error": {"type": "authentication_error", "message": "invalid x-api-key"}}))
good, msg = err(m, lambda: m.ask_ai("hi"), "rejected your ANTHROPIC_API_KEY"); check("claude 401", good, msg)
m = load(C); queue.append(Resp(429, {"type": "error", "error": {"type": "rate_limit_error", "message": "rate"}}))
good, msg = err(m, lambda: m.ask_ai("hi"), "rate or usage limit"); check("claude 429", good, msg)
m = load(C); queue.append(Resp(400, {"type": "error", "error": {"type": "invalid_request_error", "message": "Your credit balance is too low to access the Anthropic API."}}))
good, msg = err(m, lambda: m.ask_ai("hi"), "credit balance is too low"); check("claude 400 billing message passes through", good and "status 400" in msg, msg)
m = load(C); queue.append(Resp(404, {"type": "error", "error": {"type": "not_found_error", "message": "model: x"}}))
good, msg = err(m, lambda: m.ask_ai("hi"), "updated copy of sdt_ai.py"); check("claude 404 default", good, msg)
m = load({**C, "CLAUDE_MODEL": "claude-3-haiku-20240307"}); queue.append(Resp(404, {"type": "error", "error": {"type": "not_found_error", "message": "model"}}))
good, msg = err(m, lambda: m.ask_ai("hi"), "delete that line"); check("claude 404 pinned", good and calls[0]["json"]["model"] == "claude-3-haiku-20240307", msg)
m = load(C); queue.extend([Resp(529, {"type": "error", "error": {"type": "overloaded_error", "message": "Overloaded"}}), cok("ok")])
check("claude 529 retried", m.ask_ai("hi") == "ok" and len(calls) == 2 and sleeps == [3])
m = load(C); queue.extend([Resp(529, None, text="<html>")] * 3)
good, msg = err(m, lambda: m.ask_ai("hi"), "Claude was unavailable after 3 tries"); check("claude 529 x3", good and len(calls) == 3, msg)
m = load(C); queue.append(Resp(502, None, text="<html>bad gateway</html>"))
good, msg = err(m, lambda: m.ask_ai("hi"), "Unexpected reply from Claude (status 502)"); check("claude non-json", good, msg)
m = load(C); queue.append(Resp(200, {"content": [], "stop_reason": "refusal"}))
good, msg = err(m, lambda: m.ask_ai("hi"), "empty answer (stop_reason: refusal)"); check("claude empty", good, msg)
m = load(C); queue.append(cok("partial", stop="max_tokens")); check("claude max_tokens partial returns text", m.ask_ai("hi") == "partial")
m = load(C); queue.append(requests.Timeout("t"))
good, msg = err(m, lambda: m.ask_ai("hi"), "Could not reach Claude"); check("claude network", good, msg)

# ---------- self-test output ----------
def run_main(env, responses):
    for k in ENV_KEYS: os.environ.pop(k, None)
    os.environ.update(env)
    queue.clear(); queue.extend(responses)
    orig = requests.post; requests.post = fake_post
    import dotenv; od = dotenv.load_dotenv; dotenv.load_dotenv = lambda *a, **k: None
    buf = io.StringIO()
    try:
        with contextlib.redirect_stdout(buf):
            runpy.run_path("sdt_ai.py", run_name="__main__")
    finally:
        requests.post = orig; dotenv.load_dotenv = od
    return buf.getvalue()

out = run_main(G, [gok([{"text": "Hello friend, how are you?"}])])
print(out)
check("self-test gemini output", "Provider: gemini (gemini-flash-latest)" in out and "The AI said: Hello friend, how are you?" in out and out.rstrip().endswith("Your setup works. You are ready to build."), out)
out = run_main(C, [cok("Hello friend how are you")])
check("self-test claude output", "Provider: claude (claude-haiku-4-5)" in out and out.rstrip().endswith("Your setup works. You are ready to build."), out)
out = run_main({}, [])
check("self-test no provider", "Setup problem:" in out and "No AI provider configured" in out, out)

print("\nFAILURES:", failures)
sys.exit(1 if failures else 0)
