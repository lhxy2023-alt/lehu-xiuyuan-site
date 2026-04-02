import { pageConfig } from "../data/index.js";

function hasActiveFilters(state) {
  return (
    state.filters.applicationSeason !== "不限" ||
    state.filters.undergradCollege !== "不限" ||
    state.filters.undergradMajor !== "不限" ||
    state.filters.offerRegions.length > 0
  );
}

function buildProgramFilterLabel(state, filterGroups) {
  const group = filterGroups.find((item) => item.id === "program");

  if (state.filters.undergradCollege === "不限") {
    return group?.label || "";
  }

  const college = group?.colleges?.find((item) => item.value === state.filters.undergradCollege);
  if (!college) {
    return group?.label || "";
  }

  if (state.filters.undergradMajor === "不限") {
    return college.label;
  }

  return `${college.label}${state.filters.undergradMajor}`;
}

function buildBackgroundLine(item) {
  return [item.undergradCollegeLabel, item.undergradMajor, item.gpa].filter(Boolean).join(" / ");
}

function buildScoreLine(item) {
  return item.scoreList.join(" / ");
}

function buildRegionFilterLabel(state) {
  if (!state.filters.offerRegions.length) {
    return "国家（地区）";
  }
  if (state.filters.offerRegions.length === 1) {
    return state.filters.offerRegions[0];
  }
  return "多地区";
}

function buildFilterChipLabel(group, state, filterGroups) {
  if (group.id === "program") {
    return buildProgramFilterLabel(state, filterGroups);
  }
  if (group.id === "region") {
    return buildRegionFilterLabel(state);
  }
  return state.filters[group.field] === "不限" ? group.label : state.filters[group.field];
}

function renderTagList(tags = []) {
  if (!tags.length) {
    return "";
  }

  return `
    <div class="tag-list">
      ${tags
        .map(
          (tag) => `
            <span class="pill ${tag.type === "season" ? "pill--season" : ""}">${tag.label}</span>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderSchoolBadge(item) {
  return `
    <div class="school-badge school-badge--image" aria-hidden="true">
      ${item.schoolLogoUrl ? `<img src="${item.schoolLogoUrl}" alt="${item.offerSchool} 校徽" loading="lazy" />` : ""}
    </div>
  `;
}

function renderLineIcon(type) {
  if (type === "academic") {
    return `
      <span class="case-card__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9.5 12 5l9 4.5-9 4.5L3 9.5Z" />
          <path d="M7.5 11.8V15c0 .9 2 2.5 4.5 2.5s4.5-1.6 4.5-2.5v-3.2" />
          <path d="M19 10v4.2" />
          <circle cx="19" cy="15.8" r=".9" fill="currentColor" stroke="none" />
        </svg>
      </span>
    `;
  }

  return `
    <span class="case-card__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <rect x="5.5" y="4.5" width="13" height="15" rx="2.5" />
        <path d="M8.5 9h7" />
        <path d="M8.5 12h7" />
        <path d="M8.5 15h4.5" />
        <path d="M15.8 14.5v2.5" />
        <path d="M14.6 15.7h2.4" />
      </svg>
    </span>
  `;
}

function renderSearchIcon() {
  return `
    <span class="search-box__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="6.5"></circle>
        <path d="M16 16l4.5 4.5"></path>
      </svg>
    </span>
  `;
}

function renderCaseCard(item) {
  const scoreLine = buildScoreLine(item);

  return `
    <button class="case-card" data-action="open-case" data-case-id="${item.id}">
      <div class="case-card__head">
        ${renderSchoolBadge(item)}
        <div class="case-card__title-group">
          <h3>${item.listTitle}</h3>
          ${renderTagList(item.tags)}
        </div>
      </div>
      <div class="case-card__content">
        <div class="case-card__line">
          ${renderLineIcon("academic")}
          <span>${buildBackgroundLine(item)}</span>
        </div>
        ${
          scoreLine
            ? `
              <div class="case-card__line">
                ${renderLineIcon("score")}
                <span>${scoreLine}</span>
              </div>
            `
            : ""
        }
      </div>
    </button>
  `;
}

function renderArticleCard(item) {
  const badgeLabel = item.isHot ? "HOT" : item.isNew ? "NEW" : "";
  const hasBackground = Boolean(item.backgroundImageUrl);

  return `
    <a class="interview-card ${hasBackground ? "interview-card--with-image" : ""}" href="${item.url}" target="_blank" rel="noreferrer">
      ${
        hasBackground
          ? `
            <div class="interview-card__image-wrap" aria-hidden="true">
              <img class="interview-card__image" src="${item.backgroundImageUrl}" alt="" loading="lazy" />
            </div>
          `
          : ""
      }
      <div class="interview-card__body ${hasBackground ? "interview-card__body--with-image" : ""}">
        <div class="interview-card__head">
          <span class="interview-card__date">${item.uploadTime || ""}</span>
          ${badgeLabel ? `<span class="interview-card__badge interview-card__badge--${badgeLabel.toLowerCase()}">${badgeLabel}</span>` : ""}
        </div>
        <h3>${item.subject}</h3>
        <p>${item.summary}</p>
      </div>
    </a>
  `;
}

function renderFeaturedArticle(item) {
  const hasBackground = Boolean(item.backgroundImageUrl);

  return `
    <a class="interview-featured" href="${item.url}" target="_blank" rel="noreferrer">
      ${
        hasBackground
          ? `
            <div class="interview-featured__image-wrap" aria-hidden="true">
              <img class="interview-featured__image" src="${item.backgroundImageUrl}" alt="" loading="lazy" />
            </div>
          `
          : ""
      }
      <div class="interview-featured__visual">
        <div class="interview-featured__copy">
          <h2>${item.subject}</h2>
          <p>${item.summary}</p>
        </div>
      </div>
    </a>
  `;
}

function renderArticlesContent(articles) {
  const featuredArticle = articles.find((item) => item.isFeatured) || articles[0];
  const otherArticles = articles.filter((item) => item.id !== featuredArticle?.id);

  return `
    ${
      featuredArticle
        ? `
          <section class="interview-section">
            ${renderFeaturedArticle(featuredArticle)}
          </section>
        `
        : ""
    }
    ${
      otherArticles.length
        ? `
          <section class="interview-section">
            <div class="interview-section__head">
              <h3>${pageConfig["articles.sectionTitle"] || ""}</h3>
            </div>
            <div class="interview-list">
              ${otherArticles.map(renderArticleCard).join("")}
            </div>
          </section>
        `
        : ""
    }
    ${
      !featuredArticle
        ? `<div class="empty-card"></div>`
        : ""
    }
  `;
}

export function renderListContent({ cases, articles, state }) {
  if (state.activeTab === "articles") {
    return renderArticlesContent(articles);
  }

  return `
    <section class="card-list">
      ${cases.length ? cases.map(renderCaseCard).join("") : `<div class="empty-card">暂无匹配案例，请放宽筛选条件。</div>`}
    </section>
  `;
}

export function renderListPage({ cases, articles, state, filterGroups }) {
  const showReset = hasActiveFilters(state);
  const tabs = [
    { id: "cases", label: "案例" },
    { id: "articles", label: "专访" },
  ];

  return `
    <header class="hero hero--brand">
      <div class="hero-brand">
        <h1>${pageConfig["home.heroTitle"] || ""}</h1>
      </div>
      ${
        state.activeTab === "cases"
          ? `
            <label class="search-box">
              ${renderSearchIcon()}
              <input
                id="searchInput"
                type="search"
                value="${state.query}"
                placeholder="${pageConfig["home.searchPlaceholder"] || ""}"
                autocomplete="off"
                spellcheck="false"
              />
            </label>
          `
          : ""
      }
      <nav class="top-tabs" aria-label="顶部导航">
        ${tabs
          .map(
            (tab) => `
              <button
                class="top-tabs__item ${state.activeTab === tab.id ? "is-active" : ""}"
                data-action="switch-tab"
                data-tab="${tab.id}"
              >${tab.label}</button>
            `,
          )
          .join("")}
      </nav>
    </header>

    <main class="page-body">
      ${
        state.activeTab === "cases"
          ? `
            <section class="filter-bar">
              ${filterGroups
                .map(
                  (group) => `
                    <button
                      class="filter-chip ${state.openFilterId === group.id ? "is-active" : ""}"
                      data-action="toggle-filter"
                      data-filter-id="${group.id}"
                    >
                      <strong>${buildFilterChipLabel(group, state, filterGroups)}</strong>
                    </button>
                  `,
                )
                .join("")}
              ${
                showReset
                  ? `
                    <button class="ghost-btn filter-reset-btn" data-action="reset-filters" type="button">重置</button>
                  `
                  : ""
              }
            </section>
            <div class="result-meta" id="resultMeta">${cases.length} 个案例</div>
          `
          : ""
      }
      <div id="listContent">
        ${renderListContent({ cases, articles, state })}
      </div>
    </main>
    <aside class="floating-contact floating-contact--home ${state.openFilterId || state.searchFocused ? "is-hidden" : ""}">
      <div class="floating-contact__copy">
        <strong>${pageConfig["home.contactTitle"] || ""}</strong>
        <span>${pageConfig["home.contactDescription"] || ""}</span>
      </div>
      <button class="primary-btn" type="button" data-action="open-contact-modal">${pageConfig["home.contactButtonText"] || ""}</button>
    </aside>
  `;
}
