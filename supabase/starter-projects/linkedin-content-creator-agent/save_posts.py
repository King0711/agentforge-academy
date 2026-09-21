"""
Step 4 of the LinkedIn Content Creator Agent - saves the approved posts
from this week as separate text files, ready to copy into Buffer,
Postiz, or LinkedIn directly.
"""

import os
import re
from datetime import datetime


def _slugify(text):
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug[:30] or "post"


def save_posts(posts, output_dir="posts_output"):
    """
    Saves each post as its own .txt file, named by post type and date.

        paths = save_posts({"INSIGHT": "...", "STORY": "..."})

    One file per post type, not one combined file - you'll copy these
    into a scheduler one at a time, on different days of the week, so a
    combined file just means extra copy-paste work every time.

    Returns the list of paths written.
    """
    os.makedirs(output_dir, exist_ok=True)
    date_str = datetime.now().strftime("%Y%m%d")
    paths = []

    for post_type, text in posts.items():
        path = os.path.join(output_dir, f"{date_str}_{_slugify(post_type)}.txt")
        with open(path, "w", encoding="utf-8") as f:
            f.write(text)
        paths.append(path)

    return paths


if __name__ == "__main__":
    # Run this file on its own to check saving works:  python save_posts.py
    sample = {
        "INSIGHT": "Most teams ship a feature, then wonder why nobody uses it.",
        "STORY": "Three years ago I got rejected from my dream job.",
    }
    paths = save_posts(sample, output_dir="posts_output_test")
    assert len(paths) == 2
    for path in paths:
        assert os.path.exists(path)
    print("Saved", len(paths), "files:")
    for path in paths:
        print(" ", path)

    with open(paths[0], encoding="utf-8") as f:
        saved_content = f.read()
    assert saved_content == sample["INSIGHT"]
    print("\nConfirmed: saved file content matches exactly what was passed in.")
