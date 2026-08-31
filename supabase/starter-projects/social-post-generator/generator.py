"""
Step 2 of the Social Media Post Generator.

This file turns article text into five social media posts - one for each
platform, each written the way that platform expects.
"""

from sdt_ai import ask_ai

# The five platforms, and the rule the AI must follow for each one.
# Change these rules and the posts change. This is the file you will
# edit most when you make this tool your own.
PLATFORM_RULES = {
    "LINKEDIN": "Professional. 3 short paragraphs. End with a question. 3 hashtags.",
    "TWITTER": "Under 280 characters total. Punchy. 2 hashtags maximum.",
    "INSTAGRAM": "Warm and personal. Emojis are welcome. 5 hashtags at the very end.",
    "FACEBOOK": "Conversational, like talking to a friend. 2 or 3 sentences. No hashtags.",
    "THREADS": "Casual and short. Under 400 characters. 1 hashtag.",
}


def build_prompt(article_text, tone):
    """
    Writes the instructions we send to the AI.

    Keeping this in its own function means you can print it and read
    exactly what the AI is being asked, which is the fastest way to
    fix posts you don't like.
    """
    rules = "\n".join(f"[{name}] {rule}" for name, rule in PLATFORM_RULES.items())

    return f"""Write five social media posts about the article below.

Tone for all five posts: {tone}

Write one post for each platform, following its rule exactly:
{rules}

Format your answer EXACTLY like this, with the platform name in square
brackets on its own line, then the post underneath it:

[LINKEDIN]
the LinkedIn post here

[TWITTER]
the Twitter post here

...and so on for INSTAGRAM, FACEBOOK and THREADS.

After the last post, write [END] on its own line.

Do not add any explanation, introduction or closing remark.

ARTICLE:
{article_text}"""


def split_posts(reply):
    """
    Turns the AI's one long answer into a dictionary, one entry per platform.

        {"LINKEDIN": "...", "TWITTER": "...", ...}

    We ask the AI for [PLATFORM] markers rather than JSON on purpose.
    JSON breaks if the AI adds a stray comma or wraps its answer in
    code fences, and debugging that is miserable when you are starting
    out. Markers are forgiving: anything we don't recognise is simply
    ignored instead of crashing the whole program.
    """
    posts = {}
    current_platform = None
    current_lines = []

    for line in reply.splitlines():
        stripped = line.strip()
        marker = stripped.strip("[]").upper()
        is_marker = stripped.startswith("[") and stripped.endswith("]")

        # [END] tells us the posts are finished. Without it, a friendly
        # sign-off like "Let me know if you'd like changes!" gets glued to
        # the bottom of the last post - and you paste it into Threads
        # without noticing. This is why we ask the AI for [END].
        if is_marker and marker == "END":
            break

        if is_marker and marker in PLATFORM_RULES:
            # Save whatever we collected for the previous platform.
            if current_platform:
                posts[current_platform] = "\n".join(current_lines).strip()
            current_platform = marker
            current_lines = []
        elif current_platform:
            # The AI sometimes wraps its whole answer in ``` code fences.
            # Those aren't part of your post, so drop them.
            if stripped.startswith("```"):
                continue
            current_lines.append(line)

    # Don't forget the last one - there's no marker after it to trigger the save.
    if current_platform:
        posts[current_platform] = "\n".join(current_lines).strip()

    return posts


def generate_posts(article_text, tone="Educational"):
    """
    The main function. Give it article text, get back five posts.

        posts = generate_posts(text, tone="Friendly")
        print(posts["LINKEDIN"])
    """
    prompt = build_prompt(article_text, tone)

    # max_tokens caps how long the AI's answer may be, which caps what
    # this costs you. 1200 comfortably fits five posts.
    reply = ask_ai(
        prompt,
        max_tokens=1200,
        project="social-media-post-generator",
    )

    posts = split_posts(reply)

    if not posts:
        raise ValueError(
            "The AI replied, but not in the format we asked for.\n"
            "Run it again - this usually fixes itself.\n"
            "If it keeps happening, print(reply) to see what came back."
        )

    return posts


if __name__ == "__main__":
    # Run this file on its own to check the splitting works:
    #     python generator.py
    fake_reply = """[LINKEDIN]
AI is changing how small businesses operate.

What would you automate first?

[TWITTER]
AI isn't coming for your job. It's coming for your admin. #AI

[INSTAGRAM]
Small business owners are quietly winning with AI right now.
#ai #smallbusiness #automation #tech #growth

[FACEBOOK]
Ever wonder how some shops reply instantly at midnight? It's AI.

[THREADS]
The gap isn't talent anymore. It's tooling. #AI"""

    result = split_posts(fake_reply)
    print(f"Found {len(result)} posts:\n")
    for platform, text in result.items():
        print(f"--- {platform} ---")
        print(text)
        print()
