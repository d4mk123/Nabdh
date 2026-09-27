/* ══════════════════════════════════════════════════════════════════
   9. FEED RENDERING, CARD ACTIONS & AUTO-SYNC
   ══════════════════════════════════════════════════════════════════ */

function loadSquadsAndTrending() {
  renderTrending(TRENDING_TOPICS);
}

function renderTrending(trending) {
  if (!trendingContainer) return;
  trendingContainer.innerHTML = trending.map((t) => `
    <div class="trending-item" data-query="${t.tag.replace('#', '')}">
      <div>
        <div class="trend-tag">${escapeHtml(t.tag)}</div>
        <div class="trend-reads">${t.count}</div>
      </div>
      <div class="trend-delta">${t.delta}</div>
    </div>
  `).join("");

  trendingContainer.addEventListener("click", (e) => {
    const item = e.target.closest(".trending-item");
    if (!item) return;
    if (searchInput) searchInput.value = item.dataset.query;
    state.searchQuery = item.dataset.query.toLowerCase();
    renderFeed();
  });
}

function getCardAvatarSvg(type) {
  if (type === "job") {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`;
  } else if (type === "internship") {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`;
  } else if (type === "event") {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;
  } else {
    return `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><line x1="10" y1="6" x2="18" y2="6"/><line x1="10" y1="10" x2="18" y2="10"/><line x1="10" y1="14" x2="18" y2="14"/></svg>`;
  }
}

function formatPhotoDate(dateStr) {
  if (!dateStr) return "17 Sept";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  } catch {
    return dateStr;
  }
}

function renderFeed() {
  let displayList = [...state.rankedFeed];

  if (state.activeView === "popular") {
    displayList.sort((a, b) => (state.upvotes[b.id] || 0) - (state.upvotes[a.id] || 0));
  } else if (state.activeView === "recent") {
    displayList.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  } else if (state.activeView === "bookmarks") {
    displayList = displayList.filter((it) => state.bookmarks.has(it.id));
  }

  if (state.activeType !== "all") displayList = displayList.filter((it) => it.type === state.activeType);

  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    displayList = displayList.filter((it) => (it.title || "").toLowerCase().includes(q) || (it.description || "").toLowerCase().includes(q) || (it.tags || []).some((t) => t.toLowerCase().includes(q)));
  }

  if (feedCountBadge) feedCountBadge.textContent = displayList.length;
  if (bookmarkCountBadge) bookmarkCountBadge.textContent = state.bookmarks.size;

  if (displayList.length === 0) {
    if (cardsContainer) cardsContainer.innerHTML = "";
    if (emptyFeed) emptyFeed.classList.remove("hidden");
    return;
  }
  if (emptyFeed) emptyFeed.classList.add("hidden");

  if (cardsContainer) {
    cardsContainer.innerHTML = displayList.map((item) => {
      const isBookmarked = state.bookmarks.has(item.id);
      const upvoteCount = state.upvotes[item.id] || 0;
      const isUpvoted = state.upvotes[`${item.id}_voted`] === true;
      const isDismissed = state.feedback.some((f) => f.itemId === item.id && !f.relevant);

      let matchHeadline = "Matches your focus on backend";
      if (item.reason && item.reason.trim()) {
        matchHeadline = item.reason.trim();
      } else if (item.tags && item.tags.length > 0) {
        matchHeadline = `Matches your focus on ${item.tags[0].toLowerCase()}`;
      } else {
        matchHeadline = `Matches your focus on ${item.type || 'tech'}`;
      }

      // Clean concise title without redundant suffixes
      let cleanTitle = item.title || "";
      if (cleanTitle.includes(" — ")) {
        const parts = cleanTitle.split(" — ");
        if (parts[0].length >= 8) cleanTitle = parts[0];
      }

      const locPart = item.location ? item.location.split(',')[0].trim() : "Tunis";

      return `
        <article class="nabdh-card ${isDismissed ? "dismissed" : ""}" data-id="${item.id}">
          <!-- Top Author / Company Header -->
          <div class="card-header">
            <div class="card-avatar-box">
              ${getCardAvatarSvg(item.type)}
            </div>
            <div class="card-author-meta">
              <div class="card-author-line">
                <span class="card-company-name">${escapeHtml(item.source || "Tunisia Tech")}</span>
                <span class="verified-badge-circle" title="Verified">&#10003;</span>
              </div>
              <div class="card-sub-meta">
                <span>${escapeHtml(locPart)}</span>
                <span class="meta-dot">•</span>
                <span>${formatPhotoDate(item.date)}</span>
              </div>
            </div>
            <span class="card-type-pill card-type-pill--${item.type}">${item.type}</span>
          </div>

          <!-- Crisp Pro Title -->
          <h2 class="card-title">
            <a href="javascript:void(0)" class="card-title-link" data-card-click="${item.id}">${escapeHtml(cleanTitle)}</a>
          </h2>

          <!-- Clean Summary -->
          <p class="card-summary">${escapeHtml(item.description)}</p>

          <!-- Rounded Pill Tags -->
          ${item.tags && item.tags.length > 0 ? `
            <div class="card-tags-row">
              ${item.tags.map((t) => `<span class="card-tag">#${escapeHtml(t)}</span>`).join("")}
            </div>
          ` : ""}

          <!-- Photo-Matching AI Match Equalizer Banner -->
          <div class="card-match-banner" data-card-click="${item.id}">
            <div class="match-banner-left">
              <div class="match-bars-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <line x1="6" y1="20" x2="6" y2="13" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                  <line x1="12" y1="20" x2="12" y2="7" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                  <line x1="18" y1="20" x2="18" y2="11" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="match-banner-text">
                <div class="match-title">${escapeHtml(matchHeadline)}</div>
                <div class="match-score-text">${item.score != null ? `${item.score}% match` : "50% match"}</div>
              </div>
            </div>
            <div class="match-banner-arrow">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>

          <!-- Card Bottom Toolbar -->
          <div class="card-toolbar">
            <div class="toolbar-left">
              <button class="tool-btn tool-btn--upvote ${isUpvoted ? "active" : ""}" data-action="upvote" data-id="${item.id}" title="Upvote">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
                <span>${upvoteCount}</span>
              </button>
              <button class="tool-btn tool-btn--comment" data-action="discuss" data-id="${item.id}" title="Discussion">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>${(item.title.length % 7) + 2}</span>
              </button>
            </div>
            <div class="toolbar-right">
              <button class="tool-btn tool-btn--bookmark ${isBookmarked ? "active" : ""}" data-action="bookmark" data-id="${item.id}" title="Bookmark">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="${isBookmarked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>
              <button class="tool-btn tool-btn--dismiss" data-action="dismiss" data-id="${item.id}" title="Not relevant">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </article>
      `;
    }).join("");
  }
}

/* ── Feed Event Listeners ─────────────────────────────────── */

navItems.forEach((btn) => {
  btn.addEventListener("click", () => {
    navItems.forEach((b) => b.classList.remove("active"));
    if (recentViewBtn) recentViewBtn.classList.remove("active");
    btn.classList.add("active");
    state.activeView = btn.dataset.view;
    const titles = { feed: "Personalized Pulse", popular: "Community Popular", recent: "Latest Updates", bookmarks: "Saved Bookmarks" };
    if (currentViewTitle) currentViewTitle.textContent = titles[state.activeView] || "Feed";
    renderFeed();
  });
});

if (recentViewBtn) {
  recentViewBtn.addEventListener("click", () => {
    if (state.activeView === "recent") {
      // Toggle back to My Feed
      const feedBtn = document.querySelector('.nav-item[data-view="feed"]');
      if (feedBtn) {
        feedBtn.click();
      } else {
        recentViewBtn.classList.remove("active");
        state.activeView = "feed";
        if (currentViewTitle) currentViewTitle.textContent = "Personalized Pulse";
        renderFeed();
      }
    } else {
      navItems.forEach((b) => b.classList.remove("active"));
      recentViewBtn.classList.add("active");
      state.activeView = "recent";
      if (currentViewTitle) currentViewTitle.textContent = "Latest Updates";
      renderFeed();
    }
  });
}

typePills?.addEventListener("click", (e) => {
  const pill = e.target.closest(".pill-btn");
  if (!pill) return;
  $$(".pill-btn").forEach((p) => p.classList.remove("active"));
  pill.classList.add("active");
  state.activeType = pill.dataset.type;
  renderFeed();
});

sidebarTags?.addEventListener("click", (e) => {
  const tagBtn = e.target.closest(".mini-tag");
  if (!tagBtn) return;
  const isSelected = tagBtn.classList.toggle("active");
  if (searchInput) searchInput.value = isSelected ? tagBtn.dataset.tag : "";
  state.searchQuery = isSelected ? tagBtn.dataset.tag.toLowerCase() : "";
  renderFeed();
});

searchInput?.addEventListener("input", (e) => {
  state.searchQuery = e.target.value.trim().toLowerCase();
  renderFeed();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement !== searchInput) { e.preventDefault(); searchInput?.focus(); }
  if (e.key === "Escape") { closeCardDetail(); closeAuthModal(); }
});

// Card click handler — open detail popup OR handle toolbar actions
cardsContainer?.addEventListener("click", (e) => {
  // Handle toolbar button clicks
  const btn = e.target.closest(".tool-btn");
  if (btn) {
    e.stopPropagation();
    const action = btn.dataset.action;
    const id = btn.dataset.id;

    if (action === "upvote") {
      const isVoted = state.upvotes[`${id}_voted`];
      if (isVoted) { state.upvotes[id] = (state.upvotes[id] || 1) - 1; state.upvotes[`${id}_voted`] = false; }
      else { state.upvotes[id] = (state.upvotes[id] || 0) + 1; state.upvotes[`${id}_voted`] = true; }
      localStorage.setItem("nabdh_upvotes", JSON.stringify(state.upvotes));
      renderFeed();
    } else if (action === "bookmark") {
      if (state.bookmarks.has(id)) state.bookmarks.delete(id); else state.bookmarks.add(id);
      localStorage.setItem("nabdh_bookmarks", JSON.stringify([...state.bookmarks]));
      renderFeed();
    } else if (action === "dismiss") {
      state.feedback = state.feedback.filter((f) => f.itemId !== id);
      state.feedback.push({ itemId: id, relevant: false });
      btn.closest(".nabdh-card")?.classList.add("dismissed");
      if (aiStatusMessage) aiStatusMessage.textContent = "Feedback received — re-ranking...";
      setTimeout(() => rankFeed(), 600);
    } else if (action === "discuss") {
      const item = state.rankedFeed.find((it) => it.id === id);
      if (item) openCardDetail(item);
    }
    return;
  }

  // Handle card title click — open detail popup
  const titleLink = e.target.closest("[data-card-click]");
  if (titleLink) {
    e.preventDefault();
    const itemId = titleLink.dataset.cardClick;
    const item = state.rankedFeed.find((it) => it.id === itemId);
    if (item) openCardDetail(item);
    return;
  }

  // Handle click on the card itself (not on buttons)
  const card = e.target.closest(".nabdh-card");
  if (card && !e.target.closest("a") && !e.target.closest("button")) {
    const itemId = card.dataset.id;
    const item = state.rankedFeed.find((it) => it.id === itemId);
    if (item) openCardDetail(item);
  }
});

manualRefreshBtn?.addEventListener("click", async () => {
  state.countdown = state.profile.refreshInterval;
  await rankFeed();
});

function startAutoSync() {
  stopAutoSync();
  const interval = state.profile.refreshInterval;
  state.countdown = interval;
  const circumference = 2 * Math.PI * 16;

  state.countdownTimer = setInterval(() => {
    state.countdown--;
    if (state.countdown < 0) state.countdown = 0;
    if (syncCountdownText) syncCountdownText.textContent = state.countdown;
    const progress = 1 - state.countdown / interval;
    if (syncProgressBar) syncProgressBar.style.strokeDashoffset = circumference * (1 - progress);
  }, 1000);

  state.refreshTimer = setInterval(async () => {
    state.countdown = interval;
    await rankFeed();
  }, interval * 1000);
}

function stopAutoSync() {
  if (state.countdownTimer) clearInterval(state.countdownTimer);
  if (state.refreshTimer) clearInterval(state.refreshTimer);
}