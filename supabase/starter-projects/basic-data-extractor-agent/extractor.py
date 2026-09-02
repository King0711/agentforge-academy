"""
Step 1 of the Basic Data Extractor Agent.

This file has one job: given raw unstructured text (a business card
blurb, an email signature, a listing - anything), ask the AI to pull out
a handful of specific fields, then turn its reply into a clean dict.
"""

from sdt_ai import ask_ai

# The fields we ask the AI to find, and a precise one-line description of
# what counts for each. The wording matters more than it looks - without
# "a person's name (not a company or product name)", the AI will happily
# hand back "EcoBrew" or "TechNova Inc." for NAME, which technically fills
# the marker but is the wrong extraction for a name column.
FIELDS = {
    "NAME": "The full name of a specific person mentioned in the text (not a company or product name).",
    "EMAIL": "An email address mentioned in the text.",
    "PHONE": "A phone number mentioned in the text, in whatever format it appears.",
    "DATE": "A specific date mentioned in the text (a deadline, listing date, event date, etc.).",
    "AMOUNT": "A specific monetary amount mentioned in the text (a price, salary, fee), including its currency symbol or code.",
}


def build_prompt(text):
    """
    Writes the instructions we send to the AI.

    Keeping this in its own function means you can print it and read
    exactly what the AI was asked, which is the fastest way to fix a
    field that keeps coming back wrong.
    """
    field_list = "\n".join(f"[{name}] {description}" for name, description in FIELDS.items())

    return f"""Extract the following fields from the text below.

Fields to find:
{field_list}

Format your answer EXACTLY like this, one marker per line followed by
the value on the next line:

[NAME]
value or none

[EMAIL]
value or none

...and so on for PHONE, DATE and AMOUNT.

After the last field, write [END] on its own line.

IMPORTANT: if a field is not clearly present in the text, write exactly
the word "none" under that marker. Do NOT guess, estimate, or invent a
plausible-looking value - a confidently wrong answer is worse than an
honest "none", because whoever reads the CSV later has no way to tell
the difference between a real value and a guess.

Do not add any explanation, introduction or closing remark.

TEXT:
{text}"""


def parse_fields(reply):
    """
    Turns the AI's reply into a dict, one entry per field:

        {"NAME": "Sarah Okafor", "EMAIL": "...", "PHONE": None, ...}

    Same [MARKER] approach as the Social Post Generator's split_posts()
    (see generator.py in that project) - we ask for bracket markers
    rather than JSON on purpose. JSON breaks the whole parse on a single
    stray comma or a markdown code fence around the reply; markers
    degrade gracefully, one field at a time.

    A field the AI marked "none" comes back as a real Python None, not
    the string "none" - that way pandas writes a genuinely blank cell
    later instead of every empty column literally saying "none".

    Any marker we don't recognise (and everything under it, until the
    next marker we DO recognise) is dropped rather than glued onto
    whichever field happened to be active - otherwise an AI that adds an
    unrequested [NOTES] section would silently corrupt the field before it.
    """
    values = {}
    current_field = None
    current_lines = []

    def save_current():
        if current_field:
            value = "\n".join(current_lines).strip()
            values[current_field] = None if value.lower() == "none" else value

    for line in reply.splitlines():
        stripped = line.strip()
        marker = stripped.strip("[]").upper()
        is_marker = stripped.startswith("[") and stripped.endswith("]") and len(stripped) > 2

        if is_marker and marker == "END":
            break

        if is_marker and marker in FIELDS:
            save_current()
            current_field = marker
            current_lines = []
        elif is_marker:
            # An unrecognised marker. Save whatever field we were
            # building, then stop collecting until the next marker we
            # DO recognise - see the docstring above for why.
            save_current()
            current_field = None
            current_lines = []
        elif current_field:
            # The AI sometimes wraps its whole answer in ``` code fences.
            # Those aren't part of a value, so drop them.
            if stripped.startswith("```"):
                continue
            current_lines.append(line)

    save_current()

    # Every field always ends up as a key, even one the AI's reply never
    # produced a marker for at all (rare, but the reply shape isn't
    # guaranteed) - so main.py and csv_writer.py can rely on every
    # record having the same keys.
    for name in FIELDS:
        values.setdefault(name, None)

    return values


def extract_fields(text, source_file=None):
    """
    The main function. Give it raw text, get back a dict of fields.

        data = extract_fields(open("sample_data/business_card.txt").read())
        print(data["EMAIL"])
    """
    prompt = build_prompt(text)

    # max_tokens caps how long the AI's answer may be, which caps what
    # this costs you. Five short field values (a name, an email, a
    # phone number...) comfortably fit in 200 tokens - there's no
    # paragraph-length output here, just a handful of short values.
    reply = ask_ai(
        prompt,
        max_tokens=200,
        project="basic-data-extractor-agent",
    )

    data = parse_fields(reply)
    if source_file:
        data["source_file"] = source_file

    return data


if __name__ == "__main__":
    # Run this file on its own to check the parsing works - no AI call,
    # no credits spent, just proving parse_fields() handles real and
    # awkward replies correctly:  python extractor.py
    print("--- Testing a normal reply ---")
    normal_reply = """[NAME]
Sarah Okafor

[EMAIL]
sarah.okafor@fintechsolutions.ng

[PHONE]
+234 803 555 0192

[DATE]
none

[AMOUNT]
none

[END]"""
    result = parse_fields(normal_reply)
    for field, value in result.items():
        print(f"{field}: {value!r}")
    assert result["NAME"] == "Sarah Okafor"
    assert result["DATE"] is None

    print("\n--- Testing a reply with a missing field (must be None, not a crash) ---")
    missing_reply = """[NAME]
David Chen

[EMAIL]
david.chen@brightpathconsulting.com

[PHONE]
none

[DATE]
none

[AMOUNT]
none

[END]"""
    result = parse_fields(missing_reply)
    assert result["PHONE"] is None, "A field marked 'none' by the AI must parse to None, not the string 'none'"
    print("PHONE correctly parsed as:", result["PHONE"])
    print("Full result:", result)

    print("\n--- Testing a reply with extra, unrecognised markers (must be ignored, not crash) ---")
    extra_marker_reply = """[NAME]
Chidinma Eze

[EMAIL]
none

[PHONE]
0807 123 4567

[DATE]
2026-08-15

[AMOUNT]
NGN 85,000,000

[CONFIDENCE]
high

[NOTES]
This is a real estate listing, not a business card.

[END]"""
    result = parse_fields(extra_marker_reply)
    assert "CONFIDENCE" not in result, "Unrecognised markers must be ignored, not added to the result"
    assert "NOTES" not in result, "Unrecognised markers must be ignored, not added to the result"
    assert result["AMOUNT"] == "NGN 85,000,000", "The real AMOUNT value must survive an unrecognised marker right after it"
    assert result["EMAIL"] is None
    print("Unrecognised markers correctly ignored. Full result:", result)

    print("\nAll parser self-tests passed.")
