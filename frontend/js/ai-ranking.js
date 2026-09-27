/* ══════════════════════════════════════════════════════════════════
   7. GROK AI RANKING (Backend POST /rank with Direct Grok Fallback)
   ══════════════════════════════════════════════════════════════════ */

const SEED_TAGS = ["ai", "ml", "cloud", "fintech", "cybersecurity", "data engineering", "startups"];

function interestsToTags(interests) {
  const out = new Set();
  for (const raw of interests || []) {
    const label = String(raw).toLowerCase().trim();
    if (!label) continue;
    for (const tag of SEED_TAGS) {
      if (label.includes(tag) || tag.includes(label)) out.add(tag);
    }
    if (label.includes("machine learning") || label.includes("data science")) out.add("ml");
    if (label.includes("data")) out.add("data engineering");
  }
  return [...out];
}

function buildRankRequestBody(profile) {
  const labels = Array.isArray(profile.interests) ? profile.interests : [];
  return {
    profile: {
      name: [profile.name, profile.surname].filter(Boolean).join(" ") || null,
      occupation: profile.occupation || null,
      interests: [...new Set([...labels, ...interestsToTags(labels)])],
    },
  };
}

async function callRankApi(profile) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch("/rank", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildRankRequestBody(profile)),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`rank endpoint responded ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function callDirectGrokApi(profile, items) {
  if (!GROK_API_KEY) throw new Error("No direct Grok API key configured");
  const isXai = GROK_API_KEY.startsWith("xai-");
  const endpoint = isXai
    ? "https://api.x.ai/v1/chat/completions"
    : "https://api.groq.com/openai/v1/chat/completions";
  const model = isXai ? "grok-beta" : GROK_MODEL;

  const systemPrompt = `You are Grok AI for Nabdh, ranking a Tunisian tech feed.
Rank the items for this profile: ${JSON.stringify(profile)}.
Return ONLY a valid JSON array: [{"id":"<item-id>","score":<0-100>,"reason":"<short reason>"},...]`;

  const userPrompt = `ITEMS:\n${JSON.stringify(items.map(({ id, title, type, tags }) => ({ id, title, type, tags })))}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROK_API_KEY}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3
    })
  });
  if (!res.ok) throw new Error(`Grok API ${res.status}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";
  const cleaned = text.replace(/```json\s*|```/g, "").trim();
  return JSON.parse(cleaned);
}

async function rankFeed() {
  if (state.isRanking) return;
  state.isRanking = true;
  if (aiStatusMessage) aiStatusMessage.textContent = "Grok AI ranking your feed...";

  try {
    let ranked = null;
    let modelName = GROK_MODEL;

    // Try backend /rank first
    try {
      const data = await callRankApi(state.profile);
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        ranked = data.items;
        modelName = data.model || (data.source === "model" ? GROK_MODEL : "Grok AI Fallback");
      }
    } catch (backendErr) {
      // If direct Grok key is available, attempt direct API call
      if (GROK_API_KEY) {
        ranked = await callDirectGrokApi(state.profile, state.items);
        modelName = GROK_API_KEY.startsWith("xai-") ? "grok-beta" : GROK_MODEL;
      } else {
        throw backendErr;
      }
    }

    if (!ranked || !Array.isArray(ranked)) throw new Error("No ranking items returned");

    const itemMap = new Map(state.items.map((it) => [it.id, it]));
    const result = ranked.filter((r) => itemMap.has(r.id)).map((r) => ({ ...itemMap.get(r.id), score: r.score, reason: r.reason }));
    for (const item of state.items) {
      if (!result.find((r) => r.id === item.id)) {
        result.push({ ...item, score: 5, reason: "Not directly related to your current focus" });
      }
    }
    state.rankedFeed = result;
    if (aiStatusMessage) aiStatusMessage.textContent = `Ranked by Grok AI for ${state.profile.name}`;
    if (aiModelTag) aiModelTag.textContent = modelName;
  } catch (err) {
    console.warn("AI rank fallback active:", err);
    state.rankedFeed = clientFallbackRank();
    if (aiStatusMessage) aiStatusMessage.textContent = "Offline ranking active";
    if (aiModelTag) aiModelTag.textContent = "offline-fallback";
  }

  state.isRanking = false;
  renderFeed();
}

function clientFallbackRank() {
  const interestSet = new Set((state.profile.interests || []).map((t) => t.toLowerCase()));
  return [...state.items].map((it) => {
    const tags = (it.tags || []).map((t) => t.toLowerCase());
    let score = 25;
    const matched = [];
    for (const t of tags) { if (interestSet.has(t)) { score += 25; matched.push(t); } }
    return { ...it, score: Math.min(score, 99), reason: matched.length > 0 ? `Matches your focus on ${matched.slice(0, 2).join(" & ")}` : "Relevant Tunisian tech opportunity" };
  }).sort((a, b) => b.score - a.score);
}
