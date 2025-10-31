// Sanitiza conforme Volume VI: remove #x0000, aceita BOM, normaliza UTF-8
const ALLOWED = /[\t\n\r\u0020-\u007E\u0085\u00A0-\u00FF]/;

export function preprocessXml(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input));
  let s = buf.toString("utf8").replaceAll("\u0000", "");
  if (s.codePointAt(0) === 0xFEFF) s = s.slice(1);
  s = [...s].filter(ch => ALLOWED.test(ch)).join("");
  return s;
}

