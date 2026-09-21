"""
Step 3 of the LinkedIn Content Creator Agent.

A Streamlit app to review, edit, and approve the week's 5 generated
posts before you copy them into Buffer, Postiz, or LinkedIn directly.
This project doesn't auto-post or auto-schedule anything - a bad post
going out under your name is worse than spending 2 extra minutes
copy-pasting.
"""

import streamlit as st

from generator import generate_posts
from sdt_ai import AIError

st.set_page_config(page_title="LinkedIn Content Creator", page_icon="\U0001F4DD")
st.title("LinkedIn Content Creator")

weekly_input = st.text_area(
    "This week's wins, ideas, and links",
    height=150,
    placeholder="e.g. Shipped the new onboarding flow, signups up 18%. Read a great post about...",
)

if st.button("Generate 5 posts", type="primary"):
    if not weekly_input.strip():
        st.warning("Add a few notes first - even a couple of bullet points works.")
    else:
        with st.spinner("Writing 5 posts in your voice..."):
            try:
                st.session_state["posts"] = generate_posts(weekly_input)
            except AIError as problem:
                st.error(f"AI request failed: {problem}")
            except ValueError as problem:
                st.error(str(problem))

if "posts" in st.session_state:
    for post_type, text in st.session_state["posts"].items():
        with st.expander(post_type.title(), expanded=True):
            st.text_area(
                f"Edit your {post_type.lower()} post",
                value=text,
                height=180,
                key=f"edit_{post_type}",
                label_visibility="collapsed",
            )


if __name__ == "__main__":
    print("This is a Streamlit app - run it with: streamlit run app.py")
    print("There's no offline self-test here - generator.py already covers")
    print("the parsing and cliche-guard logic this app depends on.")
