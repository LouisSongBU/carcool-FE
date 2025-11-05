import { getCommissionData, batchPay } from "../api/WageSettlement.ts";
import styles from "./WageSettlement.module.css";
import React, { useEffect, useState } from "react";
import { Button, Form, Table, Row, Col } from "react-bootstrap";
import { UserItem } from "../App";
import { exportXlsx, XlsxColumn } from "../utils/exportXlsx";

// commissionTypes.ts
export interface CommissionSummary {
  salesAgent: string;
  hierarchyCode: string;
  startDate: string;
  endDate: string;
  commercialPolicyCount: number;
  compulsoryPolicyCount: number;
  commercialPremium: number;
  commercialCommission: number;
  compulsoryPremium: number;
  compulsoryCommission: number;
  receivablePremium: number;
  receivedPremium: number;
  commissionAmount: number;
  actualCommission: number;
}

export interface CommissionDetail {
  id: number;
  signingDate: string;
  commercialPolicyNumber: string;
  licensePlate: string;
  insuredName: string;
  insuranceCompany: string | null;
  salesAgent: string;
  hierarchyCode: string;
  commercialPremium: number;
  commercialCommission: number;
  commercialCommissionPercent: number;
  compulsoryPremium: number;
  compulsoryCommission: number;
  compulsoryCommissionPercent: number;
  receivablePremium: number;
  receivedPremium: number;
  commissionAmount: number;
  actualCommission: number;
  intermediaryInvoiceNo: number | null;
  payStatus: string;
}

type WageSettlementProps = {
  userList: UserItem[];
};


const WageSettlementPage: React.FC<WageSettlementProps> = ({ userList }) => {
  const [summary, setSummary] = useState<CommissionSummary[]>([]);
  const [details, setDetails] = useState<CommissionDetail[]>([]);
  const [activeHierarchy, setActiveHierarchy] = useState<string>("");

  const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || '{}');
  const currentUserName = userInfo.displayName || ""; // 当前用户显示名
  const currentHierarchyCode = userInfo.hierarchyCode || ""; // 当前用户层级码
  const role = userInfo.role || "normal";
  const isSuperAdmin = role === "superAdmin";

  const [agentInput, setAgentInput] = useState(""); // 输入框内容
  const [selectedAgent, setSelectedAgent] = useState<{ displayName: string; hierarchyCode: string } | null>(null); // 已选业务员
  const [agentDropdown, setAgentDropdown] = useState(false);

  // === 在组件里新增这几个 state 和函数 ===
  const [colWidths, setColWidths] = useState<number[]>([80, 180, 80, 100, 100, 100, 50, 50, 50, 50, 50, 50, 50, 80, 80]);
  const [dragging, setDragging] = useState<{ col: number; startX: number; startWidth: number } | null>(null);
  const [dragLineX, setDragLineX] = useState<number | null>(null);

  const handleMouseDown = (e: React.MouseEvent, colIndex: number) => {
    e.preventDefault();
    setDragging({ col: colIndex, startX: e.clientX, startWidth: colWidths[colIndex] });

    // ✅ 用 .detailsArea 作为参考系，并考虑横向滚动
    const container = (e.currentTarget as HTMLElement).closest(`.${styles.detailsArea}`) as HTMLElement | null;
    if (container) {
      const rect = container.getBoundingClientRect();
      setDragLineX(e.clientX - rect.left + container.scrollLeft);
    } else {
      setDragLineX(e.clientX);
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging) return;
    // ✅ 不要再用 queryResultTable；统一用 .detailsArea
    const container = document.querySelector(`.${styles.detailsArea}`) as HTMLElement | null;
    if (container) {
      const rect = container.getBoundingClientRect();
      setDragLineX(e.clientX - rect.left + container.scrollLeft);
    }
  };

  // 导出统计（第一个表：summary）
  const handleExportSummary = () => {
    if (!summary?.length) {
      alert("当前没有可导出的统计数据～");
      return;
    }

    const columns: XlsxColumn<typeof summary[number]>[] = [
      { title: "业务员", key: "salesAgent" },
      { title: "起始日期", key: "startDate" },
      { title: "终止日期", key: "endDate" },
      { title: "商业保单数", key: "commercialPolicyCount" },
      { title: "交强保单数", key: "compulsoryPolicyCount" },
      { title: "商业保费", key: "commercialPremium" },
      { title: "商业提成", key: "commercialCommission" },
      { title: "交强保费", key: "compulsoryPremium" },
      { title: "交强提成", key: "compulsoryCommission" },
      { title: "应收保费", key: "receivablePremium" },
      { title: "已收保费", key: "receivedPremium" },
      { title: "提成金额", key: "commissionAmount" },
      { title: "实际提成", key: "actualCommission" },
    ];

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");

    exportXlsx(summary, columns, {
      filename: `工资结算_统计_${yyyy}-${mm}-${dd}`,
      // 如果需要统一数值保留两位小数，可打开：
      // formatter: v => (typeof v === "number" ? Number(v.toFixed(2)) : v),
    });
  };

  // 导出详细（第二个表：details，导出当下“可见”的 filteredDetails）
  const handleExportDetails = () => {
    const rows = filteredDetails; // 注意：导出“当前筛选后”的明细
    if (!rows?.length) {
      alert("当前没有可导出的明细数据～");
      return;
    }

    const columns: XlsxColumn<typeof rows[number]>[] = [
      { title: "业务员", key: "salesAgent" },
      { title: "商业保单号", key: "commercialPolicyNumber" },
      { title: "车牌号码", key: "licensePlate" },
      { title: "被保险人", key: "insuredName" },
      { title: "签单日期", key: "signingDate"},
      { title: "保险公司", key: "insuranceCompany" },
      { title: "商业保费", key: "commercialPremium" },
      { title: "商业提成", key: "commercialCommission" },
      { title: "交强保费", key: "compulsoryPremium" },
      { title: "交强提成", key: "compulsoryCommission" },
      { title: "应收保费", key: "receivablePremium" },
      { title: "已收保费", key: "receivedPremium" },
      { title: "提成金额", key: "commissionAmount" },
      { title: "实际提成", key: "actualCommission" },
      { title: "支付状态", key: "payStatus" },
    ];

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");

    exportXlsx(rows, columns, {
      filename: `工资结算_明细_${yyyy}-${mm}-${dd}`,
      // 同上，可选的全局格式化：
      // formatter: v => (typeof v === "number" ? Number(v.toFixed(2)) : v),
    });
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (!dragging) return;
    const delta = e.clientX - dragging.startX;
    setColWidths(prev => {
      const next = [...prev];
      next[dragging.col] = Math.max(56, dragging.startWidth + delta); // 最小 56px ≈ 4 个字
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

  // 明细表数据过滤
  const filteredDetails = activeHierarchy
    ? details.filter(row => row.hierarchyCode === activeHierarchy)
    : details;

  const [query, setQuery] = useState({
    salesAgent: "",
    startDate: "",
    endDate: "",
    paidStatus: "",
    settleStatus: "",
  });
  const [loading, setLoading] = useState(false);

  const fetchData = async (params = {}) => {
    setLoading(true);
    try {
      const res = await getCommissionData(params);
      setSummary(res.summary || []);
      setDetails(res.details || []);
    } finally {
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   fetchData();
  // }, []);

  const handleSearch = () => {
    // 必填校验
    if (!query.startDate || !query.endDate) {
      alert("请填写签单起和签单止日期！");
      return;
    }
    let salesAgent = "";
    let hierarchyCode = "";

    if (isSuperAdmin) {
      // 超级管理员
      // 检查输入是否匹配某个 userList 成员
      const exactUser = userList.find(u => u.displayName === agentInput);
      if (agentInput && !selectedAgent && !exactUser) {
        alert("请选择下拉列表中的业务员，或输入完整姓名后查询！");
        return;
      }
      if (selectedAgent) {
        salesAgent = selectedAgent.displayName;
        hierarchyCode = selectedAgent.hierarchyCode;
      } else if (exactUser) {
        salesAgent = exactUser.displayName;
        hierarchyCode = exactUser.hierarchyCode;
      } else if (agentInput === "") {
        // 查全部
        salesAgent = "";
        hierarchyCode = "";
      }
    } else {
      // 普通用户
      salesAgent = currentUserName;
      hierarchyCode = currentHierarchyCode;
    }

    // 其他字段
    const params = {
      ...query,
      salesAgent,
      hierarchyCode,
    };

    fetchData(params);
  };


  const handleClear = () => {
    // 清空所有查询输入
    setQuery({
      salesAgent: "",
      startDate: "",
      endDate: "",
      paidStatus: "",
      settleStatus: ""
      // ...其他查询字段
    });
    setAgentInput("");
    setSelectedAgent(null);
    setActiveHierarchy("");
    // 清空已加载的数据
    setSummary([]); // 汇总数据
    setDetails([]); // 明细数据
    // 其他相关状态也可一并清空
  };

  const handleConfirmPay = async (detailsToPay: CommissionDetail[]) => {
    if (!detailsToPay.length) {
      alert("没有需要支付的数据！");
      return;
    }

    // 只处理未支付的
    const unpaid = detailsToPay.filter(row => row.payStatus !== "已支付");
    if (unpaid.length === 0) {
      alert("选择的数据均已支付");
      return;
    }

    // 构造后端需要的参数
    const payload = unpaid.map(row => ({
      id: row.id,
      intermediaryInvoiceNo: row.actualCommission,
    }));

    try {
      // 只接收三个字段
      const updatedRows = await batchPay(payload);

      // 只更新 payStatus 和 intermediaryInvoiceNo
      setDetails(prev =>
        prev.map(row => {
          const found = updatedRows.find(u => u.id === row.id);
          return found
            ? { ...row, payStatus: found.payStatus, intermediaryInvoiceNo: found.intermediaryInvoiceNo }
            : row;
        })
      );

      alert("支付成功！");
    } catch (e) {
      alert("支付失败，请重试");
    }
  };

  return (
    <div className={styles.root}>
      {/* 查询区域 */}
      <div className={styles.queryArea}>
        <Form as={Row} className="g-1">
          <Col xs="auto">
            {isSuperAdmin ? (
              <div style={{ position: "relative" }}>
                <Form.Control
                  size="sm"
                  style={{ width: 140 }}
                  placeholder="输入业务员姓名"
                  value={agentInput}
                  autoComplete="off"
                  onFocus={() => setAgentDropdown(!!agentInput)}
                  onChange={e => {
                    setAgentInput(e.target.value);
                    setSelectedAgent(null);
                    setAgentDropdown(!!e.target.value);
                  }}
                  onBlur={() => setTimeout(() => setAgentDropdown(false), 150)}
                />
                {agentDropdown && agentInput && (
                  <ul className={styles.agentDropdown}>
                    {userList
                      .filter(u => u.displayName.includes(agentInput))
                      .map(u => (
                        <li
                          key={u.hierarchyCode}
                          onMouseDown={() => {
                            setAgentInput(u.displayName);
                            setSelectedAgent({ displayName: u.displayName, hierarchyCode: u.hierarchyCode });
                            setAgentDropdown(false);
                          }}
                        >
                          {u.displayName}
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            ) : (
              <Form.Control
                size="sm"
                style={{ width: 140 }}
                value={currentUserName}
                disabled
                readOnly
              />
            )}
          </Col>
          <Col xs="auto">
            <Form.Control
              size="sm"
              style={{ width: 140 }}
              type="date"
              placeholder="签单起"
              value={query.startDate}
              onChange={e => setQuery(q => ({ ...q, startDate: e.target.value }))}
            />
          </Col>
          <Col xs="auto">
            <Form.Control
              size="sm"
              style={{ width: 140 }}
              type="date"
              placeholder="签单止"
              value={query.endDate}
              onChange={e => setQuery(q => ({ ...q, endDate: e.target.value }))}
            />
          </Col>
          <Col xs="auto">
            <Form.Select
              size="sm"
              style={{ width: 140 }}
              value={query.paidStatus}
              onChange={e => setQuery(q => ({ ...q, paidStatus: e.target.value }))}
            >
              <option value="">全部收款</option>
              <option value="0">未收款</option>
              <option value="1">已收款</option>
            </Form.Select>
          </Col>
          <Col xs="auto">
            <Form.Select
              size="sm"
              style={{ width: 140 }}
              value={query.settleStatus}
              onChange={e => setQuery(q => ({ ...q, settleStatus: e.target.value }))}
            >
              <option value="">全部结算</option>
              <option value="0">未结提成</option>
              <option value="1">已结提成</option>
            </Form.Select>
          </Col>
          <Col>
            <Button size="sm" variant="primary" className={styles.confirmPayBtn} onClick={handleSearch}>
              查询
            </Button>
            <Button size="sm" variant="secondary" className={styles.confirmPayBtn} onClick={handleClear}>
              清空
            </Button>
            {isSuperAdmin && (
              <Button
                size="sm"
                variant="danger"
                className={styles.confirmPayBtn}
                onClick={() => handleConfirmPay(filteredDetails)}
              >
                确认支付
              </Button>
            )}
            {isSuperAdmin && (
              <>
                <Button
                  size="sm"
                  variant="success"
                  className={styles.confirmPayBtn}
                  onClick={handleExportSummary}
                >
                  导出统计
                </Button>
                <Button
                  size="sm"
                  variant="outline-success"
                  className={styles.confirmPayBtn}
                  onClick={handleExportDetails}
                >
                  导出详细
                </Button>
              </>
            )}
          </Col>
        </Form>
      </div>

      {/* 内容主区，分区高度+滚动条 */}

      <div className={styles.contentWrap}>
        {/* 统计区 */}
        <div className={styles.summaryArea}>
          <Table
            size="sm"
            bordered
            hover
            className={styles.table}
            style={{ background: "#fff7f2", borderRadius: "10px 10px 0 0" }} // 浅橙背景
          >
            <thead>
              <tr>
                <th>业务员</th>
                <th>起始日期</th>
                <th>终止日期</th>
                <th>商业保单数</th>
                <th>交强保单数</th>
                <th>商业保费</th>
                <th>商业提成</th>
                <th>交强保费</th>
                <th>交强提成</th>
                <th>应收保费</th>
                <th>已收保费</th>
                <th>提成金额</th>
                <th>实际提成</th>
              </tr>
            </thead>
            <tbody>
              {summary.map(row => (
                <tr
                  key={row.hierarchyCode}
                  className={`${styles.summaryRow} ${activeHierarchy === row.hierarchyCode ? styles.summaryRowActive : ""
                    }`}
                  onClick={() =>
                    setActiveHierarchy(activeHierarchy === row.hierarchyCode ? "" : row.hierarchyCode)
                  }
                  style={{ cursor: "pointer" }}
                  title="点击筛选明细"
                >
                  <td>{row.salesAgent}</td>
                  <td>{row.startDate}</td>
                  <td>{row.endDate}</td>
                  <td>{row.commercialPolicyCount}</td>
                  <td>{row.compulsoryPolicyCount}</td>
                  <td>{row.commercialPremium}</td>
                  <td>{row.commercialCommission}</td>
                  <td>{row.compulsoryPremium}</td>
                  <td>{row.compulsoryCommission}</td>
                  <td>{row.receivablePremium}</td>
                  <td>{row.receivedPremium}</td>
                  <td>{row.commissionAmount}</td>
                  <td>{row.actualCommission}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        {/* 明细区 */}
        <div className={styles.detailsArea}>
          <Table
            size="sm"
            bordered
            hover
            className={styles.table}
            style={{ fontSize: "13px", background: "#fff", borderRadius: "0 0 10px 10px", tableLayout: "fixed" }}
          >
            {/* ★ 用 colgroup 让 15 列的宽度真正受控 */}
            <colgroup>
              {colWidths.map((w, i) => (
                <col key={i} style={{ width: w }} />
              ))}
            </colgroup>

            <thead>
              <tr>
                {[
                  "业务员", "商业保单号", "车牌号码", "被保险人", "签单日期", "保险公司",
                  "商业保费", "商业点位", "交强保费", "交强点位",
                  "应收保费", "已收保费", "提成金额", "实际提成", "支付"
                ].map((title, idx) => (
                  <th key={idx}>
                    <div className={styles.thInner}>
                      <span>{title}</span>
                      <span
                        className={styles.colResizeHandle}
                        onMouseDown={(e) => handleMouseDown(e, idx)}
                        title="拖动调整列宽"
                      />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredDetails.length > 0 ? (
                filteredDetails.map(row => (
                  <tr key={row.id}>
                    <td><span className={styles.cellText}>{row.salesAgent}</span></td>
                    <td><span className={styles.cellText}>{row.commercialPolicyNumber}</span></td>
                    <td><span className={styles.cellText}>{row.licensePlate}</span></td>
                    <td><span className={styles.cellText}>{row.insuredName}</span></td>
                    <td><span className={styles.cellText}>{row.signingDate}</span></td>
                    <td><span className={styles.cellText}>{row.insuranceCompany}</span></td>
                    <td>{row.commercialPremium}</td>
                    <td>{row.commercialCommissionPercent}</td>
                    <td>{row.compulsoryPremium}</td>
                    <td>{row.compulsoryCommissionPercent}</td>
                    <td>{row.receivablePremium}</td>
                    <td>{row.receivedPremium}</td>
                    <td>{row.commissionAmount}</td>
                    <td>{row.actualCommission}</td>
                    <td>
                      {row.payStatus === "已支付" ? (
                        "已支付"
                      ) : (
                        isSuperAdmin && (
                          <Button
                            size="sm"
                            variant="info"
                            style={{ padding: "0px 6px", fontSize: "13px" }}
                            onClick={() => handleConfirmPay([row])}
                          >
                            待支付
                          </Button>
                        )
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={15} style={{ color: "#aaa", textAlign: "center" }}>
                    暂无明细数据
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          {/* 拖拽中的垂直参考线 */}
          {dragLineX !== null && <div className={styles.dragLine} style={{ left: dragLineX }} />}
        </div>

      </div>
    </div>
  );
};

export default WageSettlementPage;