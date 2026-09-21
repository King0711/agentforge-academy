"""
Step 4 of the SEO Content Writer Agent (part 2) - writes the final
Markdown file with YAML front-matter, ready for a static site generator.
"""


def build_front_matter(meta):
    """
    Turns a validated meta dict into a YAML front-matter block.

        build_front_matter({"meta_title": "...", "meta_description": "...", "slug": "..."})

    Pure function - tested below without touching disk. Wraps title and
    description in double quotes since either commonly contains a colon
    (":"), which YAML would otherwise misinterpret as a new key.
    """
    title = meta["meta_title"].replace('"', '\\"')
    description = meta["meta_description"].replace('"', '\\"')

    return (
        "---\n"
        f'title: "{title}"\n'
        f'description: "{description}"\n'
        f'slug: "{meta["slug"]}"\n'
        "---\n"
    )


def export_article(meta, article_md, filename):
    """Writes filename with YAML front-matter followed by the article body."""
    front_matter = build_front_matter(meta)
    with open(filename, "w", encoding="utf-8") as f:
        f.write(front_matter + "\n" + article_md)
    return filename


if __name__ == "__main__":
    # Run this file on its own to check front-matter building and saving
    # work - no AI call, no credits spent:  python export.py
    import os

    meta = {"meta_title": 'AI Agents: A "Complete" Guide', "meta_description": "Everything you need to know.", "slug": "ai-agents-guide"}

    front_matter = build_front_matter(meta)
    assert front_matter.startswith("---\n")
    assert front_matter.count("---") == 2
    assert '\\"Complete\\"' in front_matter
    print(front_matter)

    print("Checking export_article() writes a real file...")
    path = export_article(meta, "# AI Agents\n\nSome article body.", "test_export.md")
    assert os.path.exists(path)
    with open(path, encoding="utf-8") as f:
        content = f.read()
    assert content.startswith("---\n")
    assert "Some article body." in content
    os.remove(path)
    print("  OK - file written, verified, and cleaned up")

    print("\nAll checks passed.")
