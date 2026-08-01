export function localizedField(record, field, language = "fr", legacyFields = []) {
  if (!record) return "";
  const preferred = language === "en" ? "En" : "Fr";
  const alternate = language === "en" ? "Fr" : "En";
  const candidates = [
    record[`${field}${preferred}`],
    record[`${field}${alternate}`],
    record[field],
    ...legacyFields.map((legacyField) => record[legacyField]),
  ];
  return candidates.find((value) => typeof value === "string" && value.trim()) || "";
}

export function hasLocalizedField(record, field, legacyFields = []) {
  return Boolean(localizedField(record, field, "fr", legacyFields));
}

export function bilingualPayload(values, fields) {
  return fields.reduce((payload, field) => {
    payload[`${field}Fr`] = values[`${field}Fr`] || "";
    payload[`${field}En`] = values[`${field}En`] || "";
    return payload;
  }, {});
}
