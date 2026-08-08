import React, { useEffect, useState } from "react";
import { Table, Spin, message, DatePicker, Select, Button, Row, Col } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import styles from "./DepartmentStatsTable.module.css";
import { fetchDepartments, fetchSalesmanStats, Department, SalesmanStat } from "../api/DepartmentStatsTable";
import { toast } from "react-toastify";
import { exportXlsxFromMatrix } from "../utils/exportXlsx";

// 成员类型
interface Member {
  name: string;
  totalPolicyCount: number | string; // 新增字段
  commercialPremium: number | string;
  compulsoryPremium: number | string;
  commercialCount: number | string;
  compulsoryCount: number | string;
}

// 部门带成员
interface DepartmentWithMembers {
  deptCode: string;
  deptName: string;
  members: Member[];
}

const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
const role = userInfo?.role || "normal";
const isSuperAdmin = role === "superAdmin";

const OTHERS_DEPT_CODE = "OTHER";
const OTHERS_DEPT_NAME = "其他";
const UNRANKED_DEPT_CODE = "0000";
const UNRANKED_DEPARTMENT: Department = {
  deptCode: UNRANKED_DEPT_CODE,
  deptName: "不排名",
};

const getDepartmentTitle = (dept: Pick<DepartmentWithMembers, "deptCode" | "deptName">) =>
  dept.deptCode === OTHERS_DEPT_CODE || dept.deptCode === UNRANKED_DEPT_CODE
    ? dept.deptName
    : `${dept.deptCode}-${dept.deptName}`;

const DepartmentStatsTable: React.FC = () => {
  // 部门表头
  const [departments, setDepartments] = useState<Department[]>([]);
  // 统计归类后用于表格渲染的数据
  const [departmentData, setDepartmentData] = useState<DepartmentWithMembers[]>([]);
  // 总保费统计
  const [totalCommercialPremium, setTotalCommercialPremium] = useState<string>("0.00");
  const [totalCompulsoryPremium, setTotalCompulsoryPremium] = useState<string>("0.00");
  // 加载状态
  const [loading, setLoading] = useState(false);

  const toNum = (v: any) => (v === null || v === undefined || v === "" ? 0 : Number(v) || 0);
  const toCent = (v: any) => Math.round(toNum(v) * 100);   // 四舍五入到分
  const fromCent = (c: number) => (c / 100).toFixed(2);    // 输出两位小数字符串
  const sumCents = (...vals: any[]) => vals.reduce((s, x) => s + toCent(x), 0);

  // 展示层金额：与表格展示保持一致（两位小数，规避尾差）
  const showMoney = (v: any) => {
    if (v === "" || v === null || v === undefined) return "";
    return fromCent(toCent(v)); // 用“分”为单位 -> 两位小数字符串
  };

  const handleExportXlsx = async () => {
    if (!departmentData.length) { message.warning("请先计算再导出～"); return; }

    const subHeaders = ["姓名", "商业保费", "交强保费", "商单", "交单"];

    // 1) 头两行
    const headerRow1: string[] = [], headerRow2: string[] = [];
    departmentData.forEach(dept => {
      const title = getDepartmentTitle(dept);
      headerRow1.push(title, "", "", "", "");
      headerRow2.push(...subHeaders);
    });

    // 2) 合计行
    const totalRow: string[] = [];
    departmentData.forEach(dept => {
      const members = dept.members.filter(m => m.name);
      const t = getDeptTotal(members);
      const nameWithCount = (t.name && t.totalPolicyCount !== "" && t.totalPolicyCount != null)
        ? `${t.name}（${t.totalPolicyCount}）` : "";
      totalRow.push(
        nameWithCount,
        String(t.commercialPremium ?? ""),
        String(t.compulsoryPremium ?? ""),
        String(t.commercialCount ?? ""),
        String(t.compulsoryCount ?? "")
      );
    });

    // 3) 成员行
    const rows: string[][] = [];
    const max = Math.max(...departmentData.map(d => d.members.length), 0);
    for (let i = 0; i < max; i++) {
      const r: string[] = [];
      departmentData.forEach(dept => {
        const m = dept.members[i] || ({} as any);
        const nameWithCount = (m?.name && m?.totalPolicyCount !== "" && m?.totalPolicyCount != null)
          ? `${m.name}（${m.totalPolicyCount}）` : (m?.name ?? "");
        r.push(
          nameWithCount ?? "",
          String(m?.commercialPremium ?? ""),
          String(m?.compulsoryPremium ?? ""),
          String(m?.commercialCount ?? ""),
          String(m?.compulsoryCount ?? "")
        );
      });
      rows.push(r);
    }

    const matrix = [headerRow1, headerRow2, totalRow, ...rows];

    // 4) 合并首行部门标题（每 5 列合并一次）
    const merges = departmentData.map((_, i) => {
      const sCol = i * 5, eCol = sCol + 4;
      return { s: { r: 0, c: sCol }, e: { r: 0, c: eCol } };
    });

    const d = new Date(); const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0"); const dd = String(d.getDate()).padStart(2, "0");
    await exportXlsxFromMatrix(matrix, {
      filename: `部门统计_${yyyy}-${mm}-${dd}.xlsx`,
      sheetName: "部门统计",
      merges
    });
  };

  // 获取上一个 21 号
  const getLast21st = () => {
    const today = dayjs();
    // 如果今天 >= 21 号，就取本月 21
    if (today.date() >= 21) {
      return today.date(21);
    }
    // 否则取上个月 21
    return today.subtract(1, "month").date(21);
  };

  // 查询条件
  const [dateFrom, setDateFrom] = useState<Dayjs>(getLast21st());
  const [dateTo, setDateTo] = useState<Dayjs>(dayjs());
  const [paidStatus, setPaidStatus] = useState<"ALL" | "PAID" | "UNPAID">("ALL");

  // 页面加载只请求部门表头
  useEffect(() => {
    fetchDepartments()
      .then(setDepartments)
      .catch(() => message.error("部门加载失败"));
  }, []);

  // 计算按钮处理
  async function handleCalculate() {
    if (!dateFrom || !dateTo) {
      toast.error("请选择完整的起始日期和结束日期！");
      return;
    }
    try {
      const stats = await fetchSalesmanStats({
        dateFrom: dateFrom ? dateFrom.format("YYYY-MM-DD") : undefined,
        dateTo: dateTo ? dateTo.format("YYYY-MM-DD") : undefined,
        paidStatus
      });

      // “不排名”是部门统计专用的虚拟部门，固定显示在最左侧。
      const displayDepartments = [
        UNRANKED_DEPARTMENT,
        ...departments.filter(dept => dept.deptCode !== UNRANKED_DEPARTMENT.deptCode),
      ];

      // 部门归类，顺序以表头为准
      const depts: DepartmentWithMembers[] = displayDepartments.map(dept => ({
        deptCode: dept.deptCode,
        deptName: dept.deptName,
        members: stats
          .filter(stat => stat.deptCode === dept.deptCode)
          .map(stat => ({
            name: stat.salesmanName,
            totalPolicyCount: stat.totalPolicyCount,
            commercialPremium: stat.commercialPremium,
            compulsoryPremium: stat.compulsoryPremium,
            commercialCount: stat.commercialCount,
            compulsoryCount: stat.compulsoryCount,
          }))
          /** ✅ 新增：部门内按总保费降序排序 **/
          .sort((a, b) => {
            const sumA =
              (Number(a.commercialPremium) || 0) + (Number(a.compulsoryPremium) || 0);
            const sumB =
              (Number(b.commercialPremium) || 0) + (Number(b.compulsoryPremium) || 0);
            return sumB - sumA;
          }),
      }));

      // 处理“其他”部门
      const others = stats.filter(stat => stat.deptCode === OTHERS_DEPT_CODE);
      if (others.length > 0) {
        depts.push({
          deptCode: OTHERS_DEPT_CODE,
          deptName: OTHERS_DEPT_NAME,
          members: others
            .map(stat => ({
              name: stat.salesmanName,
              totalPolicyCount: stat.totalPolicyCount,
              commercialPremium: stat.commercialPremium,
              compulsoryPremium: stat.compulsoryPremium,
              commercialCount: stat.commercialCount,
              compulsoryCount: stat.compulsoryCount,
            }))
            .sort((a, b) => {
              const sumA =
                (Number(a.commercialPremium) || 0) + (Number(a.compulsoryPremium) || 0);
              const sumB =
                (Number(b.commercialPremium) || 0) + (Number(b.compulsoryPremium) || 0);
              return sumB - sumA;
            }),
        });
      }
      setDepartmentData(depts);

      // 统计总保费（修复浮点误差：用分相加）
      let totalCommercialCents = 0;
      let totalCompulsoryCents = 0;
      stats.forEach(stat => {
        totalCommercialCents += toCent(stat.commercialPremium);
        totalCompulsoryCents += toCent(stat.compulsoryPremium);
      });
      // 直接存成已格式化的字符串，展示最稳妥
      setTotalCommercialPremium(fromCent(totalCommercialCents) as any);
      setTotalCompulsoryPremium(fromCent(totalCompulsoryCents) as any);
    } catch (e) {
      message.error("统计数据加载失败");
    }
    setLoading(false);
  }

  // 计算最大成员数
  const maxMembers = Math.max(...departmentData.map(d => d.members.length), 0);

  // 填补空行，保证所有部门members一样长
  const deptsPadded = departmentData.map(d => ({
    ...d,
    members: [
      ...d.members,
      ...Array(maxMembers - d.members.length).fill({
        name: "",
        commercialPremium: "",
        compulsoryPremium: "",
        commercialCount: "",
        compulsoryCount: "",
      }),
    ].slice(0, maxMembers),
  }));

  // 表格columns
  const columns = deptsPadded.flatMap((dept, idx) => {
    const bgClass = idx % 2 === 0 ? styles.deptBgA : styles.deptBgB;
    return [
      {
        title: (
          <div className={styles.deptTitleWrap}>
            <span>
              {getDepartmentTitle(dept)}
            </span>
            <div className={styles.deptBar}></div>
          </div>
        ),
        className: bgClass,
        onHeaderCell: () => ({ className: bgClass }),
        children: [
          { title: "姓名", dataIndex: `${dept.deptCode}_name`, key: `${dept.deptCode}_name`, align: "center", className: bgClass, onHeaderCell: () => ({ className: bgClass }) },
          { title: "商业保费", dataIndex: `${dept.deptCode}_commercialPremium`, key: `${dept.deptCode}_commercialPremium`, align: "right", className: bgClass, onHeaderCell: () => ({ className: bgClass }) },
          { title: "交强保费", dataIndex: `${dept.deptCode}_compulsoryPremium`, key: `${dept.deptCode}_compulsoryPremium`, align: "right", className: bgClass, onHeaderCell: () => ({ className: bgClass }) },
          { title: "商单", dataIndex: `${dept.deptCode}_commercialCount`, key: `${dept.deptCode}_commercialCount`, align: "right", className: bgClass, onHeaderCell: () => ({ className: bgClass }) },
          { title: "交单", dataIndex: `${dept.deptCode}_compulsoryCount`, key: `${dept.deptCode}_compulsoryCount`, align: "right", className: bgClass, onHeaderCell: () => ({ className: bgClass }) }
        ]
      }
    ];
  });

  // 合计行
  function getDeptTotal(members: Member[]): Member {
    // 只对金额类用“分”加总，数量照旧按整数加
    const commCents = members.reduce((s, m) => s + toCent(m.commercialPremium), 0);
    const compCents = members.reduce((s, m) => s + toCent(m.compulsoryPremium), 0);

    return {
      name: "合计",
      totalPolicyCount: members.reduce((s, m) => toNum(s) + toNum(m.totalPolicyCount), 0),
      commercialPremium: fromCent(commCents),   // ← 两位小数字符串
      compulsoryPremium: fromCent(compCents),   // ← 两位小数字符串
      commercialCount: members.reduce((s, m) => toNum(s) + toNum(m.commercialCount), 0),
      compulsoryCount: members.reduce((s, m) => toNum(s) + toNum(m.compulsoryCount), 0),
    };
  }

  // 生成 dataSource
  const dataSource: Record<string, string | number>[] = [];
  // 合计行
  const totalRow: Record<string, string | number> = {};
  deptsPadded.forEach(dept => {
    const t = getDeptTotal(dept.members.filter(m => m.name));
    totalRow[`${dept.deptCode}_name`] =
      t.name && t.totalPolicyCount !== undefined && t.totalPolicyCount !== ""
        ? `${t.name}（${t.totalPolicyCount}）`
        : "";
    totalRow[`${dept.deptCode}_commercialPremium`] = t.commercialPremium || "";
    totalRow[`${dept.deptCode}_compulsoryPremium`] = t.compulsoryPremium || "";
    totalRow[`${dept.deptCode}_commercialCount`] = t.commercialCount || "";
    totalRow[`${dept.deptCode}_compulsoryCount`] = t.compulsoryCount || "";
  });
  dataSource.push({ key: "total", ...totalRow });

  // 成员行
  for (let i = 0; i < maxMembers; i++) {
    const row: Record<string, string | number> = { key: `member_${i}` };
    deptsPadded.forEach(dept => {
      const mem = dept.members[i];
      row[`${dept.deptCode}_name`] =
        mem.name && mem.totalPolicyCount !== undefined && mem.totalPolicyCount !== ""
          ? `${mem.name}（${mem.totalPolicyCount}）`
          : "";
      row[`${dept.deptCode}_commercialPremium`] = mem.commercialPremium;
      row[`${dept.deptCode}_compulsoryPremium`] = mem.compulsoryPremium;
      row[`${dept.deptCode}_commercialCount`] = mem.commercialCount;
      row[`${dept.deptCode}_compulsoryCount`] = mem.compulsoryCount;
    });
    dataSource.push(row);
  }

  return (
    <div className={styles.container}>
      {/* 顶部筛选栏 */}
      <Row gutter={16} align="middle" style={{ marginBottom: 16, marginTop: 8 }}>
        <Col>
          起始日期：
          <DatePicker
            value={dateFrom}
            onChange={setDateFrom}
            allowClear
            placeholder="请选择起始日期"
            style={{ width: 130 }}
          />
        </Col>
        <Col>
          结束日期：
          <DatePicker
            value={dateTo}
            onChange={setDateTo}
            allowClear
            placeholder="请选择结束日期"
            style={{ width: 130 }}
          />
        </Col>
        <Col>
          收款状态：
          <Select
            value={paidStatus}
            onChange={v => setPaidStatus(v)}
            style={{ width: 100 }}
            options={[
              { label: "全部", value: "ALL" },
              { label: "已收款", value: "PAID" },
              { label: "未收款", value: "UNPAID" }
            ]}
          />
        </Col>
        <Col>
          <Button type="primary" onClick={handleCalculate} style={{ width: 60 }}>计算</Button>
        </Col>
        {isSuperAdmin && (
          <Col>
            <Button
              style={{ background: "#6f42c1", color: "#fff", borderColor: "#5b36a1", width: 60 }}
              onClick={handleExportXlsx}
            >
              导出
            </Button>
          </Col>
        )}
        <Col>
          <span className={styles.statsHighlight}>
            商业：{totalCommercialPremium}；交强：{totalCompulsoryPremium}
          </span>
        </Col>
      </Row>
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={dataSource}
          bordered
          pagination={false}
          scroll={{ x: "max-content" }}
          size="small"
          rowKey="key"
        />
      </Spin>
    </div>
  );
};

export default DepartmentStatsTable;
