/* ══════════════════════════════════════════════════════════════════
   4. CUSTOM SELECT DROPDOWNS, TAGS & CV UPLOAD
   ══════════════════════════════════════════════════════════════════ */

function initCustomSelects() {
  document.querySelectorAll(".custom-select").forEach((select) => {
    const trigger = select.querySelector(".custom-select__trigger");
    const textEl = select.querySelector(".custom-select__text");
    const options = select.querySelectorAll(".custom-select__option");

    trigger?.addEventListener("click", (e) => {
      e.stopPropagation();
      // Close all other open selects
      document.querySelectorAll(".custom-select.open").forEach((s) => {
        if (s !== select) s.classList.remove("open");
      });
      select.classList.toggle("open");
    });

    options.forEach((opt) => {
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        const val = opt.dataset.val;
        select.dataset.value = val;
        textEl.textContent = opt.textContent;
        textEl.classList.remove("placeholder-text");

        options.forEach((o) => o.classList.remove("selected"));
        opt.classList.add("selected");
        select.classList.remove("open");
      });
    });
  });

  // Close dropdowns on outside click
  document.addEventListener("click", () => {
    document.querySelectorAll(".custom-select.open").forEach((s) => s.classList.remove("open"));
  });
}

function initRegisterInterestGrid() {
  const container = regInterestGrid;
  if (!container) return;

  container.innerHTML = INTEREST_OPTIONS.map((opt) =>
    `<button type="button" class="tag-chip" data-interest="${escapeHtml(opt)}">${escapeHtml(opt)}</button>`
  ).join("");

  container.addEventListener("click", (e) => {
    const chip = e.target.closest(".tag-chip");
    if (!chip) return;

    // If it's an inline recommendation chip, toggle its selected state
    if (chip.classList.contains("recommendation-chip")) {
      chip.classList.toggle("selected");
      return;
    }

    // It's a primary interest tag chip
    const interestName = chip.dataset.interest;
    const isSelected = chip.classList.toggle("selected");

    if (isSelected) {
      spawnRecommendationsFor(chip, interestName);
    } else {
      removeRecommendationsFor(interestName);
    }
  });
}

function spawnRecommendationsFor(chip, interestName) {
  const recs = INTEREST_RECOMMENDATIONS[interestName];
  if (!recs || recs.length === 0) return;

  // Clean any existing recommendation chips for this interest
  removeRecommendationsFor(interestName);

  // Spawn each recommendation tag chip immediately to the right of the clicked chip (in the same row, after it)
  let insertCursor = chip;
  recs.forEach((rec) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tag-chip recommendation-chip";
    btn.dataset.interest = rec;
    btn.dataset.parent = interestName;
    btn.textContent = `+ ${rec}`;
    insertCursor.insertAdjacentElement("afterend", btn);
    insertCursor = btn;
  });
}

function removeRecommendationsFor(interestName) {
  const parentEscaped = CSS && CSS.escape ? CSS.escape(interestName) : interestName.replace(/["\\]/g, '\\$&');
  const existing = document.querySelectorAll(`.recommendation-chip[data-parent="${parentEscaped}"]`);
  existing.forEach((el) => el.remove());
}

function getSelectedInterests() {
  const interests = [];
  document.querySelectorAll("#reg-interest-grid .tag-chip.selected").forEach((btn) => {
    let val = btn.dataset.interest || btn.textContent.trim();
    val = val.replace(/^\+\s*/, "").trim();
    if (val && !interests.includes(val)) {
      interests.push(val);
    }
  });
  return { interests, skillLevels: {} };
}

/* ── CV / Resume Upload Handler (Strictly PDF) ────────────── */
function initCvUpload() {
  if (!cvZone || !cvFileInput) return;

  function handleCvFile(file) {
    if (!file) return;

    // Strict PDF validation check
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      alert("Invalid format: Please upload a PDF file (.pdf) only.");
      cvFileInput.value = "";
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert("File size exceeds 15MB limit.");
      cvFileInput.value = "";
      return;
    }

    let sizeStr = (file.size / 1024).toFixed(1) + " KB";
    if (file.size > 1024 * 1024) {
      sizeStr = (file.size / (1024 * 1024)).toFixed(1) + " MB";
    }

    state.profile.cvName = file.name;
    state.profile.cvSize = sizeStr;
    state.profile.hasCv = true;

    if (cvFilename) cvFilename.textContent = file.name;
    if (cvFilesize) cvFilesize.textContent = sizeStr;
    if (cvUploadContent) cvUploadContent.style.display = "none";
    if (cvFilePreview) cvFilePreview.style.display = "flex";
  }

  cvZone.addEventListener("click", (e) => {
    if (e.target.closest("#btn-remove-cv")) return;
    if (cvFilePreview && cvFilePreview.style.display === "flex") return;
    cvFileInput.click();
  });

  cvFileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      handleCvFile(e.target.files[0]);
    }
  });

  cvZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    cvZone.classList.add("dragover");
  });

  cvZone.addEventListener("dragleave", () => {
    cvZone.classList.remove("dragover");
  });

  cvZone.addEventListener("drop", (e) => {
    e.preventDefault();
    cvZone.classList.remove("dragover");
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleCvFile(e.dataTransfer.files[0]);
    }
  });

  if (btnRemoveCv) {
    btnRemoveCv.addEventListener("click", (e) => {
      e.stopPropagation();
      cvFileInput.value = "";
      state.profile.cvName = "";
      state.profile.cvSize = "";
      state.profile.hasCv = false;
      if (cvUploadContent) cvUploadContent.style.display = "flex";
      if (cvFilePreview) cvFilePreview.style.display = "none";
    });
  }
}

/* ── Detailed Landing Feature Cards Interaction ───────────── */
function initLandingFeatureCards() {
  const cards = $$(".feature-detail-card");
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const title = card.querySelector(".feature-card-title")?.textContent || "";
      if (title.includes("Events")) {
        state.activeType = "event";
      } else if (title.includes("AI")) {
        state.searchQuery = "ai";
      } else if (title.includes("Cloud")) {
        state.searchQuery = "cloud";
      } else if (title.includes("DevOps")) {
        state.searchQuery = "devops";
      } else if (title.includes("Cyber")) {
        state.searchQuery = "cybersec";
      }
      welcomeSignupBtn?.click();
    });
  });
}