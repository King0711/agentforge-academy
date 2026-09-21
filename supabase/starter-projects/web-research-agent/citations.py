"""
Step 3 (continued) of the Web Research Agent - turns the numbered sources
into a References list that matches the [Source N] citations
synthesize.py produces.
"""


def build_reference_list(sources):
    """
    Turns a list of {"title", "url", "snippet"} dicts into a Markdown
    References section.

        refs = build_reference_list(sources)
        print(refs)

    Numbering here MUST match build_context() in synthesize.py exactly -
    both start at 1 and walk `sources` in the same order - since a
    [Source 3] citation in the brief is meaningless if this list numbers
    the same source differently.
    """
    lines = ["## References", ""]
    for i, source in enumerate(sources, start=1):
        lines.append(f"{i}. [{source['title']}]({source['url']})")
    return "\n".join(lines)


if __name__ == "__main__":
    # Run this file on its own to check it works:  python citations.py
    sample_sources = [
        {"title": "AI in Sales 2025", "url": "https://example.com/a", "snippet": "..."},
        {"title": "Enterprise Adoption Report", "url": "https://example.com/b", "snippet": "..."},
    ]
    refs = build_reference_list(sample_sources)
    print(refs)
    assert "1. [AI in Sales 2025](https://example.com/a)" in refs
    assert "2. [Enterprise Adoption Report](https://example.com/b)" in refs
    print("\nAll checks passed.")
