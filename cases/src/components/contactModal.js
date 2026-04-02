import { pageConfig } from "../data/index.js";

function renderQrCard(label, image) {
  return `
    <div class="contact-modal__qr-card">
      <div class="contact-modal__qr-image">
        <img src="${image}" alt="${label}" loading="lazy" />
      </div>
      <strong>${label}</strong>
    </div>
  `;
}

export function renderContactModal(isOpen) {
  if (!isOpen) {
    return "";
  }

  const wechatLabel = pageConfig["contact.wechatQrLabel"] || "";
  const wechatImage = pageConfig["contact.wechatQrImage"] || "";
  const wenjuanxingLabel = pageConfig["contact.formQrLabel"] || "";
  const wenjuanxingImage = pageConfig["contact.formQrImage"] || "";
  const qrCards = [
    wechatImage ? renderQrCard(wechatLabel, wechatImage) : "",
    wenjuanxingImage ? renderQrCard(wenjuanxingLabel, wenjuanxingImage) : "",
  ].filter(Boolean).join("");

  return `
    <div class="modal-backdrop" data-action="close-contact-modal"></div>
    <section class="modal contact-modal">
      <div class="modal__head">
        <h3>${pageConfig["contact.modalTitle"] || ""}</h3>
        <button class="modal-icon-btn" data-action="close-contact-modal" aria-label="关闭弹窗">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
      <div class="modal__body">
        <p class="contact-modal__description">${pageConfig["contact.modalDescription"] || ""}</p>
        <div class="contact-modal__grid">
          ${qrCards}
        </div>
      </div>
    </section>
  `;
}
