import React, { useState, useEffect } from "react";
import styles from "./PotentialBirthdayPage.module.css";
import { fetchPotentialBirthdayList } from "../api/potentialBirthdayApi";

// 从 sessionStorage 获取用户信息
const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || '{}');
const displayName = userInfo.displayName;

const COLUMNS = [
  { key: 'id', label: 'id' },
  { key: 'policyStartDate', label: '起保日期' },
  { key: 'licensePlate', label: '车牌号' },
  { key: 'vehicleModel', label: '厂牌型号' },
  { key: 'insuredName', label: '被保险人' },
  { key: 'insuredIdNumber', label: '被保险人证件' },
  { key: 'phone', label: '电话' },
  { key: 'salesAgent', label: '业务员' },
  { key: 'insuranceCompany', label: '保险公司' },
  { key: 'engineNumber', label: '发动机号' },
  { key: 'vinNumber', label: '车架号' },
];

const PotentialBirthdayPage: React.FC = () => {
  // 初始天数来自用户信息（没有就用默认60）
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchPotentialBirthdayList(displayName)
      .then(data => setList(data))
      .catch(() => setError("数据获取失败"))
      .finally(() => setLoading(false));
  }, [displayName]);

  return (
    <div className={styles.expirationPage}>
      <div className={styles.topBar}>
        <span className={styles.title}>
          希望客户过生日 <span className={styles.count}>{list.length}</span> 人
        </span>
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

export default PotentialBirthdayPage;
