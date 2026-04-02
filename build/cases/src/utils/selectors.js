export function filterCases(cases, state) {
  const query = state.query.trim().toLowerCase();

  return cases.filter((item) => {
    const matchesQuery = !query || item.searchText.toLowerCase().includes(query);
    const matchesSeason =
      state.filters.applicationSeason === "不限" ||
      item.applicationSeason === state.filters.applicationSeason;
    const matchesCollege =
      state.filters.undergradCollege === "不限" ||
      item.undergradCollege === state.filters.undergradCollege;
    const matchesMajor =
      state.filters.undergradMajor === "不限" ||
      item.undergradMajor === state.filters.undergradMajor;
    const matchesRegion =
      !state.filters.offerRegions.length ||
      state.filters.offerRegions.includes(item.offerRegion);

    return matchesQuery && matchesSeason && matchesCollege && matchesMajor && matchesRegion;
  });
}

export function findCase(cases, caseId) {
  return cases.find((item) => item.id === caseId) || null;
}
