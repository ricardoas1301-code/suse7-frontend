// ======================================================================
// Grade de calendário mensal (UTC) — suporte ao seletor de período Vendas.
// ======================================================================

/**
 * @param {number} year
 * @param {number} month 0-11
 */
export function buildUtcMonthMatrix(year, month) {
  const first = new Date(Date.UTC(year, month, 1));
  const startDow = first.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  /** @type {{ iso: string; day: number; inMonth: boolean; date: Date }[]} */
  const cells = [];

  for (let i = 0; i < startDow; i += 1) {
    const d = new Date(Date.UTC(year, month, -startDow + i + 1));
    cells.push({
      iso: d.toISOString().slice(0, 10),
      day: d.getUTCDate(),
      inMonth: false,
      date: d,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const d = new Date(Date.UTC(year, month, day));
    cells.push({
      iso: d.toISOString().slice(0, 10),
      day,
      inMonth: true,
      date: d,
    });
  }

  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    const d = new Date(last);
    d.setUTCDate(d.getUTCDate() + 1);
    cells.push({
      iso: d.toISOString().slice(0, 10),
      day: d.getUTCDate(),
      inMonth: false,
      date: d,
    });
  }

  return cells;
}

/**
 * @param {number} year
 * @param {number} month 0-11
 */
export function formatMonthYearLabelPt(year, month) {
  const d = new Date(Date.UTC(year, month, 1));
  const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * @param {Date} date
 */
export function monthKeyFromDate(date) {
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() };
}

/**
 * @param {{ year: number; month: number }} key
 * @param {number} deltaMonths
 */
export function shiftMonthKey(key, deltaMonths) {
  const d = new Date(Date.UTC(key.year, key.month + deltaMonths, 1));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
}
