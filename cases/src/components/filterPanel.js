function renderOption(field, option, selected) {
  return `
    <button
      class="option-chip ${selected === option ? "is-selected" : ""}"
      data-action="set-filter"
      data-field="${field}"
      data-value="${option}"
    >${option}</button>
  `;
}

function renderProgramPanel(group, state) {
  const selectedCollege = state.filters.undergradCollege;
  const selectedGroup = group.colleges?.find((item) => item.value === selectedCollege) || null;
  const collegeOptions = [
    `<button class="option-chip ${selectedCollege === "不限" ? "is-selected" : ""}" data-action="set-college" data-college="不限">不限</button>`,
    ...(group.colleges || []).map(
      (college) => `
        <button
          class="option-chip ${selectedCollege === college.value ? "is-selected" : ""}"
          data-action="set-college"
          data-college="${college.value}"
        >${college.label}</button>
      `,
    ),
  ];

  return `
    <div class="sheet__section">
      <strong>选择学院</strong>
      <div class="sheet__options">
        ${collegeOptions.join("")}
      </div>
    </div>
    ${
      selectedGroup
        ? `
          <div class="sheet__section">
            <strong>选择专业</strong>
            <div class="sheet__options">
              <button
                class="option-chip ${state.filters.undergradMajor === "不限" ? "is-selected" : ""}"
                data-action="set-major"
                data-major="不限"
              >不限</button>
              ${selectedGroup.majors
                .map(
                  (major) => `
                    <button
                      class="option-chip ${state.filters.undergradMajor === major ? "is-selected" : ""}"
                      data-action="set-major"
                      data-major="${major}"
                    >${major}</button>
                  `,
                )
                .join("")}
            </div>
          </div>
        `
        : ""
    }
  `;
}

function renderRegionPanel(group, state) {
  return `
    <div class="sheet__section">
      <strong>可多选</strong>
      <div class="sheet__options">
        <button
          class="option-chip ${state.filters.offerRegions.length ? "" : "is-selected"}"
          data-action="clear-regions"
        >不限</button>
        ${group.options
          .map(
            (option) => `
              <button
                class="option-chip ${state.filters.offerRegions.includes(option) ? "is-selected" : ""}"
                data-action="toggle-region"
                data-region="${option}"
              >${option}</button>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

export function renderFilterPanel(group, state) {
  if (!group) {
    return "";
  }

  return `
    <div class="sheet-backdrop sheet-backdrop--dropdown" data-action="close-filter"></div>
    <section class="sheet sheet--dropdown"${state.filterPanelStyle ? ` style="${state.filterPanelStyle}"` : ""}>
      <div class="sheet__head">
        <h3>${group.label}</h3>
      </div>
      ${
        group.id === "program"
          ? renderProgramPanel(group, state)
          : group.id === "region"
            ? renderRegionPanel(group, state)
            : `
              <div class="sheet__options">
                ${group.options.map((option) => renderOption(group.field, option, state.filters[group.field])).join("")}
              </div>
            `
      }
      <div class="sheet__foot ${group.id === "region" ? "" : "is-single"}">
        <button class="primary-btn" data-action="close-filter">完成</button>
      </div>
    </section>
  `;
}
