import { articles, cases, filterGroups } from "./data/index.js";
import { renderContactModal } from "./components/contactModal.js";
import { renderFilterPanel } from "./components/filterPanel.js";
import { renderPreviewModal } from "./components/previewModal.js";
import { renderShell } from "./components/shell.js";
import { renderDetailPage } from "./pages/detailPage.js";
import { renderListContent, renderListPage } from "./pages/listPage.js";
import { findCase, filterCases } from "./utils/selectors.js";
import { state } from "./utils/state.js";

const root = document.getElementById("app");
let isComposing = false;
const FLOATING_HIDE_DURATION = 180;
const FILTER_PANEL_WIDTH = 336;

function restoreListPosition() {
  const targetCaseId = state.lastOpenedCaseId;

  window.requestAnimationFrame(() => {
    const targetButton = targetCaseId
      ? root.querySelector(`[data-action='open-case'][data-case-id='${targetCaseId}']`)
      : null;

    if (targetButton) {
      targetButton.scrollIntoView({ block: "center", behavior: "auto" });
      return;
    }

    window.scrollTo({ top: state.listScrollTop || 0, behavior: "auto" });
  });
}

function resetFilters() {
  state.filters = {
    applicationSeason: "不限",
    undergradCollege: "不限",
    undergradMajor: "不限",
    offerRegions: [],
  };
}

function buildFilterPanelStyle(anchorRect) {
  if (!anchorRect) {
    return null;
  }

  const width = Math.min(FILTER_PANEL_WIDTH, window.innerWidth - 24);
  const left = Math.min(Math.max(12, anchorRect.left), window.innerWidth - width - 12);
  const top = anchorRect.bottom + 8;
  return `top:${top}px;left:${left}px;width:${width}px;`;
}

function getFilteredCases() {
  return filterCases(cases, state);
}

function updateListResults() {
  if (state.selectedCaseId || state.activeTab !== "cases") {
    return;
  }

  const filtered = getFilteredCases();
  const resultMeta = root.querySelector("#resultMeta");
  const listContent = root.querySelector("#listContent");

  if (resultMeta) {
    resultMeta.textContent = `${filtered.length} 个案例`;
  }

  if (listContent) {
    listContent.innerHTML = renderListContent({ cases: filtered, articles, state });
    bindListActionEvents();
  }
}

function render() {
  const currentCase = findCase(cases, state.selectedCaseId);
  const currentFilterGroup = filterGroups.find((item) => item.id === state.openFilterId) || null;

  const body = currentCase
    ? renderDetailPage({
      item: currentCase,
    })
    : renderListPage({ cases: getFilteredCases(), articles, state, filterGroups });

  root.innerHTML =
    renderShell(body) +
    renderFilterPanel(currentFilterGroup, state) +
    renderPreviewModal(state.previewImage) +
    renderContactModal(state.contactModalOpen);

  bindEvents();
}

function updateFilterVisibility(nextFilterId, anchorRect = null) {
  const currentFloating = root.querySelector(".floating-contact--home");
  const isOpening = Boolean(nextFilterId) && !state.openFilterId;

  if (isOpening && currentFloating) {
    currentFloating.classList.add("is-hidden");
    window.setTimeout(() => {
      state.openFilterId = nextFilterId;
      state.filterPanelStyle = buildFilterPanelStyle(anchorRect);
      render();
    }, FLOATING_HIDE_DURATION);
    return;
  }

  state.openFilterId = nextFilterId;
  state.filterPanelStyle = nextFilterId ? (anchorRect ? buildFilterPanelStyle(anchorRect) : state.filterPanelStyle) : null;
  render();
}

function bindListActionEvents() {
  root.querySelectorAll("[data-action='open-case']").forEach((button) => {
    button.addEventListener("click", () => {
      state.listScrollTop = window.scrollY;
      state.lastOpenedCaseId = button.dataset.caseId;
      state.searchFocused = false;
      state.selectedCaseId = button.dataset.caseId;
      state.openFilterId = null;
      render();
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  });
}

function bindEvents() {
  const searchInput = root.querySelector("#searchInput");
  searchInput?.addEventListener("focus", () => {
    if (!state.searchFocused) {
      state.searchFocused = true;
      const floatingContact = root.querySelector(".floating-contact--home");
      floatingContact?.classList.add("is-hidden");
    }
  });
  searchInput?.addEventListener("blur", () => {
    if (state.searchFocused) {
      state.searchFocused = false;
      const floatingContact = root.querySelector(".floating-contact--home");
      if (!state.openFilterId) {
        floatingContact?.classList.remove("is-hidden");
      }
    }
  });
  searchInput?.addEventListener("compositionstart", () => {
    isComposing = true;
  });
  searchInput?.addEventListener("compositionend", (event) => {
    isComposing = false;
    state.query = event.target.value;
    updateListResults();
  });
  searchInput?.addEventListener("input", (event) => {
    if (isComposing) {
      return;
    }
    state.query = event.target.value;
    updateListResults();
  });

  root.querySelectorAll("[data-action='switch-tab']").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeTab = button.dataset.tab;
      state.searchFocused = false;
      state.openFilterId = null;
      state.filterPanelStyle = null;
      render();
    });
  });

  root.querySelectorAll("[data-action='toggle-filter']").forEach((button) => {
    button.addEventListener("click", () => {
      const nextFilterId = state.openFilterId === button.dataset.filterId ? null : button.dataset.filterId;
      updateFilterVisibility(nextFilterId, button.getBoundingClientRect());
    });
  });

  root.querySelectorAll("[data-action='set-filter']").forEach((button) => {
    button.addEventListener("click", () => {
      state.filters[button.dataset.field] = button.dataset.value;
      updateFilterVisibility(null);
    });
  });

  root.querySelectorAll("[data-action='set-college']").forEach((button) => {
    button.addEventListener("click", () => {
      state.filters.undergradCollege = button.dataset.college;
      state.filters.undergradMajor = "不限";
      updateFilterVisibility(null);
    });
  });

  root.querySelectorAll("[data-action='set-major']").forEach((button) => {
    button.addEventListener("click", () => {
      state.filters.undergradMajor = button.dataset.major;
      updateFilterVisibility(null);
    });
  });

  root.querySelectorAll("[data-action='toggle-region']").forEach((button) => {
    button.addEventListener("click", () => {
      const region = button.dataset.region;
      const exists = state.filters.offerRegions.includes(region);
      state.filters.offerRegions = exists
        ? state.filters.offerRegions.filter((item) => item !== region)
        : [...state.filters.offerRegions, region];
      render();
    });
  });

  root.querySelectorAll("[data-action='clear-regions']").forEach((button) => {
    button.addEventListener("click", () => {
      state.filters.offerRegions = [];
      render();
    });
  });

  root.querySelectorAll("[data-action='close-filter']").forEach((button) => {
    button.addEventListener("click", () => {
      updateFilterVisibility(null);
    });
  });

  root.querySelectorAll("[data-action='reset-filters']").forEach((button) => {
    button.addEventListener("click", () => {
      resetFilters();
      render();
    });
  });

  bindListActionEvents();

  root.querySelectorAll("[data-action='back-to-list']").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedCaseId = null;
      state.searchFocused = false;
      render();
      restoreListPosition();
    });
  });

  root.querySelectorAll("[data-action='close-preview']").forEach((button) => {
    button.addEventListener("click", () => {
      state.previewImage = null;
      render();
    });
  });

  root.querySelectorAll("[data-action='open-contact-modal']").forEach((button) => {
    button.addEventListener("click", () => {
      state.searchFocused = false;
      state.contactModalOpen = true;
      render();
    });
  });

  root.querySelectorAll("[data-action='close-contact-modal']").forEach((button) => {
    button.addEventListener("click", () => {
      state.contactModalOpen = false;
      render();
    });
  });
}

render();
