export function renderPreviewModal(preview) {
  if (!preview) {
    return "";
  }

  return `
    <div class="modal-backdrop" data-action="close-preview"></div>
    <section class="modal">
      <div class="modal__head">
        <h3>${preview.title}</h3>
        <button class="ghost-btn" data-action="close-preview">关闭</button>
      </div>
      <div class="modal__body">
        <div class="offer-paper">
          <span>Offer Screenshot Placeholder</span>
          <strong>${preview.title}</strong>
          <p>后续可替换为真实图片、点击放大与保存逻辑。</p>
        </div>
      </div>
    </section>
  `;
}
