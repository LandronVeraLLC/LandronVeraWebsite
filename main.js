const SELECTORS = {
  localStorageLang: "lv_lang",
  i18nElements: "[data-en]",
  revealElements: ".reveal",
};

const DOM = {
  body: document.body,
  root: document.documentElement,
  mobileMenu: document.getElementById("mobileMenu"),
  menuToggle: document.querySelector("[data-menu-toggle]"),
  langButtons: Array.from(document.querySelectorAll("[data-lang-switch]")),
  mobileLinks: Array.from(document.querySelectorAll(".mobile-menu a")),
  translatableElements: Array.from(document.querySelectorAll(SELECTORS.i18nElements)),
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/ {
  accentColor: "#b8963e",
  heroBackground: "#0d1624",
  fontStyle: "serif",
} /*EDITMODE-END*/;

let currentLang = localStorage.getItem(SELECTORS.localStorageLang) || "es";
let tweaksPanel = null;

function updateTranslatedElement(element, lang) {
  const text = lang === "es" ? element.dataset.es : element.dataset.en;

  if (!text) {
    return;
  }

  if (element.dataset.i18nHtml === "true") {
    element.innerHTML = text;
    return;
  }

  element.textContent = text;
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem(SELECTORS.localStorageLang, lang);

  DOM.langButtons.forEach((button) => {
    const isActive = button.dataset.langSwitch === lang;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  DOM.translatableElements.forEach((element) => {
    updateTranslatedElement(element, lang);
  });

  DOM.root.lang = lang;
}

function toggleMenu(forceOpen) {
  if (!DOM.mobileMenu || !DOM.menuToggle) {
    return;
  }

  const shouldOpen =
    typeof forceOpen === "boolean"
      ? forceOpen
      : !DOM.mobileMenu.classList.contains("open");

  DOM.mobileMenu.classList.toggle("open", shouldOpen);
  DOM.menuToggle.setAttribute("aria-expanded", String(shouldOpen));
}

function bindLanguageControls() {
  DOM.langButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setLang(button.dataset.langSwitch);
    });
  });
}

function bindMobileMenu() {
  if (DOM.menuToggle) {
    DOM.menuToggle.addEventListener("click", () => toggleMenu());
  }

  DOM.mobileLinks.forEach((link) => {
    link.addEventListener("click", () => toggleMenu(false));
  });
}

function initRevealObserver() {
  const revealElements = document.querySelectorAll(SELECTORS.revealElements);

  if (!("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, index) => {
        if (!entry.isIntersecting) {
          return;
        }

        window.setTimeout(() => {
          entry.target.classList.add("visible");
        }, index * 80);

        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 }
  );

  revealElements.forEach((element) => observer.observe(element));
}

function applyTweaks(tweaks) {
  DOM.root.style.setProperty("--gold", tweaks.accentColor);
  DOM.root.style.setProperty("--navy", tweaks.heroBackground);
  DOM.body.classList.toggle("font-modern", tweaks.fontStyle === "modern");
}

function createTweaksField(label, inputMarkup) {
  const wrapper = document.createElement("div");
  wrapper.className = "tweaks-field";
  wrapper.innerHTML = `<label>${label}</label>${inputMarkup}`;
  return wrapper;
}

function buildTweaksPanel() {
  if (tweaksPanel) {
    return tweaksPanel;
  }

  const panel = document.createElement("section");
  panel.id = "tweaks-panel";
  panel.className = "tweaks-panel";
  panel.hidden = true;

  const title = document.createElement("div");
  title.className = "tweaks-panel-title";
  title.textContent = "Tweaks";
  panel.appendChild(title);

  panel.appendChild(
    createTweaksField(
      "Accent Color",
      `<input type="color" id="tw-color" value="${TWEAK_DEFAULTS.accentColor}">`
    )
  );

  panel.appendChild(
    createTweaksField(
      "Hero Background",
      `<input type="color" id="tw-bg" value="${TWEAK_DEFAULTS.heroBackground}">`
    )
  );

  panel.appendChild(
    createTweaksField(
      "Heading Style",
      `
        <select id="tw-font">
          <option value="serif">Classic Serif</option>
          <option value="modern">Modern Sans</option>
        </select>
      `
    )
  );

  document.body.appendChild(panel);
  tweaksPanel = panel;

  const currentTweaks = { ...TWEAK_DEFAULTS };
  const accentInput = panel.querySelector("#tw-color");
  const backgroundInput = panel.querySelector("#tw-bg");
  const fontInput = panel.querySelector("#tw-font");

  accentInput.addEventListener("input", (event) => {
    currentTweaks.accentColor = event.target.value;
    applyTweaks(currentTweaks);
    window.parent.postMessage(
      { type: "__edit_mode_set_keys", edits: { accentColor: currentTweaks.accentColor } },
      "*"
    );
  });

  backgroundInput.addEventListener("input", (event) => {
    currentTweaks.heroBackground = event.target.value;
    applyTweaks(currentTweaks);
    window.parent.postMessage(
      { type: "__edit_mode_set_keys", edits: { heroBackground: currentTweaks.heroBackground } },
      "*"
    );
  });

  fontInput.addEventListener("change", (event) => {
    currentTweaks.fontStyle = event.target.value;
    applyTweaks(currentTweaks);
    window.parent.postMessage(
      { type: "__edit_mode_set_keys", edits: { fontStyle: currentTweaks.fontStyle } },
      "*"
    );
  });

  fontInput.value = TWEAK_DEFAULTS.fontStyle;
  return panel;
}

function bindEditMode() {
  window.addEventListener("message", (event) => {
    if (event.data?.type === "__activate_edit_mode") {
      buildTweaksPanel().hidden = false;
    }

    if (event.data?.type === "__deactivate_edit_mode" && tweaksPanel) {
      tweaksPanel.hidden = true;
    }
  });

  window.parent.postMessage({ type: "__edit_mode_available" }, "*");
}

function init() {
  bindLanguageControls();
  bindMobileMenu();
  initRevealObserver();
  applyTweaks(TWEAK_DEFAULTS);
  if (DOM.translatableElements.length || DOM.langButtons.length) {
    setLang(currentLang);
  } else {
    DOM.root.lang = "en";
  }
  bindEditMode();
}

init();
