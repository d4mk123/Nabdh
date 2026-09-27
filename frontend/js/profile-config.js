/* ══════════════════════════════════════════════════════════════════
   10. PROFILE POPOVER & CONFIGURATION MODAL CONTROLLER
   ══════════════════════════════════════════════════════════════════ */

function showToast(message, duration = 3000) {
  if (!nabdhToast || !nabdhToastText) return;
  nabdhToastText.textContent = message;
  nabdhToast.classList.add("show");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => {
    nabdhToast.classList.remove("show");
  }, duration);
}

function initProfilePopoverAndConfig() {
  if (!userProfileWidget || !profilePopoverMenu) return;

  // Toggle Popover on User Profile Card Click
  userProfileWidget.addEventListener("click", (e) => {
    e.stopPropagation();
    profilePopoverMenu.classList.toggle("open");
  });

  // Close popover when clicking anywhere else
  document.addEventListener("click", (e) => {
    if (!profilePopoverMenu.contains(e.target) && !userProfileWidget.contains(e.target)) {
      profilePopoverMenu.classList.remove("open");
    }
  });

  // Popover items that open Config Modal tabs
  $$("[data-open-config]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const tabName = btn.dataset.openConfig;
      profilePopoverMenu.classList.remove("open");
      openProfileConfig(tabName);
    });
  });

  // Popover Theme Segment Buttons
  themeSegBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const theme = btn.dataset.theme;
      setTheme(theme);
    });
  });

  // Restore saved theme on startup
  const savedTheme = localStorage.getItem("nabdh_theme") || "dark";
  setTheme(savedTheme, false);

  // Popover Feedback Toggle
  if (popoverFeedbackToggle) {
    popoverFeedbackToggle.addEventListener("change", (e) => {
      const active = e.target.checked;
      showToast(active ? "Feedback button enabled" : "Feedback button disabled");
    });
  }

  // Popover Logout Button
  if (popoverLogoutBtn) {
    popoverLogoutBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      profilePopoverMenu.classList.remove("open");
      localStorage.removeItem("nabdh_user");
      state.user = null;
      returnToWelcome();
      showToast("Logged out successfully");
    });
  }

  // Additional Popover buttons (Changelog, Docs, Support)
  const changelogBtn = $("#popover-changelog-btn");
  if (changelogBtn) {
    changelogBtn.addEventListener("click", () => {
      profilePopoverMenu.classList.remove("open");
      showToast("Nabdh v1.4.0 (Latest hackathon release)");
    });
  }

  const docsBtn = $("#popover-docs-btn");
  if (docsBtn) {
    docsBtn.addEventListener("click", () => {
      profilePopoverMenu.classList.remove("open");
      showToast("Opening Nabdh documentation...");
    });
  }

  const supportBtn = $("#popover-support-btn");
  if (supportBtn) {
    supportBtn.addEventListener("click", () => {
      profilePopoverMenu.classList.remove("open");
      showToast("Nabdh Support: support@nabdh.tn");
    });
  }

  // Config Modal Tabs
  configTabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.dataset.tab;
      switchConfigTab(targetTab);
    });
  });

  // Close Config Modal Buttons
  if (configCloseBtn) {
    configCloseBtn.addEventListener("click", closeProfileConfig);
  }
  if (configCancelBtn) {
    configCancelBtn.addEventListener("click", closeProfileConfig);
  }

  // Close Config Modal on Backdrop Click
  if (profileConfigOverlay) {
    profileConfigOverlay.addEventListener("click", (e) => {
      if (e.target === profileConfigOverlay) {
        closeProfileConfig();
      }
    });
  }

  // Close Config Modal on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && profileConfigOverlay?.classList.contains("open")) {
      closeProfileConfig();
    }
  });

  // Save Config Changes
  if (configSaveBtn) {
    configSaveBtn.addEventListener("click", saveProfileConfig);
  }

  // CV Upload inside Config Modal (Strictly PDF check)
  if (cfgUploadCvTrigger && cfgCvFileInput) {
    cfgUploadCvTrigger.addEventListener("click", () => {
      cfgCvFileInput.click();
    });

    cfgCvFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) {
        showToast("Error: Only PDF files (.pdf) are accepted!");
        cfgCvFileInput.value = "";
        return;
      }

      const formattedSize = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      if (cfgCurrentCvName) cfgCurrentCvName.textContent = file.name;
      if (cfgCurrentCvSize) cfgCurrentCvSize.textContent = `${formattedSize} · PDF document`;

      state.profile.cvName = file.name;
      state.profile.cvSize = `${formattedSize} · PDF document`;
      localStorage.setItem("nabdh_profile", JSON.stringify(state.profile));
      showToast(`CV updated: ${file.name}`);
    });
  }
}

function setTheme(theme, notify = true) {
  themeSegBtns.forEach((b) => {
    b.classList.toggle("active", b.dataset.theme === theme);
  });

  let effectiveTheme = theme;
  if (theme === "system") {
    effectiveTheme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  document.documentElement.setAttribute("data-theme", effectiveTheme);
  localStorage.setItem("nabdh_theme", theme);
  if (notify) {
    showToast(`Theme switched to ${theme.charAt(0).toUpperCase() + theme.slice(1)}`);
  }
}

function openProfileConfig(tabName = "profile") {
  if (!profileConfigOverlay) return;

  // Populate fields
  const cfgFirstName = $("#cfg-first-name");
  const cfgSurname = $("#cfg-surname");
  const cfgEmail = $("#cfg-email");
  const cfgPhone = $("#cfg-phone");
  const cfgOccupation = $("#cfg-occupation");
  const cfgLocation = $("#cfg-location");
  const cfgBio = $("#cfg-bio");
  const cfgGithub = $("#cfg-github");
  const cfgLinkedin = $("#cfg-linkedin");
  const cfgSyncSelect = $("#cfg-sync-select");

  if (cfgFirstName) cfgFirstName.value = state.profile.name || "";
  if (cfgSurname) cfgSurname.value = state.profile.surname || "";
  if (cfgEmail) cfgEmail.value = state.user?.email || state.profile.email || "ahmed.bensalem@gmail.com";
  if (cfgPhone) cfgPhone.value = state.profile.phone || "+216 29 123 456";
  if (cfgOccupation) cfgOccupation.value = state.profile.occupation || "Full-Stack Developer";
  if (cfgLocation) cfgLocation.value = state.profile.location || "Tunis, Tunisia";
  if (cfgBio) cfgBio.value = state.profile.bio || "Passionate about AI, Cloud computing, and Tunisian tech ecosystem.";
  if (cfgGithub) cfgGithub.value = state.profile.github || "https://github.com/ahmedbensalem";
  if (cfgLinkedin) cfgLinkedin.value = state.profile.linkedin || "https://linkedin.com/in/ahmedbensalem";

  if (state.profile.cvName && cfgCurrentCvName) {
    cfgCurrentCvName.textContent = state.profile.cvName;
    if (cfgCurrentCvSize) cfgCurrentCvSize.textContent = state.profile.cvSize || "PDF document";
  }

  if (cfgSyncSelect) {
    cfgSyncSelect.value = String(state.refreshInterval || 25);
  }

  switchConfigTab(tabName);
  profileConfigOverlay.classList.add("open");
}

function closeProfileConfig() {
  if (profileConfigOverlay) {
    profileConfigOverlay.classList.remove("open");
  }
}

function switchConfigTab(tabName) {
  configTabBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });

  configPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === `panel-${tabName}`);
  });
}

function saveProfileConfig() {
  const cfgFirstName = $("#cfg-first-name");
  const cfgSurname = $("#cfg-surname");
  const cfgEmail = $("#cfg-email");
  const cfgPhone = $("#cfg-phone");
  const cfgOccupation = $("#cfg-occupation");
  const cfgLocation = $("#cfg-location");
  const cfgBio = $("#cfg-bio");
  const cfgGithub = $("#cfg-github");
  const cfgLinkedin = $("#cfg-linkedin");
  const cfgSyncSelect = $("#cfg-sync-select");

  if (cfgFirstName && cfgFirstName.value.trim()) state.profile.name = cfgFirstName.value.trim();
  if (cfgSurname && cfgSurname.value.trim()) state.profile.surname = cfgSurname.value.trim();
  if (cfgEmail && cfgEmail.value.trim()) state.profile.email = cfgEmail.value.trim();
  if (cfgPhone) state.profile.phone = cfgPhone.value.trim();
  if (cfgOccupation && cfgOccupation.value.trim()) state.profile.occupation = cfgOccupation.value.trim();
  if (cfgLocation) state.profile.location = cfgLocation.value.trim();
  if (cfgBio) state.profile.bio = cfgBio.value.trim();
  if (cfgGithub) state.profile.github = cfgGithub.value.trim();
  if (cfgLinkedin) state.profile.linkedin = cfgLinkedin.value.trim();

  if (cfgSyncSelect) {
    const newInterval = parseInt(cfgSyncSelect.value, 10);
    if (newInterval && newInterval !== state.refreshInterval) {
      state.refreshInterval = newInterval;
      startAutoSync(newInterval);
    }
  }

  // Update App Header / Sidebar Displays
  const initials = `${state.profile.name.charAt(0)}${state.profile.surname.charAt(0)}`.toUpperCase();
  if (userAvatarInitial) userAvatarInitial.textContent = initials || "TN";
  if (userNameDisplay) userNameDisplay.textContent = `${state.profile.name} ${state.profile.surname}`;
  if (userRoleDisplay) userRoleDisplay.textContent = state.profile.occupation;

  // Persist
  localStorage.setItem("nabdh_profile", JSON.stringify(state.profile));

  closeProfileConfig();
  showToast("Profile settings updated successfully!");
}
