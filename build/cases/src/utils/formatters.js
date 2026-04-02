export function formatDate(dateString) {
  const [year, month, day] = dateString.split("-");
  return `${year}.${month}.${day}`;
}

export function formatShortDate(dateString) {
  const [, month, day] = dateString.split("-");
  return `${month}.${day}`;
}

export function includesTag(list, value) {
  if (value === "不限") {
    return true;
  }
  return list.includes(value);
}
