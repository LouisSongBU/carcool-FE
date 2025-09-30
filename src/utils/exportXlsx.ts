// utils/exportXlsx.ts
import * as XLSX from "xlsx";

export type XlsxColumn<Row> = {
  title: string;                       // 表头标题
  key?: keyof Row & string;            // 直接按 key 取
  value?: (row: Row, idx: number) => any; // 或者用函数返回
};

type ExportOptions = {
  filename: string;                    // 例如 "车险导出_2025-09-30.xlsx"
  sheetName?: string;                  // 默认 "Sheet1"
};

// 估算字符串显示宽度（中文≈2、ASCII≈1）
const strWidth = (s: string) => {
  if (!s) return 8;
  let w = 0;
  for (const ch of s) w += ch.charCodeAt(0) > 255 ? 2 : 1;
  // 给点余量，限制范围
  return Math.min(Math.max(w + 2, 6), 80);
};

// 将任意值安全转成文本（保持“看起来是什么就是什么”）
const toText = (v: any): string => {
  if (v == null) return "";
  // Date -> ISO(仅日期)；其它保持原样字符串化
  if (v instanceof Date) return v.toISOString().slice(0, 19).replace("T", " ");
  return String(v);
};

export function exportXlsx<Row extends Record<string, any>>(
  rows: Row[],
  columns: XlsxColumn<Row>[],
  opts: ExportOptions
) {
  const sheetName = (opts.sheetName || "Sheet1").slice(0, 31); // Excel sheet 名上限 31
  const data: string[][] = [];

  // 1) 头
  data.push(columns.map(c => c.title));

  // 2) 身（先全部转成 string，彻底避免科学计数法）
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const arr = columns.map(c => {
      const raw = c.value ? c.value(row, i) : (c.key ? row[c.key] : "");
      return toText(raw);
    });
    data.push(arr);
  }

  // 3) 生成 Sheet（先快速生成，再逐格设为文本类型 + 自动列宽）
  const ws = XLSX.utils.aoa_to_sheet(data);

  // 自动列宽：根据 header + 每列最大内容，计算 wch
  const colMax = columns.map((c, ci) => strWidth(c.title));
  for (let r = 1; r < data.length; r++) {
    for (let c = 0; c < columns.length; c++) {
      const v = data[r][c] ?? "";
      colMax[c] = Math.max(colMax[c], strWidth(v));
      // 强制文本类型
      const ref = XLSX.utils.encode_cell({ r, c });
      const cell = ws[ref] || (ws[ref] = {});
      cell.t = "s";
      cell.v = v;
    }
  }
  ws["!cols"] = colMax.map(wch => ({ wch }));

  // 4) 组装工作簿并下载
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const filename = opts.filename.endsWith(".xlsx") ? opts.filename : `${opts.filename}.xlsx`;
  XLSX.writeFile(wb, filename);
}

// 新增一个 AOA 版本：直接导出二维数组 + 自动列宽 + 文本单元格
export async function exportXlsxFromMatrix(
    matrix: (string | number)[][],
    opts: { filename: string; sheetName?: string; merges?: { s:{r:number,c:number}, e:{r:number,c:number} }[] }
  ) {
    const XLSX = await import("xlsx");
  
    // toText & strWidth：与现有实现保持一致（若你已有，就直接复用你已有的工具）
    const toText = (v: any) => v == null ? "" : String(v);
    const strWidth = (s: string) => {
      if (!s) return 8;
      let w = 0; for (const ch of s) w += ch.charCodeAt(0) > 255 ? 2 : 1;
      return Math.min(Math.max(w + 2, 6), 80);
    };
  
    const ws = XLSX.utils.aoa_to_sheet(matrix.map(row => row.map(toText)));
    if (opts.merges?.length) ws["!merges"] = opts.merges;
  
    // 强制文本 + 自动列宽
    const colCount = Math.max(...matrix.map(r => r.length), 0);
    const colMax = Array.from({ length: colCount }, (_, c) => strWidth(matrix[0]?.[c] ? toText(matrix[0][c]) : ""));
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < colCount; c++) {
        const ref = XLSX.utils.encode_cell({ r, c });
        const cell = ws[ref] || (ws[ref] = {});
        const v = toText(matrix[r]?.[c] ?? "");
        cell.t = "s"; cell.v = v;
        colMax[c] = Math.max(colMax[c], strWidth(v));
      }
    }
    ws["!cols"] = colMax.map(wch => ({ wch }));
  
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, (opts.sheetName || "Sheet1").slice(0,31));
    const name = opts.filename.endsWith(".xlsx") ? opts.filename : `${opts.filename}.xlsx`;
    XLSX.writeFile(wb, name);
  }
  