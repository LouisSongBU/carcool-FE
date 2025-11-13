import React, { useEffect, useMemo, useState, useRef } from "react";
import styles from "./InsuredExpirationPage.module.css";
import { fetchInsuredExpirationList, updateInsuredExpirationDay, fetchInsuredExpirationAllByDays, createPotentialFromInsured } from "../api/insuredExpirationApi";
import { exportXlsx, XlsxColumn } from "../utils/exportXlsx";

type Row = Record<string, any>;
type PagedResp = { items: Row[]; total: number; page?: number; size?: number };

// 用户信息
const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
const displayName = userInfo.displayName;

// 新增：角色与超管标识
const role = (userInfo.role || "").toLowerCase();
const isSuperAdmin = role === "superadmin";

const COLUMNS = [
  { key: "policyStartDate", label: "起保日期", width: 100 },
  { key: "licensePlate", label: "车牌号", width: 100 },
  { key: "insuredName", label: "被保险人", width: 100 },
  { key: "phone", label: "电话", width: 100 },
  { key: "vehicleModel", label: "厂牌型号", width: 100 },
  { key: "insuredIdNumber", label: "被保险人证件", width: 100 },
  { key: "firstRegistrationDate", label: "初登日期", width: 100 },
  { key: "deliveryAddress", label: "地址", width: 100 },
  { key: "salesAgent", label: "业务员", width: 100 },
  { key: "insuranceCompany", label: "保险公司", width: 100 },
  { key: "engineNumber", label: "发动机号", width: 100 },
  { key: "vinNumber", label: "车架号", width: 100 },
  { key: "registrationOwner", label: "车主", width: 100 },
  { key: "registrationOwnerId", label: "车主证件", width: 100 },
  { key: "mobile", label: "手机", width: 100 },
];

const DEFAULT_DAYS = 60;

const InsuredExpirationPage: React.FC = () => {
  // 天数
  const [days, setDays] = useState<number>(userInfo.insuredExpirationDay ?? DEFAULT_DAYS);
  const [inputDays, setInputDays] = useState<number>(userInfo.insuredExpirationDay ?? DEFAULT_DAYS);
  const [inputError, setInputError] = useState<string | null>(null);

  // 分页
  const [page, setPage] = useState<number>(1); // 1-based
  const [size] = useState<number>(100);        // 固定 100
  const [total, setTotal] = useState<number>(0);

  // 数据
  const [list, setList] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = useMemo(() => (total > 0 ? Math.ceil(total / size) : 1), [total, size]);

  const [selectedRow, setSelectedRow] = useState<number | null>(null);

  const [creatingIds, setCreatingIds] = useState<Set<string | number>>(new Set());

  const [dragging, setDragging] = useState<{ col: number; startX: number; startWidth: number } | null>(null);
  const [dragLineX, setDragLineX] = useState<number | null>(null);

  const [colWidths, setColWidths] = useState<number[]>(
    () => COLUMNS.map(c => c.width || 100)
  );

  // 表格外层容器，用来计算 dragLine 的位置
  const tableContainerRef = useRef<HTMLDivElement | null>(null);

  // 点击“新增希望客户”
  const onCreatePotential = async (row: Row) => {
    // 如果你不想二次确认，可以去掉 confirm
    if (!window.confirm("确认将该已保客户信息复制为『希望客户』吗？")) return;

    const key = row.id ?? `${row.licensePlate || ""}-${row.vinNumber || ""}-${row.policyStartDate || ""}`;
    setCreatingIds(prev => new Set(prev).add(key));
    try {
      // 把整行原样传给后端（包含未展示字段）
      await createPotentialFromInsured({
        ...row,
        operator: displayName, // 可选：传当前操作人
      });
      alert("新增成功～");
    } catch (e: any) {
      alert(`新增失败：${e?.message || "未知错误"}`);
    } finally {
      setCreatingIds(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent, colIndex: number) => {
    setDragging({
      col: colIndex,
      startX: e.clientX,
      startWidth: colWidths[colIndex],
    });

    const container = tableContainerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      setDragLineX(e.clientX - rect.left + container.scrollLeft);
    } else {
      // 兜底，实在没有 ref 就用 clientX
      setDragLineX(e.clientX);
    }

    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging) return;
    const container = tableContainerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      setDragLineX(e.clientX - rect.left + container.scrollLeft);
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (!dragging) return;
    const delta = e.clientX - dragging.startX;
    setColWidths((prev) => {
      const next = [...prev];
      next[dragging.col] = Math.max(50, dragging.startWidth + delta);
      return next;
    });
    setDragging(null);
    setDragLineX(null);
  };

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]);

  useEffect(() => {
    let aborted = false;
    setLoading(true);
    setError(null);

    // 允许传 4 参；若后端暂未升级为分页，此处也兼容数组返回
    fetchInsuredExpirationList(displayName, days, page, size)
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

    return () => {
      aborted = true;
    };
  }, [displayName, days, page, size]);

  // —— 导出全部（仅超级管理员可见） —— //
  const onExportAll = async () => {
    try {
      setLoading(true);
      // 只传 days；后端已做 GM 放行（全量）查询
      const rows = await fetchInsuredExpirationAllByDays(days);
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
      const filename = `车险到期_${yyyy}-${mm}-${dd}`;

      exportXlsx(rows, columns, { filename });
    } catch (e: any) {
      alert("导出失败：" + (e?.message || "未知错误"));
    } finally {
      setLoading(false);
    }
  };

  // 输入校验
  const onDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setInputDays(val);
    setInputError(val < 0 || val > 90 ? "请输入 0 ~ 90 之间的数字" : null);
  };

  // 提交天数
  const onConfirmDays = async () => {
    if (inputDays < 0 || inputDays > 90) {
      setInputError("请输入 0 ~ 90 之间的数字");
      return;
    }
    if (!window.confirm("提交后会更改提前天数设置，是否继续？")) return;
    try {
      setLoading(true);
      await updateInsuredExpirationDay(displayName, inputDays);
      userInfo.insuredExpirationDay = inputDays;
      sessionStorage.setItem("userInfo", JSON.stringify(userInfo));
      setDays(inputDays);
      setPage(1);
    } catch {
      setError("天数设置失败，请重试！");
    } finally {
      setLoading(false);
    }
  };

  // 分页跳转
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
        <span className={styles.title}>
          已保客户即将到期 <span className={styles.count}>{total}</span> 人
        </span>
        <div className={styles.daysSelect}>
          <span>提前</span>
          <input type="number" min={0} max={90} value={inputDays} onChange={onDaysChange} className={styles.input} />
          <span>天</span>
          <button className={styles.confirmBtn} onClick={onConfirmDays} disabled={!!inputError || inputDays === days}>
            确认
          </button>
          {inputError && <span style={{ color: "red", marginLeft: 12 }}>{inputError}</span>}
        </div>
      </div>

      <div className={styles.tableWrapper}>
        {/* 拖拽时的竖线参考线 */}
        {dragLineX !== null && (
          <div
            className={styles.dragLine}
            style={{ left: dragLineX }}
          />
        )}
        {/* 表格滚动区 */}
        <div className={styles.tableContainer} ref={tableContainerRef}>

          {loading ? (
            <div style={{ padding: 30, textAlign: "center" }}>加载中...</div>
          ) : error ? (
            <div style={{ padding: 30, color: "#f44", textAlign: "center" }}>{error}</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  {COLUMNS.map((col, idx) => (
                    <th
                      key={col.key}
                      style={{
                        width: colWidths[idx],
                        minWidth: colWidths[idx],
                      }
                      }
                    >
                      <div className={styles.thInner}>
                        <span>{col.label}</span>
                        <span
                          className={styles.colResizer}
                          onMouseDown={e => handleMouseDown(e, idx)}
                        />
                      </div>
                    </th>
                  ))}
                  <th style={{ width: 120, minWidth: 120 }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {list.length ? (
                  list.map((item, idx) => {
                    const key =
                      item.id ??
                      `${item.licensePlate || ""}-${item.vinNumber || ""}-${item.policyStartDate || ""}`;
                    const pending = creatingIds.has(key);
                    return (
                      <tr
                        key={idx}
                        className={`${styles.tableRow} ${selectedRow === idx ? styles.activeRow : ""
                          }`}
                        onClick={() => setSelectedRow(idx)}
                      >
                        {COLUMNS.map((col, cIdx) => (
                          <td
                            key={col.key}
                            style={{
                              width: colWidths[cIdx],
                              minWidth: colWidths[cIdx],
                              maxWidth: colWidths[cIdx],
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {item[col.key]}
                          </td>
                        ))}

                        {/* 操作列 */}
                        <td
                          style={{
                            width: 100,
                            minWidth: 100,
                            maxWidth: 100,
                            textAlign: "center"
                          }}
                        >
                          <button
                            className={styles.confirmBtn}
                            disabled={pending}
                            onClick={e => {
                              e.stopPropagation(); // 防止选中高亮
                              onCreatePotential(item);
                            }}
                            title="将该行信息复制为希望客户"
                          >
                            {pending ? "创建中..." : "新增希望客户"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={COLUMNS.length + 1}
                      style={{ textAlign: "center", color: "#999" }}
                    >
                      暂无数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 分页条（滚动区外） */}
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
            <input name="jumpPage" type="number" min={1} max={totalPages} defaultValue={page} className={styles.jumpInput} />
            <span>页</span>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InsuredExpirationPage;
