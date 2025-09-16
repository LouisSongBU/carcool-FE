// src/utils/insuranceFormUtils.tsx
import React, { useEffect, useMemo, useState } from "react";
import styles from "../pages/InsuranceDetails.module.css";
import dayjs from "dayjs";
import type { InsuranceDetail } from "../pages/InsuranceDetails"; 

/** ==========================
 * 工具：今天 yyyy-MM-dd
 * ========================== */
function getTodayDateStr() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** ==========================
 * 保险公司选择组件
 * ========================== */
interface InsuranceCompany {
  id: string;
  insuranceCompany: string;
  validStartDate?: string;
  validEndDate?: string;
}
interface InsuranceCompanySelectProps {
  companies: InsuranceCompany[];
  value: string;
  onChange: (val: string) => void;
}

export const InsuranceCompanySelect: React.FC<InsuranceCompanySelectProps> = ({
  companies,
  value,
  onChange,
}) => {
  const [input, setInput] = useState(value || "");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const today = getTodayDateStr();

  useEffect(() => {
    setInput(value || "");
  }, [value]);

  // 过滤当天有效的公司
  const validCompanies = companies.filter((c) => {
    const start = c.validStartDate?.slice(0, 10);
    const end = c.validEndDate?.slice(0, 10);
    return (!start || start <= today) && (!end || end >= today);
  });

  // 匹配输入
  const matched = validCompanies.filter(
    (c) => input && c.insuranceCompany && c.insuranceCompany.includes(input)
  );

  return (
    <div style={{ position: "relative", width: 220 }}>
      <input
        type="text"
        className={`${styles.editInput} form-control`}
        value={input}
        placeholder="请选择保险公司"
        autoComplete="off"
        onFocus={() => setDropdownOpen(true)}
        onChange={(e) => {
          setInput(e.target.value);
          onChange("");
          setDropdownOpen(!!e.target.value);
        }}
        onBlur={() => setTimeout(() => setDropdownOpen(false), 120)}
      />
      {dropdownOpen && (
        <ul className={`${styles.agentDropdown} dropdown-menu show`} style={{ width: "100%" }}>
          {matched.length === 0 ? (
            <li className="dropdown-item disabled">无匹配项</li>
          ) : (
            matched.map((c) => (
              <li
                key={c.id}
                className="dropdown-item"
                onMouseDown={() => {
                  setInput(c.insuranceCompany);
                  onChange(c.insuranceCompany);
                  setDropdownOpen(false);
                }}
              >
                {c.insuranceCompany}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

/** ==========================
 * 严格数字输入（只允许整数 / 最多 n 位小数）
 * ========================== */
export const StrictNumericInput: React.FC<{
  value: number | null | undefined;
  onChange: (num: number | null) => void;
  decimals?: number; // 默认 2
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  placeholder?: string;
}> = ({ value, onChange, decimals = 2, disabled, readOnly, className, placeholder }) => {
  const text = value === null || value === undefined ? "" : String(value);
  const re = useMemo(() => new RegExp(`^\\d*(?:\\.\\d{0,${decimals}})?$`), [decimals]);

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const v = e.target.value.trim();
    if (v === "" || re.test(v)) {
      onChange(v === "" ? null : Number(v));
    }
  };

  return (
    <input
      type="text"
      inputMode={decimals > 0 ? "decimal" : "numeric"}
      className={`${styles.editInput} form-control ${className ?? ""}`}
      value={text}
      onChange={handleChange}
      onKeyDown={(e) => {
        if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
      }}
      onPaste={(e) => {
        const toPaste = e.clipboardData.getData("text")?.trim() ?? "";
        if (!(toPaste === "" || re.test(toPaste))) e.preventDefault();
      }}
      disabled={disabled}
      readOnly={readOnly}
      placeholder={placeholder}
    />
  );
};

/** ==========================
 * 业务员选择（供超级管理员使用，带下拉 + 自动带出主管/层级码）
 * ========================== */
type SimpleUser = {
  id: string;
  displayName: string;
  manager?: { displayName?: string } | null;
  hierarchyCode?: string | number | null;
};

export const AgentSelectInput: React.FC<{
  value: string | undefined;
  userList: SimpleUser[];
  onPick: (u: SimpleUser | null, typed: string) => void;
}> = ({ value, userList, onPick }) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value ?? "");

  useEffect(() => setText(value ?? ""), [value]);

  const matched = useMemo(() => {
    const v = text.trim();
    if (!v) return [];
    return userList.filter((u) => u.displayName?.includes(v));
  }, [text, userList]);

  return (
    <div style={{ position: "relative", width: 220 }}>
      <input
        type="text"
        className={`${styles.editInput} form-control`}
        value={text}
        placeholder="请选择业务员"
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          const typed = e.target.value;
          setText(typed);
          onPick(null, typed); // 仅更新 salesAgent 文本
          setOpen(!!typed);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
      />
      {text && (
        <button
          type="button"
          className={styles.clearBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setText("");
            onPick(null, "");
          }}
          tabIndex={-1}
        >
          ×
        </button>
      )}
      {open && (
        <ul className={styles.agentDropdown} style={{ zIndex: 20 }}>
          {matched.length === 0 ? (
            <li className={styles.noMatch}>无匹配项</li>
          ) : (
            matched.map((a) => (
              <li
                key={a.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setText(a.displayName);
                  onPick(a, a.displayName);
                  setOpen(false);
                }}
              >
                {a.displayName}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

/** ==========================
 * 1) 计算应收保费
 * ========================== */
export function calcReceivablePremium(data: any): number {
  return (
    (Number(data.commercialPremium) || 0) +
    (Number(data.compulsoryPremium) || 0) +
    (Number(data.driverAccidentPremium) || 0) +
    (Number(data.vehicleTax) || 0)
  );
}

/** ==========================
 * 2) 初始化表单
 * ========================== */
export function initInsuranceForm(
  baseData: Partial<InsuranceDetail> | Record<string, any> = {},
  userInfo: any,
  isSuperAdmin: boolean,
  isAdmin?: boolean            // ← 新增
): InsuranceDetail {
  const today = getTodayDateStr();

  const form: InsuranceDetail = {
    // 基本信息 & 证件
    id: baseData.id ? String(baseData.id) : "不用填",
    applicantName: baseData.applicantName ?? "",
    applicantIdNumber: baseData.applicantIdNumber ?? "",

    insuredName: (baseData as any).customerName || baseData.insuredName || "",
    insuredIdNumber: baseData.insuredIdNumber ?? "",

    registrationOwner: baseData.registrationOwner ?? "",
    registrationOwnerId: baseData.registrationOwnerId ?? "",

    // 保单号（新增时不让填）
    commercialPolicyNumber: "不用填",
    compulsoryPolicyNumber: "不用填",

    // 车辆信息
    licensePlate: baseData.licensePlate ?? "",
    vehicleModel: baseData.vehicleModel ?? "",
    engineNumber: baseData.engineNumber ?? "",
    vinNumber: baseData.vinNumber ?? "",
    approvedSeats: baseData.approvedSeats ?? "",
    approvedLoad: baseData.approvedLoad ?? "",
    firstRegistrationDate: baseData.firstRegistrationDate ?? "",

    // 联系/地址
    phone: baseData.phone ?? "",
    mobile: baseData.mobile ?? "",
    deliveryAddress: baseData.deliveryAddress ?? "",

    // 日期
    policyStartDate: baseData.policyStartDate ?? "",
    signingDate: baseData.signingDate || dayjs().format("YYYY-MM-DD"),
    inputDate: baseData.inputDate ?? today,

    // 险种保额/保费
    vehicleDamageCoverage: (baseData as any).vehicleDamageCoverage ?? 0,
    vehicleDamagePremium: (baseData as any).vehicleDamagePremium ?? 0,
    thirdPartyCoverage: (baseData as any).thirdPartyCoverage ?? 0,
    thirdPartyPremium: (baseData as any).thirdPartyPremium ?? 0,
    outMedCoverage: (baseData as any).outMedCoverage ?? 0,
    outMedPremium: (baseData as any).outMedPremium ?? 0,
    driverCoverage: (baseData as any).driverCoverage ?? 0,
    driverPremium: (baseData as any).driverPremium ?? 0,
    passengerCoverage: (baseData as any).passengerCoverage ?? 0,
    passengerPremium: (baseData as any).passengerPremium ?? 0,

    // 汇总保费
    commercialPremium: baseData.commercialPremium ?? 0,
    compulsoryPremium: baseData.compulsoryPremium ?? 0,
    driverAccidentPremium: baseData.driverAccidentPremium ?? 0,
    vehicleTax: baseData.vehicleTax ?? 0,

    receivablePremium: 0,
    receivedPremium: baseData.receivedPremium ?? 0,

    // 开票/出单
    intermediaryInvoiceNo: baseData.intermediaryInvoiceNo ?? null,
    issuingOffice: baseData.issuingOffice ?? "",

    // 组织&人员
    salesAgent: baseData.salesAgent ?? ((isSuperAdmin || isAdmin) ? "" : (userInfo?.displayName ?? "")),
    salesManager: baseData.salesManager ?? (userInfo?.managerName ?? ""),
    hierarchyCode: baseData.hierarchyCode ?? (userInfo?.hierarchyCode ?? ""),

    // 保险公司
    insuranceCompany: baseData.insuranceCompany ?? "",

    // 财务类
    isSettlement: baseData.isSettlement ?? null,
    financeVerification: baseData.financeVerification ?? null,
    commercialAdjustment: baseData.commercialAdjustment ?? null,
    compulsoryAdjustment: baseData.compulsoryAdjustment ?? null,

    // 备注
    comment: baseData.comment ?? "",
  };

  form.receivablePremium = calcReceivablePremium(form);
  return form;
}

/** ==========================
 * 3) 通用渲染（支持超级管理员业务员下拉、严格数字、日期/时间文本域）
 * ========================== */
export function renderInsuranceInput(
  key: string,
  value: any,
  setForm: React.Dispatch<React.SetStateAction<any>>,
  isNormalUser: boolean,
  insuranceCompanies?: InsuranceCompany[],
  opts?: {
    isSuperAdmin?: boolean;
    isAdmin?: boolean;
    userList?: { id: string; displayName: string; manager?: any; hierarchyCode?: string | number }[];
  }
) {
  const isSuperAdmin = !!opts?.isSuperAdmin;
  const isAdmin = !!opts?.isAdmin;
  const userList = opts?.userList || [];

  // 保险公司
  if (key === "insuranceCompany") {
    return (
      <InsuranceCompanySelect
        companies={insuranceCompanies || []}
        value={value ?? ""}
        onChange={(val) =>
          setForm((prev) => (prev ? { ...prev, insuranceCompany: val } : prev))
        }
      />
    );
  }

  // 新增页：保单号默认只读展示（自动生成）
  if (key === "commercialPolicyNumber" || key === "compulsoryPolicyNumber") {
    return (
      <input
        type="text"
        className={`${styles.editInput} form-control`}
        value={value ?? ""}
        disabled
        readOnly
      />
    );
  }

  // 日期/时间
  if (key.endsWith("Date")) {
    return (
      <input
        type="date"
        className={`${styles.editInput} form-control`}
        value={value ? String(value).slice(0, 10) : ""}
        onChange={(e) =>
          setForm((prev) => (prev ? { ...prev, [key]: e.target.value } : prev))
        }
      />
    );
  }
  if (key.endsWith("Time")) {
    return (
      <input
        type="datetime-local"
        className={`${styles.editInput} form-control`}
        step="1"
        value={value ?? ""}
        onChange={(e) =>
          setForm((prev) => (prev ? { ...prev, [key]: e.target.value } : prev))
        }
      />
    );
  }

  // 保费联动（四个字段）
  if (["commercialPremium", "compulsoryPremium", "driverAccidentPremium", "vehicleTax"].includes(key)) {
    return (
      <StrictNumericInput
        value={value ?? null}
        onChange={(num) =>
          setForm((prev: any) => {
            if (!prev) return prev;
            const next = { ...prev, [key]: num ?? 0 };
            next.receivablePremium = calcReceivablePremium(next);
            return next;
          })
        }
        decimals={2}
      />
    );
  }

  // 应收保费（只读）
  if (key === "receivablePremium") {
    return <StrictNumericInput value={value ?? 0} onChange={() => {}} readOnly disabled decimals={2} />;
  }

  // 业务员：超级管理员可搜选，普通用户只读
  if (key === "salesAgent") {
    if (isSuperAdmin || isAdmin) {
      return (
        <AgentSelectInput
          value={value ?? ""}
          userList={userList}
          onPick={(u, typed) =>
            setForm((prev: any) => {
              if (!prev) return prev;
              if (u) {
                return {
                  ...prev,
                  salesAgent: u.displayName,
                  salesManager: u.manager?.displayName ?? "",
                  hierarchyCode: u.hierarchyCode ? String(u.hierarchyCode) : "",
                };
              }
              // 仅输入，还没选择
              return { ...prev, salesAgent: typed, salesManager: "", hierarchyCode: "" };
            })
          }
        />
      );
    }
    // 非超管：只读显示当前用户（或后端已给的值）
    return (
      <input
        type="text"
        className={`${styles.editInput} form-control`}
        value={value ?? ""}
        disabled
        readOnly
      />
    );
  }

  // 层级码 / 主管：只读
  if (key === "hierarchyCode" || key === "salesManager") {
    return (
      <input
        type="text"
        className={`${styles.editInput} form-control`}
        value={value ?? ""}
        disabled
        readOnly
      />
    );
  }

  // 备注：多行
  if (key === "comment") {
    return (
      <textarea
        className={`${styles.editInput} form-control`}
        rows={3}
        value={value ?? ""}
        placeholder="请输入备注"
        onChange={(e) =>
          setForm((prev) => (prev ? { ...prev, comment: e.target.value } : prev))
        }
      />
    );
  }

  // 其他数字类（保额/保费等），统一严格数字输入（默认两位小数）
  const numericKeys = new Set<string>([
    "receivedPremium",
    "vehicleDamageCoverage", "vehicleDamagePremium",
    "thirdPartyCoverage", "thirdPartyPremium",
    "outMedCoverage", "outMedPremium",
    "driverCoverage", "driverPremium",
    "passengerCoverage", "passengerPremium",
    // 如果“中介票号”是纯数字，则打开下一行：
    // "intermediaryInvoiceNo",
  ]);
  if (numericKeys.has(key)) {
    return (
      <StrictNumericInput
        value={value ?? null}
        onChange={(num) => setForm((prev: any) => (prev ? { ...prev, [key]: num } : prev))}
        decimals={2}
      />
    );
  }

  // 默认文本
  return (
    <input
      type="text"
      className={`${styles.editInput} form-control`}
      value={value ?? ""}
      onChange={(e) =>
        setForm((prev) => (prev ? { ...prev, [key]: e.target.value } : prev))
      }
    />
  );
}
