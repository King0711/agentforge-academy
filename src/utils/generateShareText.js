// Template-based share copy — not a live LLM call (deliberate: no new API
// cost/secret, works instantly). Built from the agent's own catalog
// description plus whatever the student told us about their build, so it
// still reads as tailored to what they actually made.
function pickBlurb(submission) {
  if (submission?.description?.trim()) return submission.description.trim();
  return null;
}

export function generateShareText({ agent, submission }) {
  const blurb = pickBlurb(submission);
  const hasVideo = Boolean(submission?.video_url);
  const hashtags = '#AIBuilder #SocialDevTechnologies #BuildInPublic #AIAgents';

  const whatIBuilt = blurb
    ? blurb
    : agent.description;

  const linkedin = [
    `I just built ${agent.title} as part of Builder 1 at Social Dev Technologies. 🚀`,
    '',
    whatIBuilt,
    '',
    hasVideo
      ? "I recorded a quick walkthrough of it in action — link in the comments/below."
      : 'Still figuring out how to explain it best, but genuinely proud of getting this working end to end.',
    '',
    "If you're curious about building your own AI agents — not just using AI, but actually building with it — this is exactly the kind of thing Builder 1 teaches.",
    '',
    hashtags,
  ].join('\n');

  const instagram = [
    `New build 🔧 ${agent.title}`,
    '',
    whatIBuilt,
    '',
    hasVideo ? '🎥 Video up — check it out!' : '',
    '',
    hashtags,
  ].filter(Boolean).join('\n');

  const facebook = [
    `Just wrapped up a project I'm pretty excited about: ${agent.title}.`,
    '',
    whatIBuilt,
    '',
    "Building this with Social Dev Technologies' Builder 1 program — going from 'I use AI' to 'I build with AI,' one project at a time.",
    '',
    hasVideo ? "Video's below if you want to see it in action 👇" : '',
  ].filter(Boolean).join('\n');

  return { linkedin, instagram, facebook };
}
