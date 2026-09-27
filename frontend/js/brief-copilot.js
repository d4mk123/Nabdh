/* ══════════════════════════════════════════════════════════════════
   11. AI TECH BRIEF & CAREER COPILOT (Grok AI)
   ══════════════════════════════════════════════════════════════════ */

let aiTodoListData = [];

function initAiBriefAndCopilot() {
  if (!openAiBriefBtn || !aiBriefOverlay) return;

  // Open modal
  openAiBriefBtn.addEventListener("click", () => {
    aiBriefOverlay.classList.add("open");
    document.body.style.overflow = "hidden";
    generateAiFeedBrief(false);
  });

  // Close modal button
  if (aiBriefCloseBtn) {
    aiBriefCloseBtn.addEventListener("click", () => {
      closeAiBriefModal();
    });
  }

  // Close on outside click
  aiBriefOverlay.addEventListener("click", (e) => {
    if (e.target === aiBriefOverlay) {
      closeAiBriefModal();
    }
  });

  // Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && aiBriefOverlay.classList.contains("open")) {
      closeAiBriefModal();
    }
  });

  // Tab switching
  aiTabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-aitab");
      aiTabBtns.forEach((b) => b.classList.remove("active"));
      aiPanels.forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      const targetPanel = $(`#ai-panel-${tabId}`);
      if (targetPanel) targetPanel.classList.add("active");
    });
  });

  // Re-analyze button
  if (btnRefreshAiBrief) {
    btnRefreshAiBrief.addEventListener("click", () => {
      generateAiFeedBrief(true);
    });
  }

  // Initialize To-Do List & Chat
  initAiTodoList();
  initAiChat();
}

function closeAiBriefModal() {
  if (!aiBriefOverlay) return;
  aiBriefOverlay.classList.remove("open");
  document.body.style.overflow = "";
}

async function generateAiFeedBrief(forceRefresh = false) {
  if (!aiBriefSawTitle || !aiBriefSawText) return;

  // Visual loading feedback on refresh button
  if (btnRefreshAiBrief) {
    btnRefreshAiBrief.disabled = true;
    btnRefreshAiBrief.innerHTML = `
      <svg class="spin-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
      <span>Analyzing with Grok AI...</span>
    `;
  }

  // Collect feed items
  const feedPool = (state.rankedFeed && state.rankedFeed.length > 0) ? state.rankedFeed : state.items;
  const recentItems = feedPool.slice(0, 8);

  // Compute tag breakdown
  const tagCounts = {};
  let totalTags = 0;
  recentItems.forEach((item) => {
    (item.tags || []).forEach((t) => {
      const tagLower = t.toLowerCase();
      tagCounts[tagLower] = (tagCounts[tagLower] || 0) + 1;
      totalTags++;
    });
  });

  // Top tags render
  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (aiBriefTags && sortedTags.length > 0) {
    aiBriefTags.innerHTML = sortedTags
      .map(([tag, count]) => {
        const pct = Math.round((count / (totalTags || 1)) * 100);
        return `<span class="ai-chip">#${tag} (${pct}%)</span>`;
      })
      .join("");
  }

  const titles = recentItems.map((i) => `"${i.title}" (${(i.tags || []).join(", ")})`).join("; ");
  const userRole = state.profile.occupation || "Software Engineer";
  const userInterests = (state.profile.interests || ["AI", "Fullstack", "Cloud"]).join(", ");

  const systemPrompt = `You are the Nabdh Grok AI Tech Analyst for Tunisian tech professionals. 
Analyze the provided user feed and generate a concise structured JSON:
1. "saw_title": A sharp 5-9 word headline summarizing the core theme of what they just viewed.
2. "saw_text": A crisp 2-3 sentence synthesis of what was viewed in the feed, highlighting technical topics (e.g. AI, cloud, local hackathons, Tunisian companies).
3. "world_title": A sharp 5-9 word headline on how this connects to global tech + Tunisian tech landscape.
4. "world_text": A crisp 2-3 sentence analysis of macro tech trends (e.g., open-source LLMs, sovereign cloud, remote engineering demand in Tunisia/Europe).
5. "advice_title": A sharp headline for actionable advice.
6. "advice_text": A crisp 2-3 sentence strategic career advice tailored for a ${userRole} interested in ${userInterests}.

Return ONLY valid JSON matching this schema:
{
  "saw_title": string,
  "saw_text": string,
  "world_title": string,
  "world_text": string,
  "advice_title": string,
  "advice_text": string
}`;

  const userPrompt = `USER PROFILE:\nRole: ${userRole}\nInterests: ${userInterests}\n\nITEMS IN FEED:\n${titles}`;

  try {
    let parsed = null;

    // Try backend /brief if available
    try {
      const briefRes = await fetch("/brief", {
        method: "POST",
        body: JSON.stringify({
          profile: { id: state.profile.id || state.profile.email || "user-default", ...state.profile },
          force: forceRefresh
        })
      if (briefRes.ok) {
        const briefData = await briefRes.json();
        if (briefData?.brief?.signals?.length > 0) {
          const sig = briefData.brief.signals[0];
          parsed = {
            saw_title: sig.headline || "Tunisian Tech Ecosystem Signals",
            saw_text: sig.context || briefData.brief.summary,
            world_title: "Global Tech Trends & Open Models",
            world_text: "Accelerating demand for open-source AI integration, cloud-native backends, and full-stack engineering.",
            advice_title: `Strategic Plan for ${state.profile.name || "Your Profile"}`,
            advice_text: briefData.brief.skills?.[0]?.whyItMatters || "Focus on practical open-source project contributions."
          };
        }
      }
    } catch (e) {
      // Backend brief skipped
    }

    // If direct Grok API key is provided
    if (!parsed && GROK_API_KEY) {
      const isXai = GROK_API_KEY.startsWith("xai-");
      const endpoint = isXai ? "https://api.x.ai/v1/chat/completions" : "https://api.groq.com/openai/v1/chat/completions";
      const model = isXai ? "grok-beta" : GROK_MODEL;
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
          temperature: 0.4
        })
      });
      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || "";
        parsed = JSON.parse(content.replace(/```json\s*|```/g, "").trim());
      }
    }

    if (!parsed) throw new Error("No brief returned");

    if (parsed.saw_title) aiBriefSawTitle.textContent = parsed.saw_title;
    if (parsed.saw_text) aiBriefSawText.textContent = parsed.saw_text;
    if (parsed.world_title) aiBriefWorldTitle.textContent = parsed.world_title;
    if (parsed.world_text) aiBriefWorldText.textContent = parsed.world_text;
    if (parsed.advice_title) aiBriefAdviceTitle.textContent = parsed.advice_title;
    if (parsed.advice_text) aiBriefAdviceText.textContent = parsed.advice_text;
  } catch (err) {
    console.warn("AI Feed Brief fallback used:", err);
    const topTag = sortedTags[0] ? sortedTags[0][0].toUpperCase() : "AI & CLOUD";
    aiBriefSawTitle.textContent = `Deep Dive: ${topTag} & Modern Infrastructure in Tunisia`;
    aiBriefSawText.textContent = `Your feed spotlighted practical ${userInterests} engineering, cloud deployments across Tunisian companies (Vermeg, Telnet, Expensya alumni), and upcoming student hackathons at INSAT & ESPRIT.`;
    aiBriefWorldTitle.textContent = "Open-Source LLMs, Grok AI & Sovereign Cloud";
    aiBriefWorldText.textContent = "Globally, open-weight reasoning models like GPT-OSS 120b and Grok are democratizing AI integration into web applications. In Tunisia, demand is surging for engineers capable of building fast, AI-augmented backends.";
    aiBriefAdviceTitle.textContent = `Strategic 30-Day Plan for ${state.profile.name || "You"}`;
    aiBriefAdviceText.textContent = `Double down on containerizing AI workflows using Docker and FastAPI. Build one high-visibility portfolio project tailored to local Tunisian datasets or Darija NLP to catch tech recruiters' attention.`;
  } finally {
    if (btnRefreshAiBrief) {
      btnRefreshAiBrief.disabled = false;
      btnRefreshAiBrief.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        <span>Re-analyze Feed</span>
      `;
    }
  }
}

/* ── To-Do List Management ────────────────────────────────── */
function initAiTodoList() {
  const saved = localStorage.getItem("nabdh_ai_todos");
  if (saved) {
    try {
      aiTodoListData = JSON.parse(saved);
    } catch (e) {
      aiTodoListData = [];
    }
  }

  if (!aiTodoListData || aiTodoListData.length === 0) {
    aiTodoListData = [
      { id: "td1", text: "Integrate Grok / Open-Source LLM API in a test sandbox project", done: false },
      { id: "td2", text: "Containerize web application using a multi-stage Dockerfile", done: true },
      { id: "td3", text: "RSVP for the upcoming INSAT AI & Cloud Hackathon", done: false },
      { id: "td4", text: "Publish an open-source Darija NLP or Tunisian Tech repository on GitHub", done: false },
      { id: "td5", text: "Optimize fullstack CI/CD pipeline using GitHub Actions", done: false }
    ];
    saveAiTodoList();
  }

  renderAiTodoList();

  if (aiTodoAddForm && aiTodoInput) {
    aiTodoAddForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = aiTodoInput.value.trim();
      if (!val) return;
      aiTodoListData.push({
        id: "td_" + Date.now(),
        text: val,
        done: false
      });
      aiTodoInput.value = "";
      saveAiTodoList();
      renderAiTodoList();
    });
  }
}

function saveAiTodoList() {
  localStorage.setItem("nabdh_ai_todos", JSON.stringify(aiTodoListData));
}

function renderAiTodoList() {
  if (!aiTodoList) return;
  aiTodoList.innerHTML = "";

  const completedCount = aiTodoListData.filter((t) => t.done).length;
  if (todoProgressText) {
    todoProgressText.textContent = `${completedCount} of ${aiTodoListData.length} completed`;
  }

  aiTodoListData.forEach((item) => {
    const el = document.createElement("div");
    el.className = `todo-item ${item.done ? "done" : ""}`;
    el.innerHTML = `
      <input type="checkbox" class="todo-checkbox" ${item.done ? "checked" : ""} aria-label="Mark task done" />
      <span class="todo-text">${escapeHtml(item.text)}</span>
      <button type="button" class="todo-delete-btn" title="Delete task">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;

    const checkbox = el.querySelector(".todo-checkbox");
    checkbox.addEventListener("change", () => {
      item.done = checkbox.checked;
      saveAiTodoList();
      renderAiTodoList();
    });

    const deleteBtn = el.querySelector(".todo-delete-btn");
    deleteBtn.addEventListener("click", () => {
      aiTodoListData = aiTodoListData.filter((t) => t.id !== item.id);
      saveAiTodoList();
      renderAiTodoList();
    });

    aiTodoList.appendChild(el);
  });
}

/* ── Interactive Copilot Chat ─────────────────────────────── */
function initAiChat() {
  if (!aiChatForm || !aiChatInput || !aiChatMessages) return;

  aiChatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = aiChatInput.value.trim();
    if (!query) return;
    aiChatInput.value = "";
    await sendAiChatMessage(query);
  });

  const suggestions = $$(".chat-suggest-btn");
  suggestions.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const q = btn.getAttribute("data-query") || btn.textContent.trim();
      await sendAiChatMessage(q);
    });
  });
}

async function sendAiChatMessage(query) {
  // Append user message
  appendChatMessage("user", query);

  // Append AI typing bubble
  const typingId = "ai-typing-" + Date.now();
  const typingBubble = document.createElement("div");
  typingBubble.className = "chat-msg ai-msg";
  typingBubble.id = typingId;
  typingBubble.innerHTML = `
    <div class="msg-avatar">Grok</div>
    <div class="msg-bubble">
      <div class="ai-typing-indicator">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;
  aiChatMessages.appendChild(typingBubble);
  aiChatMessages.scrollTop = aiChatMessages.scrollHeight;

  // Build context
  const userRole = state.profile.occupation || "Developer";
  const userInterests = (state.profile.interests || ["AI", "Tech"]).join(", ");
  const feedHeadlines = (state.rankedFeed || state.items || []).slice(0, 5).map((i) => i.title).join("; ");

  const systemInstruction = `You are Nabdh Grok AI Copilot, an elite technical advisor and career mentor for Tunisian tech professionals, students, and engineers.
Context:
- User is: ${userRole}, interested in ${userInterests}.
- Recent feed highlights: ${feedHeadlines}.
- Focus on practical, actionable advice, clear code/architectural suggestions, and realistic opportunities in Tunisia and remote tech.
- Format responses cleanly using short paragraphs and bullet points.`;

  try {
    let replyText = null;

    if (GROK_API_KEY) {
      const isXai = GROK_API_KEY.startsWith("xai-");
      const endpoint = isXai ? "https://api.x.ai/v1/chat/completions" : "https://api.groq.com/openai/v1/chat/completions";
      const model = isXai ? "grok-beta" : GROK_MODEL;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROK_API_KEY}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: query }
          ],
          temperature: 0.7
        })
      });
      if (res.ok) {
        const data = await res.json();
        replyText = data.choices?.[0]?.message?.content;
      }
    }

    if (!replyText) throw new Error("Grok direct response unavailable");

    // Remove typing bubble and append AI reply
    const el = document.getElementById(typingId);
    if (el) el.remove();
    appendChatMessage("ai", replyText);
  } catch (err) {
    console.warn("AI Chat offline mode:", err);
    const el = document.getElementById(typingId);
    if (el) el.remove();
    appendChatMessage("ai", `I'm currently operating in offline mode. Here is a quick insight on your question:
- For **${escapeHtml(query)}**: Focus on combining clean full-stack fundamentals (Next.js/FastAPI) with containerized deployment (Docker) and exploring Grok / open-source AI integrations. Check the **Roadmap** and **Action To-Do List** tabs for your immediate next steps!`);
  }
}

function appendChatMessage(role, text) {
  if (!aiChatMessages) return;
  const msgEl = document.createElement("div");
  msgEl.className = `chat-msg ${role === "user" ? "user-msg" : "ai-msg"}`;

  // Simple formatting for bold, bullets, and linebreaks
  const formatted = escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n\s*-\s*(.*?)(?=\n|$)/g, "<li>$1</li>")
    .replace(/\n\n/g, "<br><br>")
    .replace(/\n/g, "<br>");

  msgEl.innerHTML = `
    <div class="msg-avatar">${role === "user" ? ((state.profile.name || "") ? state.profile.name[0].toUpperCase() : "U") : "Grok"}</div>
    <div class="msg-bubble">
      <p>${formatted}</p>
    </div>
  `;
  aiChatMessages.appendChild(msgEl);
  aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
}
