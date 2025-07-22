import React, { useState, useEffect } from "react";
import styles from "./InspectionExpirationPage.module.css";
import { fetchInspectionExpirationList, updateInspectionExpirationDay } from "../api/inspectionExpirationApi";

// 从 sessionStorage 获取用户信息
const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || '{}');
const displayName = userInfo.displayName;

const COLUMNS = [
  { key: 'id', label: 'id' },
  { key: 'firstRegistrationDate', label: '初登日期' },
  { key: 'policyStartDate', label: '起保日期' },
  { key: 'licensePlate', label: '车牌号' },
  { key: 'vehicleModel', label: '厂牌型号' },
  { key: 'insuredName', label: '被保险人' },
  { key: 'insuredIdNumber', label: '被保险人证件' },
  { key: 'phone', label: '电话' },
  { key: 'mobile', label: '手机' },
  { key: 'salesAgent', label: '业务员' },
  { key: 'insuranceCompany', label: '保险公司' },
  { key: 'engineNumber', label: '发动机号' },
  { key: 'vinNumber', label: '车架号' },
];

const DEFAULT_DAYS = 60;

const InsuredExpirationPage: React.FC = () => {
  // 初始天数来自用户信息（没有就用默认60）
  const [days, setDays] = useState<number>(userInfo.insuredExpirationDay ?? DEFAULT_DAYS);
  const [inputDays, setInputDays] = useState<number>(userInfo.insuredExpirationDay ?? DEFAULT_DAYS);
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchInspectionExpirationList(displayName, days)
      .then(data => setList(data))
      .catch(() => setError("数据获取失败"))
      .finally(() => setLoading(false));
  }, [displayName, days]);

  // 天数输入校验
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setInputDays(val);
    if (val < 0 || val > 90) {
      setInputError("请输入0~90之间的数字");
    } else {
      setInputError(null);
    }
  };

  // 提交确认
  const handleConfirm = async () => {
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
      // 同步本地和 sessionStorage 用户信息
      userInfo.insuredExpirationDay = inputDays;
      sessionStorage.setItem("userInfo", JSON.stringify(userInfo));
      setDays(inputDays); // 触发 useEffect 拉新数据
    } catch (e) {
      setError("天数设置失败，请重试！");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.expirationPage}>
      <div className={styles.topBar}>
        <span className={styles.title}>
          已保客户年检即将到期 <span className={styles.count}>{list.length}</span> 人
        </span>
        <div className={styles.daysSelect}>
          <span>提前</span>
          <input
            type="number"
            min={0}
            max={90}
            value={inputDays}
            onChange={handleChange}
            className={styles.input}
          />
          <span>天</span>
          <button
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={inputError !== null || inputDays === days}
          >
            确认
          </button>
          {inputError && <span style={{ color: "red", marginLeft: 12 }}>{inputError}</span>}
        </div>
      </div>
      <div className={styles.tableContainer}>
        {loading ? (
          <div style={{ padding: 30, textAlign: "center" }}>加载中...</div>
        ) : error ? (
          <div style={{ padding: 30, color: "#f44", textAlign: "center" }}>{error}</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                {COLUMNS.map(col => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.length > 0 ? (
                list.map((item, rowIdx) => (
                  <tr key={rowIdx}>
                    {COLUMNS.map(col => (
                      <td key={col.key}>{item[col.key]}</td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={COLUMNS.length} style={{ textAlign: "center", color: "#aaa" }}>
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default InsuredExpirationPage;
