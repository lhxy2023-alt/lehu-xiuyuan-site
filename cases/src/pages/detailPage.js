import { pageConfig } from "../data/index.js";

function getDetailContactButtonText(hasCard) {
  return hasCard
    ? pageConfig["detail.contactButtonTextWithCard"] || ""
    : pageConfig["detail.contactButtonTextWithoutCard"] || "";
}

function renderInlineTags(tags = []) {
  if (!tags.length) {
    return "";
  }

  return `
    <span class="detail-inline-tags">${tags.map((tag) => `#${tag.label}`).join(" ")}</span>
  `;
}

function renderIdentityValue(item) {
  return `
    <div class="detail-identity">
      <span class="detail-identity__name">${item.studentDisplayName}</span>
      ${renderInlineTags(item.tags)}
    </div>
  `;
}

function renderInfoRows(item) {
  const rows = [
    item.studentDisplayName
      ? { label: "学生姓名", value: renderIdentityValue(item) }
      : null,
    ...item.detailSections.map((section) => ({
      label: section.label,
      value: `<span>${section.value}</span>`,
    })),
  ].filter(Boolean);

  return rows
    .map(
      (row) => `
        <div class="detail-info-row">
          <span class="detail-info-row__label">${row.label}</span>
          <div class="detail-info-row__value">${row.value}</div>
        </div>
      `,
    )
    .join("");
}

function renderStudentCard(card) {
  if (!card) {
    return "";
  }

  return `
    <section class="detail-section detail-card student-card">
      <div class="student-card__top">
        <button class="primary-btn" type="button" data-action="open-contact-modal">${card.contactLabel || ""}</button>
      </div>
      <div class="student-card__copy">
        <p>${card.copy}</p>
      </div>
    </section>
  `;
}

function renderFloatingConsult(item) {
  const hasCard = Boolean(item.studentCard);
  return `
    <aside class="floating-contact">
      <div class="floating-contact__copy">
        <strong>${pageConfig["detail.contactTitle"] || ""}</strong>
        <span>${
          hasCard
            ? pageConfig["detail.contactDescriptionWithCard"] || ""
            : pageConfig["detail.contactDescriptionWithoutCard"] || ""
        }</span>
      </div>
      <button class="primary-btn" type="button" data-action="open-contact-modal">${getDetailContactButtonText(hasCard)}</button>
    </aside>
  `;
}

export function renderDetailPage({ item }) {
  return `
    <main class="detail-page">
      <header class="detail-hero">
        <button class="detail-back-btn" type="button" data-action="back-to-list" aria-label="返回案例列表">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M15 18 9 12l6-6" />
          </svg>
        </button>
      </header>

      <section class="detail-section detail-card detail-sheet">
        <div class="section-title section-title--detail">
          <p>录取详情</p>
          <h2>${item.listTitle}</h2>
        </div>
        <div class="detail-info-list">
          ${renderInfoRows(item)}
        </div>
      </section>
      ${renderStudentCard(item.studentCard)}
      ${renderFloatingConsult(item)}
    </main>
  `;
}
