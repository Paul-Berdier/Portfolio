/** Empêche l'interprétation comme formule par les tableurs, y compris après espaces.
 * @param {unknown} value
 */
export function csvCell(value) {
  let text = value == null ? '' : value instanceof Date ? value.toISOString() : String(value);
  if (/^[\s\uFEFF]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/** @param {Record<string, unknown>[]} rows @param {string[]} columns */
export function toCsv(rows, columns) {
  return (
    '\uFEFF' +
    [
      columns.map(csvCell).join(','),
      ...rows.map((row) => columns.map((key) => csvCell(row[key])).join(',')),
    ].join('\r\n') +
    '\r\n'
  );
}
