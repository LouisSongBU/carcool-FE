import React, { useEffect, useMemo, useState } from "react";
import styles from "./PotentialBirthdayPage.module.css";
import { fetchPotentialBirthdayList, fetchPotentialBirthdayAll } from "../api/potentialBirthdayApi";
import { exportXlsx, XlsxColumn } from "../utils/exportXlsx";

type Row = Record<string, any>;
type PagedResp = { items: Row[]; total: number; page?: number; size?: number };

const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
const displayName = userInfo.displayName;

// 新增：角色与超管标识
const role = (userInfo.role || "").toLowerCase();
const isSuperAdmin = role === "superadmin";

const COLUMNS = [
  { key: "id", label: "id" },
  { key: "policyStartDate", label: "起保日期" },
  { key: "licensePlate", label: "车牌号" },
  { key: "vehicleModel", label: "厂牌型号" },
  { key: "registrationOwner", label: "车主" },
  { key: "registrationOwnerId", label: "车主证件" },
  { key: "phone", label: "电话" },
  { key: "salesAgent", label: "业务员" },
  { key: "insuranceCompany", label: "保险公司" },
  { key: "engineNumber", label: "发动机号" },
  { key: "vinNumber", label: "车架号" },
];

const PotentialBirthdayPage: React.FC = () => {
  const [page, setPage] = useState<number>(1);
  const [size] = useState<number>(100);
  const [total, setTotal] = useState<number>(0);

  const [list, setList] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = useMemo(() => (total > 0 ? Math.ceil(total / size) : 1), [total, size]);

  useEffect(() => {
    let aborted = false;
    setLoading(true);
    setError(null);

    fetchPotentialBirthdayList(displayName, page, size)
      .then((data: PagedResp | Row[]) => {
        if (aborted) return;
        if (Array.isArray(data)) {
          setList(data.slice((page - 1) * size, page * size));
          setTotal(data.length);
        } else {
          setList(data.items || []);
          setTotal(Number.isFinite(data.total as number) ? (data.total as number) : (data.items?.length ?? 0));
        }
      })
      .catch(() => !aborted && setError("数据获取失败"))
      .finally(() => !aborted && setLoading(false));

    return () => { aborted = true; };
  }, [displayName, page, size]);

  // —— 导出全部（仅超级管理员可见） —— //
    const onExportAll = async () => {
      try {
        setLoading(true);
        // 只传 days；后端已做 GM 放行（全量）查询
        const rows = await fetchPotentialBirthdayAll();
        if (!rows?.length) {
          alert("当前条件下没有可导出的数据～");
          return;
        }
  
        // 列 = 到期页 COLUMNS（表头与字段完全一致）
        const columns: XlsxColumn<any>[] = [
          { title: "#", value: (_r, i) => i + 1 },
          ...COLUMNS.map(col => ({
            title: col.label,
            key: col.key,
            // 小格式化：日期字段裁到 YYYY-MM-DD（与页面展示一致）
            format: (v: any) => {
              const isDateKey = String(col.key).toLowerCase().includes("date");
              if (isDateKey && typeof v === "string") return v.slice(0, 10);
              return v as any;
            }
          }))
        ];
  
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const filename = `希望客户生日_${yyyy}-${mm}-${dd}`;
  
        exportXlsx(rows, columns, { filename });
      } catch (e: any) {
        alert("导出失败：" + (e?.message || "未知错误"));
      } finally {
        setLoading(false);
      }
    };

  const jump = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("jumpPage") as HTMLInputElement;
    let n = Number(input.value);
    if (!Number.isFinite(n) || n <= 0) n = 1;
    if (n > totalPages) n = totalPages;
    setPage(n);
  };

  return (
    <div className={styles.expirationPage}>
      <div className={styles.topBar}>
        <span className={styles.title}>希望客户过生日 <span className={styles.count}>{total}</span> 人</span>
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <div style={{ padding: 30, textAlign: "center" }}>加载中...</div>
        ) : error ? (
          <div style={{ padding: 30, color: "#f44", textAlign: "center" }}>{error}</div>
        ) : (
          <table className={styles.table}>
            <thead><tr>{COLUMNS.map(col => <th key={col.key}>{col.label}</th>)}</tr></thead>
            <tbody>
              {list.length ? list.map((item, idx) => (
                <tr key={idx}>{COLUMNS.map(col => <td key={col.key}>{item[col.key]}</td>)}</tr>
              )) : (
                <tr><td colSpan={COLUMNS.length} style={{ textAlign: "center", color: "#999" }}>暂无数据</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.paginationBar}>
        <div className={styles.pageInfo}>共 {total} 条；每页 <b>100</b> 条；第 {page}/{totalPages} 页</div>
        <div className={styles.pagerBtns}>
        {isSuperAdmin && (
            <button className={styles.confirmBtn} onClick={onExportAll} disabled={loading} title="导出所有"> 导出全部 </button>
          )}
          <button className={styles.pagerBtn} onClick={() => setPage(1)} disabled={page === 1}>首页</button>
          <button className={styles.pagerBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>上一页</button>
          <button className={styles.pagerBtn} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>下一页</button>
          <button className={styles.pagerBtn} onClick={() => setPage(totalPages)} disabled={page === totalPages}>末页</button>
          <form onSubmit={jump} className={styles.jumpForm}>
            <span>跳转</span>
            <input name="jumpPage" type="number" min={1} max={totalPages} defaultValue={page} className={styles.jumpInput}/>
            <span>页</span>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PotentialBirthdayPage;
