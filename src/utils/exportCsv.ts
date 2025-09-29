// src/utils/exportCsv.ts
export type CsvValue =
  | string | number | boolean | null | undefined | Date
  | Array<string | number | boolean | null | undefined | Date>
  | Record<string, any>;

export type CsvColumn<T> = {
  title: string;
  key?: keyof T | string;
  value?: (row: T, rowIndex: number) => CsvValue;
  format?: (v: CsvValue, row: T, rowIndex: number) => string | number;
};

export type CsvOptions<T> = {
  filename?: string;
  delimiter?: string;
  newline?: "\n" | "\r\n";
  bom?: boolean;
  nullPlaceholder?: string;
  arrayJoiner?: string;
  formatter?: (v: CsvValue, row: T, rowIndex: number, col: CsvColumn<T>) => string | number;
};

const defaultOptions: Required<Omit<CsvOptions<any>, "filename" | "formatter">> = {
  delimiter: ",",
  newline: "\n",
  bom: true,
  nullPlaceholder: "",
  arrayJoiner: " | ",
};

function deepGet(obj: any, path?: string | number) {
  if (path == null || path === "") return undefined;
  if (typeof path === "number") return obj?.[path];
  if (typeof path !== "string") return obj?.[path as any];
  return path.split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

function isoDateTime(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`;
}

function normalizeValue(
  v: CsvValue,
  row: any,
  rowIndex: number,
  arrayJoiner: string
): string | number {
  if (v == null) return "";
  if (v instanceof Date) return isoDateTime(v);
  if (Array.isArray(v)) {
    return v.map(x => normalizeValue(x, row, rowIndex, arrayJoiner)).join(arrayJoiner);
  }
  if (typeof v === "object") {
    try { return JSON.stringify(v); } catch { return String(v); }
  }
  if (typeof v === "boolean") return v ? "true" : "false";
  return v as any;
}

function stringifyCell(raw: string | number, delimiter: string) {
  const s = String(raw ?? "");
  if (s.includes('"') || s.includes(delimiter) || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildCsvMatrix<T>(rows: T[], columns: CsvColumn<T>[], options?: CsvOptions<T>) {
  const opt = { ...defaultOptions, ...options };
  const head = columns.map(c => c.title);
  const body = rows.map((row, i) =>
    columns.map(col => {
      const fromValue = col.value != null ? col.value(row, i) : deepGet(row, col.key as any);
      const normalized = normalizeValue(fromValue, row, i, opt.arrayJoiner);
      const colFormatted = typeof col.format === "function" ? col.format(normalized, row, i) : normalized;
      const finalFormatted =
        typeof options?.formatter === "function" ? options.formatter(colFormatted, row, i, col) : colFormatted;
      return finalFormatted ?? opt.nullPlaceholder;
    })
  );
  return [head, ...body];
}

export function makeCsvBlob(matrix: (string | number)[][], options?: CsvOptions<any>): Blob {
  const opt = { ...defaultOptions, ...options };
  const { delimiter, newline, bom } = opt;

  const csv = matrix.map(row => row.map(cell => stringifyCell(cell, delimiter)).join(delimiter)).join(newline);

  const parts: (Uint8Array | string)[] = [];
  if (bom) parts.push(new Uint8Array([0xef, 0xbb, 0xbf]));
  parts.push(csv);

  return new Blob(parts, { type: "text/csv;charset=utf-8;" });
}

export function downloadBlob(blob: Blob, filename = "data.csv") {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCsv<T>(rows: T[], columns: CsvColumn<T>[], options?: CsvOptions<T>) {
  const matrix = buildCsvMatrix(rows, columns, options);
  const blob = makeCsvBlob(matrix, options);
  downloadBlob(blob, options?.filename ?? "data.csv");
}
