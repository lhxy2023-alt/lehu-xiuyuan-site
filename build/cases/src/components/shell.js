export function renderShell(content) {
  return `
    <div class="app-bg">
      <div class="phone-stage">
        <div class="phone-frame">${content}</div>
      </div>
    </div>
  `;
}
