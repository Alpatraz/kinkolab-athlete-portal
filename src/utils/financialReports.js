function escapeXml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[character]));
}

function download(content, mimeType, fileName) {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportExcelReport({ title, columns, rows, fileName = "rapport-financier.xls" }) {
  const header = columns.map((column) => `<Cell><Data ss:Type="String">${escapeXml(column.label)}</Data></Cell>`).join("");
  const body = rows.map((row) => `<Row>${columns.map((column) => {
    const value = typeof column.value === "function" ? column.value(row) : row[column.value];
    const type = column.type === "Number" && Number.isFinite(Number(value)) ? "Number" : "String";
    return `<Cell><Data ss:Type="${type}">${escapeXml(type === "Number" ? Number(value) : value ?? "")}</Data></Cell>`;
  }).join("")}</Row>`).join("");
  const xml = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#111111" ss:Pattern="Solid"/></Style><Style ss:ID="Title"><Font ss:Bold="1" ss:Size="16" ss:Color="#B38B24"/></Style></Styles><Worksheet ss:Name="Rapport"><Table><Row ss:StyleID="Title"><Cell ss:MergeAcross="${Math.max(columns.length - 1, 0)}"><Data ss:Type="String">${escapeXml(title)}</Data></Cell></Row><Row ss:StyleID="Header">${header}</Row>${body}</Table></Worksheet></Workbook>`;
  download(xml, "application/vnd.ms-excel;charset=utf-8", fileName);
}

export function printFinancialReport({ title, subtitle = "", columns, rows, summary = [] }) {
  const popup = window.open("", "_blank", "noopener,noreferrer");
  if (!popup) throw new Error("Autorisez les fenêtres contextuelles pour imprimer le rapport.");
  const summaryHtml = summary.map((item) => `<div class="summary"><span>${escapeXml(item.label)}</span><strong>${escapeXml(item.value)}</strong></div>`).join("");
  const tableRows = rows.map((row) => `<tr>${columns.map((column) => `<td>${escapeXml(typeof column.value === "function" ? column.value(row) : row[column.value] ?? "")}</td>`).join("")}</tr>`).join("");
  popup.document.write(`<!doctype html><html><head><title>${escapeXml(title)}</title><style>body{font-family:Arial,sans-serif;color:#111;padding:32px}header{border-bottom:4px solid #d7b85b;padding-bottom:16px;margin-bottom:24px}h1{margin:0;font-size:28px}.meta{color:#666;margin-top:8px}.summaries{display:flex;gap:12px;flex-wrap:wrap;margin:20px 0}.summary{border:1px solid #ddd;border-radius:10px;padding:12px 16px;min-width:150px}.summary span{display:block;color:#666;font-size:12px}.summary strong{font-size:18px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#111;color:#fff;text-align:left;padding:10px}td{border-bottom:1px solid #ddd;padding:9px}.footer{margin-top:24px;color:#777;font-size:11px}@media print{body{padding:0}.no-print{display:none}}</style></head><body><header><h1>${escapeXml(title)}</h1><p class="meta">${escapeXml(subtitle)} · ${new Date().toLocaleString("fr-CA")}</p></header><div class="summaries">${summaryHtml}</div><table><thead><tr>${columns.map((column) => `<th>${escapeXml(column.label)}</th>`).join("")}</tr></thead><tbody>${tableRows}</tbody></table><p class="footer">KinkoLab Inc. · Rapport généré depuis le Portail Athlètes</p><script>window.onload=()=>window.print()</script></body></html>`);
  popup.document.close();
}
