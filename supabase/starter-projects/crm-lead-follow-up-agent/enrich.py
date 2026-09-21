"""
Step 2 of the CRM Lead Follow-Up Agent.

A generic follow-up is worse than no follow-up. This file pulls the
contact and recent note history for a deal so writer.py has real
context to personalize with. The two parsing helpers (parse_contact,
parse_notes) are pure functions with no network call, tested below
against fake API response shapes.
"""

# How many recent notes to pull per deal. A MONEY decision as much as a
# UX one: every note becomes extra input-token cost in writer.py's
# prompt, and a deal rarely needs its entire note history to write one
# good follow-up sentence.
MAX_NOTES = 5


def parse_contact(raw_contact):
    """
    Turns a raw HubSpot contact object into the simple shape this
    project uses everywhere:

        {"first_name": "...", "last_name": "...", "email": "...", "job_title": "..."}

    Returns None if raw_contact is None - a deal with no associated
    contact is common and must not crash enrichment. Callers check for
    None rather than this function inventing a placeholder name.
    """
    if raw_contact is None:
        return None

    props = raw_contact.properties if hasattr(raw_contact, "properties") else raw_contact
    return {
        "first_name": props.get("firstname", "").strip(),
        "last_name": props.get("lastname", "").strip(),
        "email": props.get("email", "").strip(),
        "job_title": props.get("jobtitle", "").strip(),
    }


def parse_notes(raw_notes, max_notes=MAX_NOTES):
    """
    Turns a list of raw HubSpot note objects into a list of clean text
    strings, capped at max_notes.

        parse_notes(raw_notes) -> ["Called, left voicemail.", "Sent pricing deck."]

    Skips any note with an empty or missing body rather than including
    a blank string a prompt would have to explain away.
    """
    notes = []
    for raw_note in raw_notes:
        props = raw_note.properties if hasattr(raw_note, "properties") else raw_note
        body = (props.get("hs_note_body") or "").strip()
        if body:
            notes.append(body)
    return notes[:max_notes]


def enrich_deal(client, deal):
    """
    The main function. Given a HubSpot client and one deal, returns:

        {"deal": deal, "contact": parsed_contact_or_None, "recent_notes": [...]}

    Looks up only the FIRST associated contact and up to MAX_NOTES recent
    notes - this project optimizes for "enough context to personalize
    one email," not a complete CRM export.
    """
    contact = None
    contact_associations = client.crm.deals.associations_api.get_all(
        deal.id, to_object_type="contacts"
    )
    if contact_associations.results:
        contact_id = contact_associations.results[0].to_object_id
        raw_contact = client.crm.contacts.basic_api.get_by_id(
            contact_id, properties=["firstname", "lastname", "email", "jobtitle"]
        )
        contact = parse_contact(raw_contact)

    note_associations = client.crm.deals.associations_api.get_all(deal.id, to_object_type="notes")
    raw_notes = [
        client.crm.objects.notes.basic_api.get_by_id(assoc.to_object_id, properties=["hs_note_body"])
        for assoc in note_associations.results[:MAX_NOTES]
    ]

    return {
        "deal": deal,
        "contact": contact,
        "recent_notes": parse_notes(raw_notes),
    }


if __name__ == "__main__":
    # Run this file on its own to check the parsing works - no HubSpot
    # account or network call needed:  python enrich.py
    print("Checking parse_contact()...")
    full_contact = {"firstname": "Amaka", "lastname": "Obi", "email": "amaka@example.com", "jobtitle": "VP Sales"}
    result = parse_contact(full_contact)
    assert result == {"first_name": "Amaka", "last_name": "Obi", "email": "amaka@example.com", "job_title": "VP Sales"}
    print("  OK - full contact parsed correctly")

    assert parse_contact(None) is None
    print("  OK - a deal with no contact correctly returned None")

    sparse_contact = {"firstname": "Chidi", "email": "chidi@example.com"}
    result = parse_contact(sparse_contact)
    assert result["job_title"] == ""
    print("  OK - a contact missing jobtitle/lastname defaulted to '' instead of crashing")

    print("\nChecking parse_notes()...")
    raw_notes = [
        {"hs_note_body": "Called, left voicemail."},
        {"hs_note_body": ""},
        {"hs_note_body": "  Sent the pricing deck.  "},
    ]
    notes = parse_notes(raw_notes)
    assert notes == ["Called, left voicemail.", "Sent the pricing deck."]
    print("  OK - empty note body correctly skipped, whitespace trimmed:", notes)

    many_notes = [{"hs_note_body": f"Note {i}"} for i in range(10)]
    assert len(parse_notes(many_notes)) == MAX_NOTES
    print(f"  OK - capped at {MAX_NOTES} even though 10 notes were given")

    print("\nAll parsing checks passed. Real HubSpot contact/note objects have this exact shape.")
