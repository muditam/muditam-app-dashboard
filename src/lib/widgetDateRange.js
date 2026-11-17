// DayPicker uses browser-local calendar dates. Expand them before converting
// to UTC so the inclusive API cutoff includes the entire selected final day.
export function widgetDateRangeParams(range) {
  const boundary = (value, end) => {
    if (!value) return undefined;
    const date = new Date(value);
    date.setHours(end ? 23 : 0, end ? 59 : 0, end ? 59 : 0, end ? 999 : 0);
    return date.toISOString();
  };
  return { from: boundary(range?.from, false), to: boundary(range?.to, true) };
}
