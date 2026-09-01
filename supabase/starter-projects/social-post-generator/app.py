"""
Step 3 of the Social Media Post Generator - the screen you actually use.

Run it with:      streamlit run app.py
Stop it with:     Ctrl+C in the terminal

Streamlit turns plain Python into a web page. Every time you click
something, Streamlit runs this whole file again from the top. That is
normal - don't be alarmed by it.
"""

import streamlit as st

from article import get_article_text
from generator import PLATFORM_RULES, generate_posts
from sdt_ai import AIError

st.set_page_config(page_title="Social Media Post Generator", page_icon="📱")

st.title("📱 Social Media Post Generator")
st.caption("Paste an article link or some text, and get five ready-to-post versions.")

source = st.text_area(
    "Article link or text",
    height=140,
    placeholder="https://example.com/a-blog-post\n\n...or just paste the article text here.",
)

tone = st.selectbox(
    "Tone",
    ["Educational", "Friendly", "Confident", "Formal", "Inspiring"],
)

if st.button("Generate posts", type="primary"):
    if not source.strip():
        st.warning("Paste a link or some text first.")
        st.stop()

    # A link starts with http. Anything else we treat as the article itself.
    try:
        if source.strip().startswith("http"):
            with st.spinner("Reading the article..."):
                article_text = get_article_text(source.strip())
            st.success(f"Read {len(article_text)} characters from that page.")
        else:
            article_text = source.strip()
    except ValueError as problem:
        st.error(str(problem))
        st.stop()

    try:
        with st.spinner("Writing your posts..."):
            posts = generate_posts(article_text, tone)
    except AIError as problem:
        # These messages are written to be read - show them as they are.
        st.error(str(problem))
        st.stop()
    except ValueError as problem:
        st.error(str(problem))
        st.stop()

    st.divider()

    # Show the platforms in a fixed order so the page doesn't jump around
    # between runs.
    for platform in PLATFORM_RULES:
        if platform not in posts:
            continue
        st.subheader(platform.title())
        # st.code gives you a copy button in the corner for free.
        st.code(posts[platform], language=None, wrap_lines=True)

    missing = [p for p in PLATFORM_RULES if p not in posts]
    if missing:
        st.info(
            "The AI skipped: " + ", ".join(p.title() for p in missing) +
            ". Click Generate again to get the full set."
        )
