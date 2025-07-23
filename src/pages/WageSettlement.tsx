import { getCommissionData, batchPay } from "../api/WageSettlement.ts";
import styles from "./WageSettlement.module.css";
import React, { useEffect, useState } from "react";
import { Button, Form, Table, Row, Col } from "react-bootstrap";
import { UserItem } from "../App";

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
  compulsoryPremium: number;
  compulsoryCommission: number;
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
  const isSuperAdmin = currentHierarchyCode === "0";

  const [agentInput, setAgentInput] = useState(""); // 输入框内容
  const [selectedAgent, setSelectedAgent] = useState<{ displayName: string; hierarchyCode: string } | null>(null); // 已选业务员
  const [agentDropdown, setAgentDropdown] = useState(false);


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
      intermediaryInvoiceNo: row.commissionAmount,
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
                            setSelectedAgent(u);
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
                style={{ width: 180 }}
                value={currentUserName}
                disabled
                readOnly
              />
            )}
          </Col>
          <Col xs="auto">
            <Form.Control
              size="sm"
              style={{ width: 180 }}
              type="date"
              placeholder="签单起"
              value={query.startDate}
              onChange={e => setQuery(q => ({ ...q, startDate: e.target.value }))}
            />
          </Col>
          <Col xs="auto">
            <Form.Control
              size="sm"
              style={{ width: 180 }}
              type="date"
              placeholder="签单止"
              value={query.endDate}
              onChange={e => setQuery(q => ({ ...q, endDate: e.target.value }))}
            />
          </Col>
          <Col xs="auto">
            <Form.Select
              size="sm"
              style={{ width: 180 }}
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
              style={{ width: 180 }}
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
            style={{ fontSize: "13px", background: "#fff", borderRadius: "0 0 10px 10px" }}
          >
            <thead>
              <tr>
                <th>业务员</th>
                <th>商业保单号</th>
                <th>车牌号码</th>
                <th>被保险人</th>
                <th>签单日期</th>
                <th>保险公司</th>
                <th>商业保费</th>
                <th>商业提成</th>
                <th>交强保费</th>
                <th>交强提成</th>
                <th>应收保费</th>
                <th>已收保费</th>
                <th>提成金额</th>
                <th>实际提成</th>
                <th>支付</th>
              </tr>
            </thead>
            <tbody>
              {filteredDetails.length > 0 ? (
                filteredDetails.map(row => (
                  <tr key={row.id}>
                    <td>{row.salesAgent}</td>
                    <td>{row.commercialPolicyNumber}</td>
                    <td>{row.licensePlate}</td>
                    <td>{row.insuredName}</td>
                    <td>{row.signingDate}</td>
                    <td>{row.insuranceCompany}</td>
                    <td>{row.commercialPremium}</td>
                    <td>{row.commercialCommission}</td>
                    <td>{row.compulsoryPremium}</td>
                    <td>{row.compulsoryCommission}</td>
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
                            style={{ padding: "0px 1px", fontSize: "13px" }}
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
        </div>
      </div>


    </div>
  );
};

export default WageSettlementPage;
