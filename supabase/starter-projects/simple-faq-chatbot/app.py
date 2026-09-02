"""
Step 3 of the Simple FAQ Chatbot - the screen you actually use.

Run it with:      streamlit run app.py
Stop it with:     Ctrl+C in the terminal

Streamlit reruns this whole file top-to-bottom every time you send a
message. That is normal - it's why the FAQ text and chat history both
live in st.session_state below, instead of a plain variable, which would
reset to empty on every single message.
"""

import streamlit as st

from chatbot import ask_faq_bot, looks_unanswered
from faq import load_faq
from sdt_ai import AIError

st.set_page_config(page_title="FAQ Assistant", page_icon="💬")

st.title("💬 FAQ Assistant")
st.caption("Ask a question - answers come only from the FAQ this bot was given.")

# Load the FAQ once per session, not on every rerun. It's the same file
# every time, so re-reading it on every keystroke is wasted disk work -
# cheap on its own, but there's no reason to pay it repeatedly.
if "faq_text" not in st.session_state:
    try:
        st.session_state.faq_text = load_faq()
    except (FileNotFoundError, ValueError) as problem:
        st.error(str(problem))
        st.stop()

if "messages" not in st.session_state:
    st.session_state.messages = []

# Replay the conversation so far on every rerun - without this, the chat
# window would appear empty again after every message you send, even
# mid-conversation.
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.write(message["content"])

question = st.chat_input("Ask a question about the business...")

if question:
    st.session_state.messages.append({"role": "user", "content": question})
    with st.chat_message("user"):
        st.write(question)

    answer = None
    with st.chat_message("assistant"):
        try:
            # Send only the last 6 messages as history - enough for the AI
            # to follow a quick "what about weekends?" follow-up, without
            # resending an ever-growing transcript that costs more credits
            # with every single turn of a long conversation.
            with st.spinner("Checking the FAQ..."):
                answer = ask_faq_bot(
                    st.session_state.faq_text,
                    question,
                    history=st.session_state.messages[:-1][-6:],
                )
            st.write(answer)

            if looks_unanswered(answer):
                st.info(
                    "Didn't find what you needed? Contact the business "
                    "directly using the details in the FAQ."
                )
        except AIError as problem:
            # These messages are written to be read - show them as they are.
            st.error(str(problem))

    if answer is not None:
        st.session_state.messages.append({"role": "assistant", "content": answer})
