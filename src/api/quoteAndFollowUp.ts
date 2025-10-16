import api from "./api";

/* =========================================================
 * 类型定义
 * =======================================================*/
export type DailyCount = {
  /** MM-DD */
  date: string;
  count: number;
};

export type ReportResponse = {
  agent: string;
  total: number;
  rows: DailyCount[];
};

export type ReportResponseList = ReportResponse[];

export type QueryParams = {
  /** YYYY-MM-DD */
  start: string;
  /** YYYY-MM-DD */
  end: string;
  /** 可选；为空表示全员 */
  agent?: string;
  /** 下拉类型 */
  type: "报价" | "回访";
};

/* =========================================================
 * 业务常量
 * =======================================================*/
export const MAX_DAYS = 180;

/* =========================================================
 * 路由与 API 封装
 * =======================================================*/
function endpointOf(type: "报价" | "回访") {
  // 注意：与你后端 Controller 完全一致（followUps 的 U 大写）
  return type === "报价" ? "/reports/quotes" : "/reports/followUps";
}

/** 拉取统计数据（返回后已做基本清洗） */
export async function fetchStats(params: QueryParams): Promise<ReportResponseList> {
  const { type, agent, ...rest } = params;
  const url = endpointOf(type);

  // 规范 agent：空串不传参，后端即查询全员
  const cleaned = { ...rest, ...(agent && agent.trim() ? { agent: agent.trim() } : {}) };

  const res = await api.get(url, { params: cleaned });
  const data = res.data;

  if (Array.isArray(data)) return data.map(sanitizeReport);
  return [sanitizeReport(data)];
}

/* =========================================================
 * 结果清洗（健壮化）
 * =======================================================*/
function sanitizeReport(r: any): ReportResponse {
  return {
    agent: String(r?.agent ?? ""),
    total: Number.isFinite(Number(r?.total)) ? Number(r.total) : 0,
    rows: Array.isArray(r?.rows) ? r.rows.map(sanitizeDaily) : [],
  };
}

function sanitizeDaily(d: any): DailyCount {
  // 若后端给 YYYY-MM-DD，这里只取 MM-DD；若已是 MM-DD 也能兼容
  const raw = String(d?.date ?? "");
  const mmdd = raw.length >= 10 ? raw.slice(5, 10) : raw;
  return {
    date: mmdd,
    count: Number.isFinite(Number(d?.count)) ? Number(d.count) : 0,
  };
}

/* =========================================================
 * 透视渲染辅助：补零 & 平铺
 * =======================================================*/
export type PivotRow = {
  agent: string;
  total: number;
  [mmdd: string]: number | string;
};

/** 将后端 [{agent,total,rows:[{MM-DD,count}]}] 转为表格行，并按列头补零 */
export function pivotWithZeroFill(list: ReportResponseList, mmddCols: string[]): PivotRow[] {
  return list.map((r) => {
    const map = new Map<string, number>();
    r.rows.forEach((d) => map.set(d.date, (map.get(d.date) || 0) + (d.count || 0)));
    const row: PivotRow = { agent: r.agent, total: r.total ?? 0 };
    mmddCols.forEach((k) => (row[k] = map.get(k) ?? 0));
    return row;
  });
}

/* =========================================================
 * 本地口径（无时区）的日期工具：纯字符串推进一天
 * =======================================================*/

/** 解析 YYYY-MM-DD -> [y, m, d] */
function parseYMD(s: string): [number, number, number] {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) throw new Error(`Invalid date: ${s}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}
function isLeap(y: number) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}
function dim(y: number, m: number) {
  return [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
}
function nextDay(y: number, m: number, d: number): [number, number, number] {
  const days = dim(y, m);
  if (d < days) return [y, m, d + 1];
  if (m < 12) return [y, m + 1, 1];
  return [y + 1, 1, 1];
}
/** a <= b ? （均为 [y,m,d]） */
function ymdLTE(a: [number, number, number], b: [number, number, number]) {
  if (a[0] !== b[0]) return a[0] < b[0];
  if (a[1] !== b[1]) return a[1] < b[1];
  return a[2] <= b[2];
}

/** 生成从 start~end 的连续日期列表（输出 MM-DD），纯字符串推进，无任何时区参与 */
export function buildMMDDList(start: string, end: string): string[] {
  const s = parseYMD(start);
  const e = parseYMD(end);
  if (!ymdLTE(s, e)) return [];
  const out: string[] = [];
  let [y, m, d] = s;
  while (ymdLTE([y, m, d], e)) {
    out.push(String(m).padStart(2, "0") + "-" + String(d).padStart(2, "0"));
    [y, m, d] = nextDay(y, m, d);
  }
  return out;
}

/** 计算两个 YYYY-MM-DD 之间的天数（含头含尾），纯字符串推进，无任何时区参与 */
export function inclusiveDays(start: string, end: string): number {
  const s = parseYMD(start);
  const e = parseYMD(end);
  if (!ymdLTE(s, e)) return 0;
  let [y, m, d] = s;
  let cnt = 0;
  while (ymdLTE([y, m, d], e)) {
    cnt++;
    [y, m, d] = nextDay(y, m, d);
  }
  return cnt;
}

/* =========================================================
 * 本地时间显示相关（保留你的口径）
 * =======================================================*/

/** 获取本地当天日期字符串，格式 yyyy-mm-dd */
export function getTodayDate(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** 获取本地当前时间字符串，格式 yyyy-mm-dd HH:mm:ss */
export function getNowDateTime(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const HH = String(now.getHours()).padStart(2, "0");
  const MM = String(now.getMinutes()).padStart(2, "0");
  const SS = String(now.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${HH}:${MM}:${SS}`;
}

/** 格式化任意 Date 对象为 yyyy-mm-dd HH:mm:ss（本地口径） */
export function formatDateTime(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const HH = String(date.getHours()).padStart(2, "0");
  const MM = String(date.getMinutes()).padStart(2, "0");
  const SS = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${HH}:${MM}:${SS}`;
}

/** 格式化任意 Date 对象为 yyyy-mm-dd（本地口径） */
export function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/* =========================================================
 * 可选：对象中递归转换“日期时间”字段（不碰纯日期）
 * —— 仅当你确实需要把 *Time/*At 转为 Date 时再用
 * =======================================================*/

/** 仅识别“日期时间”的 ISO 字符串（必须含有时间部分） */
function isIsoDateTimeString(value: string) {
  return /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?(Z|([+-]\d{2}:\d{2}))?$/.test(value);
}

/** 递归转换对象或数组内所有 *Time / *At 结尾的“日期时间”字段；保留 *Date 为字符串 */
export function convertDatesInObject<T>(obj: T): T {
  if (Array.isArray(obj)) return obj.map(convertDatesInObject) as any;

  if (obj !== null && typeof obj === "object") {
    const ret: any = {};
    for (const key in obj as any) {
      const value = (obj as any)[key];

      if (
        value &&
        typeof value === "string" &&
        (key.endsWith("Time") || key.endsWith("At")) &&
        isIsoDateTimeString(value)
      ) {
        ret[key] = new Date(value);
      } else if (value && typeof value === "object") {
        ret[key] = convertDatesInObject(value);
      } else {
        ret[key] = value;
      }
    }
    return ret;
  }
  return obj;
}
