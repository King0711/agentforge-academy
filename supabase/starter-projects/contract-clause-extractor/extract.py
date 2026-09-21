"""
Step 2 of the Contract Clause Extractor.

Sends the contract text to the AI and gets back structured data for
every clause type: an exact quote, a plain-English summary, and a risk
rating. This project's safety guard verifies that each claimed "exact
quote" actually appears in the source contract - a hallucinated quote
in a legal-review tool is a serious problem, not a cosmetic one.
"""

import json

from sdt_ai import ask_ai

VALID_RISK_LEVELS = {"red", "yellow", "green"}

# Stop sending contract text after this many characters. Longer
# contracts should be split in half and the JSON results merged (see
# this build's goFurther) - this cap is a reasonable ceiling for a
# typical 10-20 page commercial agreement.
MAX_CHARACTERS = 12000

RISK_RUBRIC = """Rate each clause's risk using this rubric:
red    - unusual or unfavorable to our side (e.g. uncapped liability, one-sided termination rights)
yellow - present but worth a second look (e.g. vague timelines, ambiguous scope)
green  - standard, favorable, or industry-typical language"""


def build_prompt(contract_text, clause_types):
    trimmed = contract_text[:MAX_CHARACTERS]
    clause_list = "\n".join(f"- {c}" for c in clause_types)

    return f"""Below is a contract. For each clause type listed, find:
- exact_text: a VERBATIM quote from the contract below, copied exactly
  (or the string "Not found" if this contract has no such clause - never
  paraphrase or invent text that isn't literally present)
- summary: one plain-English sentence explaining what it means
- risk: red, yellow, or green

{RISK_RUBRIC}

CLAUSE TYPES:
{clause_list}

Return ONLY this JSON shape, no markdown code fence, no explanation:
{{"clauses": {{"<clause type>": {{"exact_text": "...", "summary": "...", "risk": "..."}}}}}}

CONTRACT TEXT:
{trimmed}"""


def parse_extraction_reply(reply):
    """Defensive JSON parsing, same pattern used throughout this course. Returns None on real garbage."""
    cleaned = reply.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return None


def _normalize_for_matching(text):
    """Collapses whitespace so a quote spanning a line break still matches the source text."""
    return " ".join(text.split())


def verify_exact_text(clauses, contract_text):
    """
    Checks every clause's exact_text against the actual contract text,
    and adds a "verified" boolean to each clause.

        verify_exact_text(clauses, contract_text)

    A clause marked "Not found" is always verified=True - there's
    nothing to check, since the AI is explicitly saying it found no such
    clause. Everything else must appear, after whitespace normalization,
    as a literal substring of the contract - if it doesn't, "verified"
    is set to False so a lawyer knows to double-check that quote by hand
    rather than trusting it at face value. This never changes exact_text
    itself, it only flags it.
    """
    normalized_contract = _normalize_for_matching(contract_text)

    for clause_type, data in clauses.items():
        exact_text = data.get("exact_text", "")
        if exact_text.strip().lower() == "not found":
            data["verified"] = True
            continue

        data["verified"] = _normalize_for_matching(exact_text) in normalized_contract

    return clauses


def validate_risk_levels(clauses):
    """
    Normalizes each clause's risk value against VALID_RISK_LEVELS -
    anything the AI wrote that isn't cleanly red/yellow/green becomes
    "unclear" rather than silently being treated as, say, "green" by a
    downstream string comparison that happens not to match anything.
    """
    for data in clauses.values():
        risk = str(data.get("risk", "")).strip().lower()
        data["risk"] = risk if risk in VALID_RISK_LEVELS else "unclear"
    return clauses


def extract_clauses(contract_text, clause_types):
    """
    The main function. Give it the contract text and a list of clause
    types, get back a validated {clause_type: {...}} dict - every quote
    checked against the source, every risk level normalized.
    """
    prompt = build_prompt(contract_text, clause_types)
    reply = ask_ai(prompt, max_tokens=4000, project="contract-clause-extractor")

    parsed = parse_extraction_reply(reply)
    if parsed is None or "clauses" not in parsed:
        raise ValueError(
            "The AI's reply wasn't valid JSON in the expected shape.\n"
            "Run it again - this usually fixes itself.\n"
            "If it keeps happening, print(reply) to see what came back."
        )

    clauses = parsed["clauses"]
    clauses = validate_risk_levels(clauses)
    clauses = verify_exact_text(clauses, contract_text)
    return clauses


if __name__ == "__main__":
    # Run this file on its own to check parsing and both guards work -
    # no AI call, no credits spent:  python extract.py
    contract_text = (
        "This Agreement shall be governed by the laws of the State of Delaware. "
        "Payment is due within 30 days of invoice."
    )

    print("Checking verify_exact_text() with a real quote...")
    clauses = {"Governing Law": {"exact_text": "governed by the laws of the State of Delaware", "risk": "green"}}
    result = verify_exact_text(clauses, contract_text)
    assert result["Governing Law"]["verified"] is True
    print("  OK - a real substring verified True")

    print("\nChecking verify_exact_text() with a hallucinated quote...")
    clauses = {"Non-Compete": {"exact_text": "Employee shall not compete for 5 years after termination", "risk": "red"}}
    result = verify_exact_text(clauses, contract_text)
    assert result["Non-Compete"]["verified"] is False
    print("  OK - text that never appears in the contract correctly flagged verified=False")

    print("\nChecking verify_exact_text() treats 'Not found' as always verified...")
    clauses = {"Insurance Requirements": {"exact_text": "Not found", "risk": "green"}}
    result = verify_exact_text(clauses, contract_text)
    assert result["Insurance Requirements"]["verified"] is True
    print("  OK")

    print("\nChecking validate_risk_levels() normalizes an unrecognised risk value...")
    clauses = {"Payment Terms": {"risk": "Moderate"}}
    result = validate_risk_levels(clauses)
    assert result["Payment Terms"]["risk"] == "unclear"
    print("  OK - 'Moderate' correctly normalized to 'unclear' instead of silently passing through")

    print("\nChecking parse_extraction_reply() strips a ```json code fence...")
    fenced = '```json\n{"clauses": {}}\n```'
    assert parse_extraction_reply(fenced) == {"clauses": {}}
    print("  OK")

    print("\nAll checks passed.")
