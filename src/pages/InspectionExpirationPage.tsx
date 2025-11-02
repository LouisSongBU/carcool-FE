import React, { useState, useEffect, useMemo } from "react";
import styles from "./InspectionExpirationPage.module.css";
import { fetchInspectionExpirationList, updateInspectionExpirationDay, fetchInspectionExpirationAll } from "../api/inspectionExpirationApi";
import { exportXlsx, XlsxColumn } from "../utils/exportXlsx";

// 从 sessionStorage 获取用户信息
const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
const displayName = userInfo.displayName;

// 新增：角色与超管标识
const role = (userInfo.role || "").toLowerCase();
const isSuperAdmin = role === "superadmin";

const COLUMNS = [
  { key: "id", label: "id" },
  { key: "firstRegistrationDate", label: "初登日期" },
  { key: "policyStartDate", label: "起保日期" },
  { key: "licensePlate", label: "车牌号" },
  { key: "vehicleModel", label: "厂牌型号" },
  { key: "insuredName", label: "被保险人" },
  { key: "insuredIdNumber", label: "被保险人证件" },
  { key: "phone", label: "电话" },
  { key: "mobile", label: "手机" },
  { key: "salesAgent", label: "业务员" },
  { key: "insuranceCompany", label: "保险公司" },
  { key: "engineNumber", label: "发动机号" },
  { key: "vinNumber", label: "车架号" },
];

const DEFAULT_DAYS = 60;

type Row = Record<string, any>;

type PagedResp = {
  items: Row[];
  total: number;
};

const InsuredExpirationPage: React.FC = () => {
  // 提前天数
  const [days, setDays] = useState<number>(
    userInfo.insuredExpirationDay ?? DEFAULT_DAYS
  );
  const [inputDays, setInputDays] = useState<number>(
    userInfo.insuredExpirationDay ?? DEFAULT_DAYS
  );

  // 分页状态
  const [page, setPage] = useState<number>(1); // 1-based
  const [size] = useState<number>(100);
  const [total, setTotal] = useState<number>(0);

  // 数据
  const [list, setList] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  // 总页数
  const totalPages = useMemo(
    () => (total > 0 ? Math.ceil(total / size) : 1),
    [total, size]
  );

  // 拉取分页数据
  useEffect(() => {
    let aborted = false;
    setLoading(true);
    setError(null);

    // 这里调用的是你 api/inspectionExpirationApi.ts 里的函数
    // 确保它的定义为 fetchInspectionExpirationList(displayName, days, page, size)
    fetchInspectionExpirationList(displayName, days, page, size)
      .then((data: PagedResp | Row[]) => {
        if (aborted) return;

        // 兼容旧版：如果后端暂未分页，data 可能是数组
        if (Array.isArray(data)) {
          // 手动在前端分页（每页固定 100 条）
          setList(data.slice((page - 1) * size, page * size));
          setTotal(data.length);
        } else {
          // 后端返回结构 { items, total }
          setList(data.items || []);
          setTotal(data.total ?? 0);
        }
      })
      .catch(() => {
        if (aborted) return;
        setError("数据获取失败");
      })
      .finally(() => {
        if (aborted) return;
        setLoading(false);
      });

    // 清理函数，防止异步结果在组件卸载后更新状态
    return () => {
      aborted = true;
    };
  }, [displayName, days, page, size]);

  // —— 导出全部（仅超级管理员可见） —— //
  const onExportAll = async () => {
    try {
      setLoading(true);
      // 只传 days；后端已做 GM 放行（全量）查询
      const rows = await fetchInspectionExpirationAll(days);
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
      const filename = `年检到期_${yyyy}-${mm}-${dd}`;

      exportXlsx(rows, columns, { filename });
    } catch (e: any) {
      alert("导出失败：" + (e?.message || "未知错误"));
    } finally {
      setLoading(false);
    }
  };

  // 天数输入校验
  const handleChangeDays = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setInputDays(val);
    if (val < 0 || val > 90) {
      setInputError("请输入0~90之间的数字");
    } else {
      setInputError(null);
    }
  };

  // 提交天数并刷新第一页
  const handleConfirmDays = async () => {
    if (inputDays < 0 || inputDays > 90) {
      setInputError("请输入0~90之间的数字");
      return;
    }
    if (!window.confirm("提交后会更改提前天数设置，是否继续？")) {
      return;
    }
    try {
      setLoading(true);
      await updateInspectionExpirationDay(displayName, inputDays);
      // 同步本地与 sessionStorage
      userInfo.insuredExpirationDay = inputDays;
      sessionStorage.setItem("userInfo", JSON.stringify(userInfo));
      setDays(inputDays);
      setPage(1); // 天数变化后回到第 1 页
    } catch (e) {
      setError("天数设置失败，请重试！");
    } finally {
      setLoading(false);
    }
  };

  // 分页操作
  const goFirst = () => setPage(1);
  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));
  const goLast = () => setPage(totalPages);

  const onJump = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("jumpPage") as HTMLInputElement;
    let n = Number(input.value);
    if (!Number.isFinite(n) || n <= 0) n = 1;
    if (n > totalPages) n = totalPages;
    setPage(n);
  };

  return (
    <div className={styles.expirationPage}>
      <div className={styles.topBar}>
        <span className={styles.title}>
          已保客户年检即将到期{" "}
          <span className={styles.count}>{total}</span> 人
        </span>

        <div className={styles.daysSelect}>
          <span>提前</span>
          <input
            type="number"
            min={0}
            max={90}
            value={inputDays}
            onChange={handleChangeDays}
            className={styles.input}
          />
          <span>天</span>
          <button
            className={styles.confirmBtn}
            onClick={handleConfirmDays}
            disabled={inputError !== null || inputDays === days}
          >
            确认
          </button>
          {inputError && (
            <span style={{ color: "red", marginLeft: 12 }}>{inputError}</span>
          )}
        </div>
      </div>

      <div className={styles.tableContainer}>
        {loading ? (
          <div style={{ padding: 30, textAlign: "center" }}>加载中...</div>
        ) : error ? (
          <div style={{ padding: 30, color: "#f44", textAlign: "center" }}>
            {error}
          </div>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  {COLUMNS.map((col) => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.length > 0 ? (
                  list.map((item, rowIdx) => (
                    <tr key={rowIdx}>
                      {COLUMNS.map((col) => (
                        <td key={col.key}>{item[col.key]}</td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={COLUMNS.length}
                      style={{ textAlign: "center", color: "#aaa" }}
                    >
                      暂无数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </div>
      {/* 分页条：在滚动容器外部 */}
      <div className={styles.paginationBar}>
        <div className={styles.pageInfo}>
          共 {total} 条；每页 <b>100</b> 条；第 {page}/{totalPages} 页
        </div>

        <div className={styles.pagerBtns}>
          {isSuperAdmin && (
            <button className={styles.confirmBtn} onClick={onExportAll} disabled={loading} title="导出所有"> 导出全部 </button>
          )}
          <button className={styles.pagerBtn} onClick={() => setPage(1)} disabled={page === 1} aria-label="首页">
            首页
          </button>
          <button className={styles.pagerBtn} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label="上一页">
            上一页
          </button>
          <button className={styles.pagerBtn} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label="下一页">
            下一页
          </button>
          <button className={styles.pagerBtn} onClick={() => setPage(totalPages)} disabled={page === totalPages} aria-label="末页">
            末页
          </button>

          <form onSubmit={(e) => {
            e.preventDefault();
            const input = (e.currentTarget.elements.namedItem("jumpPage") as HTMLInputElement);
            let n = Number(input.value);
            if (!Number.isFinite(n) || n <= 0) n = 1;
            if (n > totalPages) n = totalPages;
            setPage(n);
          }} className={styles.jumpForm}>
            <span>跳转</span>
            <input
              name="jumpPage"
              type="number"
              min={1}
              max={totalPages}
              defaultValue={page}
              className={styles.jumpInput}
              aria-label="跳转页码"
            />
            <span>页</span>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InsuredExpirationPage;
