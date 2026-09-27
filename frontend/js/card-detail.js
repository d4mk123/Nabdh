/* ══════════════════════════════════════════════════════════════════
   8. CARD DETAIL POPUP
   ══════════════════════════════════════════════════════════════════ */

function openCardDetail(item) {
  const detailType = $("#detail-type");
  const detailScore = $("#detail-score");
  const detailTitle = $("#detail-title");
  const detailSource = $("#detail-source");
  const detailLocation = $("#detail-location");
  const detailDate = $("#detail-date");
  const detailDesc = $("#detail-desc");
  const detailReason = $("#detail-reason");
  const detailReasonBlock = $("#detail-reason-block");
  const detailTags = $("#detail-tags");
  const detailLink = $("#detail-link");
  const detailBookmarkBtn = $("#detail-bookmark-btn");

  if (detailType) {
    detailType.textContent = (item.type || "").toUpperCase();
    detailType.setAttribute("data-type", item.type || "");
  }
  if (detailScore) detailScore.textContent = item.score != null ? `${item.score}% fit` : "";
  if (detailTitle) detailTitle.textContent = item.title;
  if (detailSource) detailSource.textContent = item.source || "Tunisia Tech";
  if (detailLocation) detailLocation.textContent = item.location || "Tunisia";
  if (detailDate) detailDate.textContent = formatDate(item.date);
  if (detailDesc) detailDesc.textContent = item.description;

  if (detailReasonBlock && detailReason) {
    if (item.reason) {
      detailReasonBlock.style.display = "block";
      detailReason.textContent = item.reason;
    } else {
      detailReasonBlock.style.display = "none";
    }
  }

  if (detailTags) {
    detailTags.innerHTML = (item.tags || []).map((t) => `<span class="card-tag">#${escapeHtml(t)}</span>`).join("");
  }

  if (detailLink) {
    detailLink.href = item.url || "#";
    if (!item.url || item.url === "#") {
      detailLink.style.pointerEvents = "none";
      detailLink.style.opacity = "0.5";
    } else {
      detailLink.style.pointerEvents = "auto";
      detailLink.style.opacity = "1";
    }
  }

  const isBookmarked = state.bookmarks.has(item.id);
  if (detailBookmarkBtn) {
    const span = detailBookmarkBtn.querySelector("span");
    if (span) span.textContent = isBookmarked ? "Bookmarked" : "Bookmark";
    detailBookmarkBtn.classList.toggle("active", isBookmarked);
    detailBookmarkBtn.onclick = () => {
      if (state.bookmarks.has(item.id)) {
        state.bookmarks.delete(item.id);
      } else {
        state.bookmarks.add(item.id);
      }
      localStorage.setItem("nabdh_bookmarks", JSON.stringify([...state.bookmarks]));
      const nowBookmarked = state.bookmarks.has(item.id);
      if (span) span.textContent = nowBookmarked ? "Bookmarked" : "Bookmark";
      detailBookmarkBtn.classList.toggle("active", nowBookmarked);
      renderFeed();
    };
  }

  cardDetailOverlay?.classList.add("active");
}

function closeCardDetail() {
  cardDetailOverlay?.classList.remove("active");
}

cardDetailClose?.addEventListener("click", closeCardDetail);
cardDetailOverlay?.addEventListener("click", (e) => {
  if (e.target === cardDetailOverlay) closeCardDetail();
});