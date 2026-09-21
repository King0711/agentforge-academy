"""
Challenge: prove the citation guard actually catches an invented source
number, using the real synthesizer end-to-end - not just parse_brief()'s
own offline self-test in Build 3.

This run WILL spend a small number of real AI calls - unlike every other
self-test in this project.
"""

from synthesize import synthesize

TOPIC = "a deliberately obscure, narrow topic with very few real sources"
SOURCES = [
    {
        "title": "The Only Real Source",
        "url": "https://example.com/only-real-source",
        "snippet": "The only real, genuine fact available on this topic is that it exists and has exactly one documented source.",
    },
]

if __name__ == "__main__":
    brief = synthesize(TOPIC, SOURCES)
    for section, text in brief.items():
        print(f"{section}:\n{text}\n")

    # TODO: there is only ONE real source above (valid_source_count=1).
    # Search the printed brief for any "[Source 2]" or higher. If the AI
    # ever invents one, confirm it is followed by
    # "(unverified citation removed)" rather than appearing as a clean,
    # confident-looking citation to a source that was never given to it.
