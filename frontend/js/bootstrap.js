/* ══════════════════════════════════════════════════════════════════
   12. LAUNCH FEED & INITIALIZE APP (BOOTSTRAP)
   ══════════════════════════════════════════════════════════════════ */

async function launchAppFeed() {
  const initials = `${(state.profile.name || "").charAt(0)}${(state.profile.surname || "").charAt(0)}`.toUpperCase();
  if (userAvatarInitial) userAvatarInitial.textContent = initials || "N";
  if (userNameDisplay) userNameDisplay.textContent = `${state.profile.name} ${state.profile.surname}`;
  if (userRoleDisplay) userRoleDisplay.textContent = state.profile.occupation;

  welcomePage?.classList.remove("active");
  appLayout?.classList.add("active");

  await loadSeedItems();
  loadSquadsAndTrending();
  await rankFeed();
  startAutoSync();
}

async function loadSeedItems() {
  try {
    const res = await fetch("seed_items.json");
    state.items = await res.json();
    state.items.forEach((item, idx) => {
      if (state.upvotes[item.id] === undefined) {
        state.upvotes[item.id] = 14 + ((idx * 5) % 31);
      }
    });
  } catch (err) {
    console.error("Failed to load seed items:", err);
  }
}

/* ── Bootstrap Initializations ────────────────────────────── */
initCustomSelects();
initRegisterInterestGrid();
initCvUpload();
initProfilePopoverAndConfig();
initLandingFeatureCards();
initAiBriefAndCopilot();

// Restore profile data into memory if saved, but ALWAYS show the welcome/home page first on refresh
const savedProfile = JSON.parse(localStorage.getItem("nabdh_profile") || "null");
if (savedProfile) {
  Object.assign(state.profile, savedProfile);
}

welcomePage?.classList.add("active");
appLayout?.classList.remove("active");
window.scrollTo(0, 0);