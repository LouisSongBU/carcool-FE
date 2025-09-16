import React, { useState } from "react";
import styles from "./InsuranceDetails.module.css";
import { insuranceDetailsNameMap, insuranceDetailFieldTypeMap } from "../utils/fieldUtils";
import { useEffect } from "react";
import {
  addInsuranceDetail, fetchInsuranceDetails, updateInsuranceDetail, confirmIssueInsuranceDetail, fetchInsuranceHistory, uploadInsuranceImage,
  fetchInsuranceImages, deleteInsuranceImage, updateInsuranceImageRemark, uploadIdCardImage, fetchIdCardImage, fetchInsuranceChangeLogs
  , saveInsuranceChangeLogs, updateInsuranceComment
} from "../api/insuranceDetails.ts";
import { getTodayDate, getNowDateTime, formatDateTime, formatDate } from '../utils/dateUtils';
import { InsuranceCompanySelect } from "../utils/InsuranceCompanySelect.tsx";
import { initInsuranceForm } from "../utils/insuranceFormUtils";


type InsuranceDetailsProps = {
  insuranceCompanies: any[];
  userList: any[];
};

type InsuranceImage = {
  id: string;
  url: string;
  remark: string;
};

export interface InsuranceDetail {
  id: string;
  applicantName: string | null;
  commercialPolicyNumber: string;
  applicantIdNumber: string | null;
  compulsoryPolicyNumber: string | null;
  insuredName: string;
  signingDate: string | null;
  insuredIdNumber: string;
  vehicleDamageCoverage: number | null;
  registrationOwner: string | null;
  vehicleDamagePremium: number | null;
  registrationOwnerId: string | null;
  thirdPartyCoverage: number | null;
  licensePlate: string;
  thirdPartyPremium: number | null;
  vehicleModel: string | null;
  outMedCoverage: number | null;
  firstRegistrationDate: string | null;
  outMedPremium: number | null;
  engineNumber: string;
  driverCoverage: number | null;
  vinNumber: string | null;
  driverPremium: number | null;
  approvedSeats: string | null;
  passengerCoverage: number | null;
  approvedLoad: string | null;
  passengerPremium: number | null;
  deliveryAddress: string | null;
  commercialPremium: number;
  phone: string | null;
  compulsoryPremium: number;
  mobile: string | null;
  driverAccidentPremium: number;
  salesAgent: string | null;
  vehicleTax: number;
  salesManager: string | null;
  receivablePremium: number;
  inputDate: string | null;
  receivedPremium: number;
  intermediaryInvoiceNo: number | null;
  policyStartDate: string | null;
  hierarchyCode: string | null;
  insuranceCompany: string | null;
  issuingOffice: string | null;
  isSettlement: string | null;
  financeVerification: string | null;
  commercialAdjustment: number | null;
  compulsoryAdjustment: number | null;
  comment: string | null;
}

const detailFieldOrder: string[][] = [
  ["id", "applicantName"],
  ["commercialPolicyNumber", "applicantIdNumber"],
  ["compulsoryPolicyNumber", "insuredName"],
  ["signingDate", "insuredIdNumber"],
  ["vehicleDamageCoverage", "registrationOwner"],
  ["vehicleDamagePremium", "registrationOwnerId"],
  ["thirdPartyCoverage", "licensePlate"],
  ["thirdPartyPremium", "vehicleModel"],
  ["outMedCoverage", "firstRegistrationDate"],
  ["outMedPremium", "engineNumber"],
  ["driverCoverage", "vinNumber"],
  ["driverPremium", "approvedSeats"],
  ["passengerCoverage", "approvedLoad"],
  ["passengerPremium", "deliveryAddress"],
  ["commercialPremium", "phone"],
  ["compulsoryPremium", "mobile"],
  ["driverAccidentPremium", "salesAgent"],
  ["vehicleTax", "salesManager"],
  ["receivablePremium", "inputDate"],
  ["receivedPremium", "intermediaryInvoiceNo"],
  ["policyStartDate", "hierarchyCode"],
  ["insuranceCompany", "issuingOffice"],
  ["comment"],
  ["isSettlement", "financeVerification"],
  ["commercialAdjustment", "compulsoryAdjustment"]
];



const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
const role = userInfo.role || "normal";
const isSuperAdmin = role === "superAdmin";
const isAdmin = role === "admin";
const isNormalUser = role === "normal";
const currentUserName = userInfo.displayName || "";
const canEditPolicyNumber = isSuperAdmin || isAdmin;

// === 1. 常量配置区 ===
const dateFields = new Set([
  "signingDate",
  "firstRegistrationDate",
  "inputDate",
  "policyStartDate"
]);

// 要隐藏的字段
const hiddenFieldsForUser = [
  "isSettlement",
  "financeVerification",
  "commercialAdjustment",
  "compulsoryAdjustment",
];

// === 2. 组件主体 ===
const InsuranceDetails: React.FC<InsuranceDetailsProps> = ({ insuranceCompanies, userList }) => {

  // === 3. useState区（变量声明顺序） ===
  // 查询/筛选相关
  const [query, setQuery] = useState({
    insuredName: "",        // 被保险人
    licensePlate: "",       // 车牌号
    signingDateStart: getTodayDateStr(),   // 签单日期-起
    signingDateEnd: getTodayDateStr(),     // 签单日期-止
    policyStartDateStart: "", // 起保日期-起
    policyStartDateEnd: "",   // 起保日期-止
    commercialPolicyNumber: "",       // 保单号
    mobileOrPhone: "",        //电话或手机号
    salesAgent: ""          // 业务员
  });

  const [filterField, setFilterField] = useState("");
  const [filterOperator, setFilterOperator] = useState("like");
  const [filterValue, setFilterValue] = useState("");

  const [filters, setFilters] = useState<{ [key: string]: boolean }>({
    issued: false,
    notIssued: false,
    received: false,
    notReceived: false,
  });

  const [highlightedFilters, setHighlightedFilters] = useState({
    issued: false,
    received: false,
  });

  const [insuranceList, setInsuranceList] = useState<InsuranceDetail[]>([]);
  const [myList, setMyList] = useState<InsuranceDetail[]>([]);
  const [searchResult, setSearchResult] = useState<InsuranceDetail[]>([]);

  // 详情、编辑相关
  const [selectedDetail, setSelectedDetail] = useState<InsuranceDetail | null>(null);
  const [showList, setShowList] = useState(false);
  const [loading, setLoading] = useState(false);

  // 编辑、新增相关
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<InsuranceDetail | null>(null);
  const [editType, setEditType] = useState<"add" | "edit">("edit");
  const [showPrintModal, setShowPrintModal] = useState(false);

  // 其它
  const fieldOptions = Object.entries(insuranceDetailsNameMap).map(([key, label]) => ({
    value: key,
    label
  }));

  // state 新增
  const [agentInput, setAgentInput] = useState(""); // 输入框内容
  const [agentDropdown, setAgentDropdown] = useState(false); // 是否展示下拉
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null); // 最终选中业务员名

  // 匹配 userList
  const filteredAgents = userList.filter(
    u => agentInput && u.displayName && u.displayName.includes(agentInput)
  );

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirming, setConfirming] = useState(false); // 加载状态

  // 备注弹窗和内容
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentEditValue, setCommentEditValue] = useState("");

  // 查询时，只允许选中下拉项
  const canSearch =
    (!agentInput && !selectedAgent) || // 没填=不筛选
    (!!agentInput && filteredAgents.some(a => a.displayName === agentInput));

  const canConfirmIssue =
    !!selectedDetail &&
    selectedDetail.commercialPolicyNumber &&
    selectedDetail.commercialPolicyNumber.startsWith("L");

  //历史投保
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [insuranceHistory, setInsuranceHistory] = useState<any[]>([]);

  //图片相关
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [insuranceImages, setInsuranceImages] = useState<InsuranceImage[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [editingRemarkId, setEditingRemarkId] = useState<string | null>(null);
  const [remarkDraft, setRemarkDraft] = useState("");

  // 新增身份证图片的状态
  const [idCardImages, setIdCardImages] = useState<{ faceUrl?: string, backUrl?: string }>({});
  const [idCardUploading, setIdCardUploading] = useState<{ face: boolean, back: boolean }>({ face: false, back: false });

  const [showLogModal, setShowLogModal] = useState(false);
  const [logRecords, setLogRecords] = useState<any[]>([]);
  const [logLoading, setLogLoading] = useState(false);

  //表单生成
  const omitKeys = ["id", "commercialPolicyNumber", "compulsoryPolicyNumber"];

  useEffect(() => {
    if (isNormalUser) {
      setAgentInput(currentUserName);
      setSelectedAgent(currentUserName);
    }
  }, [isNormalUser, currentUserName]);

  function calcReceivablePremium(data: Partial<InsuranceDetail>): number {
    return (
      (Number(data.commercialPremium) || 0) +
      (Number(data.compulsoryPremium) || 0) +
      (Number(data.driverAccidentPremium) || 0) +
      (Number(data.vehicleTax) || 0)
    );
  }

  const normalizeEditData = (data: any) => {
    return {
      ...data,
      commercialPolicyNumber:
        data.commercialPolicyNumber === "" ? null : data.commercialPolicyNumber,
      compulsoryPolicyNumber:
        data.compulsoryPolicyNumber === "" ? null : data.compulsoryPolicyNumber,
    };
  };


  const renderInput = (key: string, value: any) => {
    if (
      (key === "commercialPolicyNumber" || key === "compulsoryPolicyNumber") &&
      editType === "edit"
    ) {
      return (
        <div className={styles.policyNumberRow}>
          <input
            type="text"
            className={styles.policyNumberInput + " " + styles.editInput + " form-control"}
            value={value ?? ""}
            disabled={!canEditPolicyNumber}
            readOnly={!canEditPolicyNumber}
            onChange={e => {
              if (canEditPolicyNumber) {
                setEditData(prev => prev ? { ...prev, [key]: e.target.value } : prev);
              }
            }}
          />
          {canEditPolicyNumber && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() =>
                setEditData(prev => prev ? { ...prev, [key]: null } : prev)
              }
              tabIndex={-1}
            >
              清空
            </button>
          )}
        </div>

      );
    }
    if (omitKeys.includes(key)) {
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
    if (key === "salesAgent") {
      if (isSuperAdmin) {
        return (
          <div style={{ position: "relative", width: "220px" }}>
            <input
              type="text"
              className={styles.editInput + " form-control"}
              value={value ?? ""}
              placeholder="请选择业务员"
              autoComplete="off"
              onFocus={e => setAgentDropdown(true)}
              onChange={e => {
                const inputVal = e.target.value;
                const selected = userList.find(u => u.displayName === inputVal);
                setEditData(prev => prev
                  ? {
                    ...prev,
                    salesAgent: inputVal,
                    salesManager: selected && selected.manager ? selected.manager.displayName : "",
                    hierarchyCode: selected && selected.hierarchyCode ? String(selected.hierarchyCode) : ""
                  }
                  : prev
                );
                setAgentDropdown(!!inputVal);
              }}
              onBlur={() => setTimeout(() => setAgentDropdown(false), 120)}
            />
            {/* 清除按钮 */}
            {value && (
              <button
                type="button"
                style={{
                  position: "absolute", right: -10, top: -9, zIndex: 2, border: "none", background: "none"
                }}
                onClick={() => {
                  setEditData(prev => prev ? { ...prev, salesAgent: "", salesManager: "" } : prev);
                }}
                tabIndex={-1}
              >×</button>
            )}
            {/* 下拉选 */}
            {agentDropdown && (
              <ul className={styles.agentDropdown} style={{ zIndex: 10 }}>
                {
                  userList.filter(u => value && u.displayName.includes(value)).length === 0
                    ? <li className={styles.noMatch}>无匹配项</li>
                    : userList.filter(u => value && u.displayName.includes(value)).map(a =>
                      <li
                        key={a.id}
                        onMouseDown={e => {
                          e.preventDefault();
                          setEditData(prev => prev
                            ? {
                              ...prev,
                              salesAgent: a.displayName,
                              salesManager: a.manager ? a.manager.displayName : "",
                              hierarchyCode: a.hierarchyCode ? String(a.hierarchyCode) : ""
                            }
                            : prev
                          );
                          setAgentDropdown(false);
                        }}
                      >{a.displayName}</li>
                    )
                }
              </ul>
            )}
          </div>
        );
      }
      return (
        <input
          type="text"
          className={styles.editInput + " form-control"}
          value={value ?? ""}
          disabled
          readOnly
        />
      );

    }

    // 特殊：主管是只读
    if (key === "salesManager") {
      return (
        <input
          type="text"
          className={styles.editInput + " form-control"}
          value={value ?? ""}
          readOnly
          disabled
          placeholder="自动带出"
        />
      );
    }

    if (key === "comment") {
      return (
        <textarea
          className={`${styles.editInput} form-control`}
          value={value ?? ""}
          rows={3}
          placeholder="请输入备注"
          onChange={e => {
            const val = e.target.value;
            setEditData(prev => prev ? { ...prev, comment: val } : prev);
          }}
        />
      );
    }

    if (key === "hierarchyCode") {
      return (
        <input
          type="text"
          className={styles.editInput + " form-control"}
          value={value ?? ""}
          readOnly
          disabled
          placeholder="自动带出"
        />
      );
    }

    if (key === "insuranceCompany") {
      return (
        <InsuranceCompanySelect
          companies={insuranceCompanies}
          value={editData?.insuranceCompany || ""}
          onChange={(val) =>
            setEditData(prev => prev ? { ...prev, insuranceCompany: val } : prev)
          }
        />
      );
    }    

    // 1. 中介票号
    if (key === "intermediaryInvoiceNo") {
      const isFieldEditable = isSuperAdmin;
      return (
        <input
          type="number"
          className={`${styles.editInput} form-control`}
          value={value ?? ""}
          onChange={e => {
            if (isFieldEditable) {
              // 如果为空，设为 null，否则转 number
              const newVal = e.target.value === "" ? null : Number(e.target.value);
              setEditData(prev => prev ? { ...prev, [key]: newVal } : prev);
            }
          }}
          disabled={!isFieldEditable}
          readOnly={!isFieldEditable}
        />
      );
    }

    // 2. 出单处
    if (key === "issuingOffice") {
      const isFieldEditable = isSuperAdmin || isAdmin;
      return (
        <input
          type="text"
          className={`${styles.editInput} form-control`}
          value={value ?? ""}
          onChange={e =>
            isFieldEditable &&
            setEditData(prev => prev ? { ...prev, [key]: e.target.value } : prev)
          }
          disabled={!isFieldEditable}
          readOnly={!isFieldEditable}
        />
      );
    }

    if (key === "inputDate" || key === "signingDate") {
      // 超管可编辑，其它人不可编辑
      const isFieldEditable = isSuperAdmin || (isAdmin && key === "signingDate");
      return (
        <input
          type="date"
          className={`${styles.editInput} form-control`}
          value={value ? String(value).slice(0, 10) : ""}
          onChange={e =>
            isFieldEditable &&
            setEditData(prev => prev ? { ...prev, [key]: e.target.value } : prev)
          }
          disabled={!isFieldEditable}
          readOnly={!isFieldEditable}
        />
      );
    }

    // 日期字段
    if (key.endsWith("Date")) {
      return (
        <input
          type="date"
          className={`${styles.editInput} form-control`}
          value={value ? String(value).slice(0, 10) : ""}
          onChange={e =>
            setEditData(prev => prev ? { ...prev, [key]: e.target.value } : prev)
          }
        />
      );
    }
    // 时间字段
    if (key.endsWith("Time")) {
      return (
        <input
          type="datetime-local"
          className={`${styles.editInput} form-control`}
          step="1"
          value={value ?? ""}
          onChange={e =>
            setEditData(prev => prev ? { ...prev, [key]: e.target.value } : prev)
          }
        />
      );
    }

    if (key === "receivablePremium") {
      // 实现：只读显示
      return (
        <input
          type="number"
          className={`${styles.editInput} form-control`}
          value={value ?? ""}
          disabled
          readOnly
        />
      );
    }

    if (["commercialPremium", "compulsoryPremium", "driverAccidentPremium", "vehicleTax"].includes(key)) {
      return (
        <input
          type="number"
          className={`${styles.editInput} form-control`}
          value={value ?? ""}
          onChange={e => {
            const numVal = Number(e.target.value) || 0;
            setEditData(prev => {
              if (!prev) return prev;
              // 更新当前字段
              const newData = { ...prev, [key]: numVal };
              // 重新计算应收保费
              newData.receivablePremium = calcReceivablePremium(newData);
              return newData;
            });
          }}
        />
      );
    }

    // 数字字段（自动支持""为0的情况）
    if (insuranceDetailFieldTypeMap[key] === "number") {
      if (key === "receivedPremium") {
        return (
          <input
            type="number"
            className={`${styles.editInput} form-control`}
            value={value ?? ""}
            disabled={!isSuperAdmin}
            readOnly={!isSuperAdmin}
            onChange={e => {
              if (isSuperAdmin) {
                setEditData(prev => prev ? { ...prev, [key]: Number(e.target.value) } : prev);
              }
            }}
          />
        );
      } else {
        return (
          <input
            type="number"
            className={`${styles.editInput} form-control`}
            value={value ?? ""}
            onChange={e =>
              setEditData(prev => prev ? { ...prev, [key]: Number(e.target.value) } : prev)
            }
          />
        );
      }
    }
    // 普通文本字段
    return (
      <input
        type="text"
        className={`${styles.editInput} form-control`}
        value={value ?? ""}
        onChange={e =>
          setEditData(prev => prev ? { ...prev, [key]: e.target.value } : prev)
        }
      />
    );
  };

  // === 4. 业务逻辑区（派生变量/条件函数等） ===
  // 是否日期字段
  const isDateField = dateFields.has(filterField);

  const filterConditions = {
    notIssued: (item: any) =>
      item.commercialPolicyNumber.startsWith("QL"),
    issued: (item: any) =>
      !(item.commercialPolicyNumber.startsWith("QL") || item.commercialPolicyNumber.startsWith("L")),
    received: (item: any) => (item.receivedPremium ?? 0) > 0,
    notReceived: (item: any) => (item.receivedPremium ?? 0) == 0,
  };

  // 判断是否能编辑
  const canEdit = isSuperAdmin || isAdmin ||
    (isNormalUser && selectedDetail && typeof selectedDetail.commercialPolicyNumber === "string" &&
      selectedDetail.commercialPolicyNumber.startsWith("L"));

  // 获取新增数据模板,新增时不带id/商业号/交强号/所有number字段清空
  const getDefaultNewData = () => {
    console.log("当前层级码：", userInfo.hierarchyCode, typeof userInfo.hierarchyCode);
    if (!selectedDetail) return null;
    const omitKeys = ["id", "commercialPolicyNumber", "compulsoryPolicyNumber"];
    const newData: any = {};

    Object.entries(selectedDetail).forEach(([key, value]) => {
      if (omitKeys.includes(key)) {
        newData[key] = ""; // 显示但不填内容
        return;
      }
      if (key === "inputDate" || key === "signingDate") {
        // 普通用户 inputDate/signingDate 都要自动赋值
        // 管理员 signingDate 需要自动赋值，inputDate 不能填
        // 超管随便保留原值
        if (!isSuperAdmin && (!isAdmin || key === "inputDate")) {
          const now = new Date();
          const yyyy = now.getFullYear();
          const mm = String(now.getMonth() + 1).padStart(2, '0');
          const dd = String(now.getDate()).padStart(2, '0');
          newData[key] = `${yyyy}-${mm}-${dd}`;
          return;
        }
      }
      // 中介票号
      if (key === "intermediaryInvoiceNo") {
        newData[key] = "0";
        return;
      }

      // 出单处
      if (key === "issuingOffice" || key === "isSettlement" || key === "financeVerification") {
        newData[key] = "";
        return;
      }
      if (typeof value === "number") {
        newData[key] = 0;
      } else if (key === "inputDate") {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        newData[key] = `${yyyy}-${mm}-${dd}`; // 得到"2024-07-01"这种格式
      } else {
        newData[key] = value;
      }
    });
    if (!isSuperAdmin) {
      newData.salesAgent = currentUserName;
    }
    newData.hierarchyCode = String(hierarchyCode);  // 自动赋当前登录用户的层级码
    return newData;
  };

  // === 5. 事件处理函数区 ===
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setQuery({ ...query, [e.target.name]: e.target.value });
  };

  const handleSearch = async () => {
    const {
      insuredName,
      licensePlate,
      signingDateStart,
      signingDateEnd,
      policyStartDateStart,
      policyStartDateEnd,
      commercialPolicyNumber,
      mobileOrPhone,
      // salesAgent: 不要从query里拿！
    } = query;

    // 用 selectedAgent，没选只能查其他字段
    const salesAgent = isNormalUser
  ? currentUserName
  : selectedAgent || undefined;

    // 限制：如果业务员输入了但没选下拉，则禁止查询
    if (
      !insuredName &&
      !licensePlate &&
      !signingDateStart &&
      !signingDateEnd &&
      !policyStartDateStart &&
      !policyStartDateEnd &&
      !commercialPolicyNumber &&
      !mobileOrPhone &&
      !salesAgent
    ) {
      alert("请至少填写一个查询条件！");
      return;
    }

    // 如果业务员输入有值，但是没有选中下拉，直接禁止
    if (agentInput && !selectedAgent) {
      alert("请选择下拉列表中的业务员！");
      return;
    }

    setLoading(true);
    setShowList(false);

    try {
      // 只传选中的业务员，其它字段照常
      const params: any = {
        insuredName,
        licensePlate,
        signingDateStart,
        signingDateEnd,
        policyStartDateStart,
        policyStartDateEnd,
        commercialPolicyNumber,
        mobileOrPhone
      };
      
      // 普通用户：强制加自己
      if (isNormalUser) {
        params.salesAgent = currentUserName;
      }
      
      // 管理员/超管：只有选了才加
      if (!isNormalUser && selectedAgent) {
        params.salesAgent = selectedAgent;
      }
      
      const res = await fetchInsuranceDetails(params);

      setSearchResult(res.data);
      setMyList(res.data);
    } catch (e: any) {
      alert("查询失败: " + (e?.message || e));
      setSearchResult([]);
      setMyList([]);
    } finally {
      setLoading(false);
      setShowList(true);
    }
  };

  const handleCustomFilter = () => {
    if (!filterField || !filterOperator || filterValue === "") return;

    const isDateField = dateFields.has(filterField);

    const filtered = searchResult.filter((item) => {
      const rawVal = item[filterField as keyof InsuranceDetail];
      if (rawVal === undefined || rawVal === null) return false;

      let val: string | number;
      let userInput: string | number = filterValue;

      if (isDateField) {
        // 只用字符串处理
        val = String(rawVal).slice(0, 10);
        userInput = String(filterValue).slice(0, 10);
      } else if (typeof rawVal === "number") {
        val = rawVal;
        userInput = Number(filterValue);
      } else {
        val = String(rawVal);
      }

      if (filterOperator === "=") return val === userInput;
      if (filterOperator === ">") return val > userInput;
      if (filterOperator === "<") return val < userInput;
      if (filterOperator === "like") return String(val).includes(String(userInput));
      if (filterOperator === "not like") return !String(val).includes(String(userInput));

      return false;
    });

    setMyList(filtered);
  };


  const handleFilterChange = (filterName: keyof typeof filters) => {
    setFilters((prevFilters) => {
      const updatedFilters = {
        ...prevFilters,
        [filterName]: !prevFilters[filterName],
      };

      const noFiltersApplied = Object.values(updatedFilters).every(
        (value) => value === false
      );

      if (noFiltersApplied) {
        setMyList(searchResult);
        setHighlightedFilters({ issued: false, received: false });
        return updatedFilters;
      }

      const filteredList = searchResult.filter((item) =>
        Object.keys(updatedFilters)
          .filter((key) => updatedFilters[key as keyof typeof updatedFilters])
          .every((key) =>
            filterConditions[key as keyof typeof filterConditions](item)
          )
      );

      setMyList(filteredList);

      setHighlightedFilters({
        issued: filteredList.some(
          (item) => !item.commercialPolicyNumber.startsWith("QL")
        ),
        received: filteredList.some(
          (item) => item.receivedPremium > 0
        ),
      });

      return updatedFilters;
    });
  };

  // === 编辑保存 ===
  const handleEditSave = async () => {
    if (!editData) return;
    const dataToSave = normalizeEditData(editData);

    // 1. 校验商业保费必须有保单号
    if ((editData.commercialPremium != null && Number(editData.commercialPremium) !== 0)
      && (!editData.commercialPolicyNumber || editData.commercialPolicyNumber === "")) {
      alert("商业保费不为0时，商业保单号不能为空！");
      return;
    }

    // 2. 校验交强保费必须有交强保单号
    if ((editData.compulsoryPremium != null && Number(editData.compulsoryPremium) !== 0)
      && (!editData.compulsoryPolicyNumber || editData.compulsoryPolicyNumber === "")) {
      alert("交强保费不为0时，交强保单号不能为空！");
      return;
    }
    if (
      (editData.commercialPolicyNumber && (editData.commercialPolicyNumber.startsWith("QL") || editData.commercialPolicyNumber.startsWith("L"))) ||
      (editData.compulsoryPolicyNumber && (editData.compulsoryPolicyNumber.startsWith("QL") || editData.compulsoryPolicyNumber.startsWith("L")))
    ) {
      alert("商业保单号和交强保单号都不能以QL或L开头！");
      return;
    }
    if (!editData.commercialPolicyNumber && !editData.compulsoryPolicyNumber) {
      alert("商业保单号和交强保单号不能同时为空！");
      return;
    }
    // 校验保险公司
    const validCompanies = insuranceCompanies.map(c => c.insuranceCompany);
    if (!editData.insuranceCompany || !validCompanies.includes(editData.insuranceCompany)) {
      alert("请选择下拉列表中的保险公司！");
      return;
    }
    try {
      const updateRes = await updateInsuranceDetail(editData);
      const updated = updateRes.data; // 假设后端返回最新对象

      // 1. 列表移除旧项，把最新的插到第一位
      setMyList(list => [
        updated,
        ...list.filter(item => item.id !== updated.id)
      ]);
      setSearchResult(list => [
        updated,
        ...list.filter(item => item.id !== updated.id)
      ]);
      setIsEditing(false);
      setSelectedDetail(updated); // 2. 右侧详情直接显示

      alert("保存成功！");

      const logFields = [
        "commercialPolicyNumber", "commercialPremium", "compulsoryPremium",
        "receivedPremium", "isSettlement", "financeVerification",
        "commercialAdjustment", "compulsoryAdjustment"
      ];

      const oldData = selectedDetail;
      const newData = editData;


      const logs: any[] = [];

      const oldPolicy = (oldData as any)?.commercialPolicyNumber || "";
      const newPolicy = (newData as any)?.commercialPolicyNumber || "";

      // 1. 新增（原来没有保单号，现在有）
      const isNew = !oldPolicy && !!newPolicy;

      // 2. L 变 QL
      const isLtoQL = oldPolicy.startsWith("L") && newPolicy.startsWith("QL");

      // 3. 当前是L，且不是L变QL
      const isPureL = newPolicy.startsWith("L") && !isLtoQL;

      // 记录 commercialPolicyNumber 的变动
      const isPolicyNumberChanged = (oldPolicy !== newPolicy);

      // 情况1、新增
      if (isNew && isPolicyNumberChanged) {
        logs.push({
          detailId: oldData?.id,
          fieldName: "商业保单号",
          oldValue: oldPolicy,
          newValue: newPolicy,
          updateUser: currentUserName,
          updateTime: getNowDateTime(),
        });
      }
      // 情况2，L变QL
      else if (isLtoQL && isPolicyNumberChanged) {
        logs.push({
          detailId: oldData?.id,
          fieldName: "商业保单号",
          oldValue: oldPolicy,
          newValue: newPolicy,
          updateUser: currentUserName,
          updateTime: getNowDateTime(),
        });
      }
      // 情况3，当前L且不是L变QL，不记录任何日志
      else if (isPureL) {
        // 什么都不做
      }
      // 情况4，其他情况，对8字段分别做变动对比
      else {
        logFields.forEach(field => {
          if (field === "commercialPolicyNumber") return; // 只比较其他7个字段
          const oldValue = (oldData as any)?.[field];
          const newValue = (newData as any)[field];
          if (oldValue !== newValue) {
            logs.push({
              detailId: oldData?.id,
              fieldName: insuranceDetailsNameMap[field] || field,
              oldValue: oldValue ?? "",
              newValue: newValue ?? "",
              updateUser: currentUserName,
              updateTime: getNowDateTime(),
            });
          }
        });
      }


      if (logs.length > 0) {
        await saveInsuranceChangeLogs(logs);
      }

    } catch (e: any) {
      alert("保存失败: " + (e?.message || e));
    }
  };


  const handleCreateSave = async () => {
    if (!editData) return;
    // 校验保险公司
    const validCompanies = insuranceCompanies.map(c => c.insuranceCompany);
    if (!editData.insuranceCompany || !validCompanies.includes(editData.insuranceCompany)) {
      alert("请选择下拉列表中的保险公司！");
      return;
    }
    try {
      // 拷贝一份数据，然后清除这三个字段
      const submitData = { insurancedetails: { ...editData }, username: userInfo.username || "" } as any;
      if (!isSuperAdmin) {
        submitData.insurancedetails.salesAgent = currentUserName;
      }
      delete submitData.insurancedetails.id;
      delete submitData.insurancedetails.commercialPolicyNumber;
      delete submitData.insurancedetails.compulsoryPolicyNumber;
      const addRes = await addInsuranceDetail(submitData);
      const newRecord = addRes.data; // 后端返回最新对象（带id等）

      setMyList(list => [newRecord, ...list]);
      setSearchResult(list => [newRecord, ...list]);
      setIsEditing(false);
      setSelectedDetail(newRecord); // 新增的直接右侧展示

      alert("新增成功！");

      const log = {
        detailId: newRecord.id,
        fieldName: "商业保单号",
        oldValue: "",
        newValue: newRecord.commercialPolicyNumber,
        updateUser: currentUserName,
        updateTime: getNowDateTime()
      };
      await saveInsuranceChangeLogs([log]);
    } catch (e: any) {
      alert("新增失败: " + (e?.message || e));
    }
  };

  function getTodayDateStr() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  const handleConfirmIssue = async (detail: InsuranceDetail) => {
    const updated = await confirmIssueInsuranceDetail(detail);
    if (updated.commercialPolicyNumber !== detail.commercialPolicyNumber) {
      const log = {
        detailId: detail.id,
        fieldName: "商业保单号",
        oldValue: detail.commercialPolicyNumber,
        newValue: updated.commercialPolicyNumber,
        updateUser: currentUserName,
        updateTime: getNowDateTime()
      };
      await saveInsuranceChangeLogs([log]);
    }
    setMyList(list => list.map(item =>
      item.id === updated.id ? updated : item
    ));
    setSearchResult(list => list.map(item =>
      item.id === updated.id ? updated : item
    ));
    setSelectedDetail(updated);
  };


  const handleRenewQuery = async () => {
    if (!selectedDetail) return;
    try {
      const res = await fetchInsuranceHistory({
        licensePlate: selectedDetail.licensePlate,
        engineNumber: selectedDetail.engineNumber
      });
      setInsuranceHistory(res.data || []);
      setHistoryModalVisible(true);
    } catch (err: any) {
      alert("查询失败: " + (err.message || "未知错误"));
    }
  };

  const handleImage = async () => {
    if (!selectedDetail) return;
    setImageModalVisible(true);
    try {
      // 拉身份证图片
      const data = await fetchIdCardImage(selectedDetail.insuredIdNumber);
      setIdCardImages({ faceUrl: data.faceUrl, backUrl: data.backUrl }); // ★★必须加上这句★★

      const res = await fetchInsuranceImages(selectedDetail.id);
      setInsuranceImages(res.data || []);
    } catch {
      setInsuranceImages([]);
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedDetail) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const MAX_SIZE_MB = 20;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`文件不能超过 ${MAX_SIZE_MB}MB`);
      return false;
    }
    setImageUploading(true);
    await uploadInsuranceImage({ detailId: selectedDetail.id, file });
    const imgRes = await fetchInsuranceImages(selectedDetail.id);
    setInsuranceImages(imgRes.data || []);
    setImageUploading(false);
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!window.confirm("确定删除该图片？")) return;
    await deleteInsuranceImage(imageId);
    const imgRes = await fetchInsuranceImages(selectedDetail!.id);
    setInsuranceImages(imgRes.data || []);
  };
  const handleEditRemark = (image: InsuranceImage) => {
    setEditingRemarkId(image.id);
    setRemarkDraft(image.remark || "");
  };
  const handleSaveRemark = async (image: InsuranceImage) => {
    await updateInsuranceImageRemark(image.id, remarkDraft);
    setEditingRemarkId(null);
    // 刷新图片
    const imgRes = await fetchInsuranceImages(selectedDetail!.id);
    setInsuranceImages(imgRes.data || []);
  };

  const handleUploadIdCardImage = async (file: File, type: "face" | "back") => {
    if (!selectedDetail) return;
    setIdCardUploading(up => ({ ...up, [type]: true }));
    await uploadIdCardImage(file, selectedDetail.insuredIdNumber, type);
    await refreshIdCardImage();
    setIdCardUploading(up => ({ ...up, [type]: false }));
  };

  const refreshIdCardImage = async () => {
    if (!selectedDetail) return;
    const data = await fetchIdCardImage(selectedDetail.insuredIdNumber);
    setIdCardImages({ faceUrl: data.faceUrl, backUrl: data.backUrl });
  };

  const handleShowLogModal = async () => {
    if (!selectedDetail) return;
    setShowLogModal(true);
    setLogLoading(true);
    try {
      const logs = await fetchInsuranceChangeLogs(selectedDetail.id);
      setLogRecords(logs || []);
    } catch {
      setLogRecords([]);
    }
    setLogLoading(false);
  };

  // === 6. 渲染相关函数 ===
  // === 新增/编辑按钮组 ===
  const renderButtonGroup = () => (
    <div className={styles.btnGroup}>
      {/* 新增 */}
      <button
        className={`${styles.btn} ${styles.btnPrimary}`}
        disabled={!selectedDetail}
        onClick={() => {
          if (!selectedDetail) return;
          const newData = getDefaultNewData();
          newData.receivablePremium = calcReceivablePremium(newData); // 这里加上自动算
          setEditData(newData);
          setEditType("add");
          setIsEditing(true);
        }}
        type="button"
      >新增</button>

      {/* 编辑 */}
      <button
        className={styles.btn}
        disabled={!selectedDetail || !canEdit}
        onClick={() => {
          if (!selectedDetail || !canEdit) return;
          const newData = { ...selectedDetail };
          newData.receivablePremium = calcReceivablePremium(newData); // 这里加上自动算
          setEditData(newData);
          setEditType("edit");
          setIsEditing(true);
        }}

        type="button"
      >编辑</button>
      <button
        className={styles.btn}
        disabled={!canConfirmIssue}
        onClick={() => setShowConfirmModal(true)}
        type="button"
      >
        确认出单
      </button>
      {/* 续保查询 */}
      <button className={styles.btn} type="button" onClick={handleRenewQuery}>续保查询</button>
      {/* 打印 */}
      <button
        className={styles.btn}
        type="button"
        onClick={() => setShowPrintModal(true)}
      >
        打印
      </button>
      {/* 图片 */}
      <button
        className={styles.btn}
        type="button"
        onClick={handleImage}
        disabled={!!selectedDetail?.commercialPolicyNumber?.startsWith("L")}
        style={
          selectedDetail?.commercialPolicyNumber?.startsWith("L")
            ? { background: "#bbb", color: "#fff", cursor: "not-allowed", border: "1px solid #ccc" }
            : {}
        }
      >
        图片
      </button>
      {isSuperAdmin && (
        <button
          className={styles.btn}
          type="button"
          style={{ background: "#323c68", color: "#fff", marginLeft: 8 }}
          onClick={handleShowLogModal}
        >
          日志
        </button>
      )}
    </div>
  );

  return (
    <div className="container mt-0" style={{ width: "100%", minWidth: "1200px" }}>
      <div className="row">
        {/* 左侧 查询与列表 */}
        <div className="col-md-4">
          <div className={styles.queryFormCard}>
            {/* 查询表单 */}
            <div className={styles.queryForm}>
              <div className={styles.queryRow}>
                <label className={styles.queryLabel}>被保险人</label>
                <input
                  type="text"
                  name="insuredName"
                  value={query.insuredName}
                  onChange={handleInputChange}
                  className={`form-control form-control-sm ${styles.queryInput}`}
                  placeholder="请输入姓名"
                />
                <label className={styles.queryLabel}>车牌号码</label>
                <input
                  type="text"
                  name="licensePlate"
                  value={query.licensePlate}
                  onChange={handleInputChange}
                  className={`form-control form-control-sm ${styles.queryInput}`}
                  placeholder="请输入车牌号码"
                />
              </div>
              <div className={styles.queryRow}>
                <label className={styles.queryLabel}>签单日期</label>
                <input
                  type="date"
                  name="signingDateStart"
                  value={query.signingDateStart}
                  onChange={handleInputChange}
                  className={`form-control form-control-sm ${styles.queryInput}`}
                />
                <span className={styles.queryText}>至</span>
                <input
                  type="date"
                  name="signingDateEnd"
                  value={query.signingDateEnd}
                  onChange={handleInputChange}
                  className={`form-control form-control-sm ${styles.queryInput}`}
                />
              </div>
              <div className={styles.queryRow}>
                <label className={styles.queryLabel}>起保日期</label>
                <input
                  type="date"
                  name="policyStartDateStart"
                  value={query.policyStartDateStart}
                  onChange={handleInputChange}
                  className={`form-control form-control-sm ${styles.queryInput}`}
                />
                <span className={styles.queryText}>至</span>
                <input
                  type="date"
                  name="policyStartDateEnd"
                  value={query.policyStartDateEnd}
                  onChange={handleInputChange}
                  className={`form-control form-control-sm ${styles.queryInput}`}
                />
              </div>
              <div className={styles.queryRow}>
                <label className={styles.queryLabel}>保单号码</label>
                <input
                  type="text"
                  name="commercialPolicyNumber"
                  value={query.commercialPolicyNumber}
                  onChange={handleInputChange}
                  className={`form-control form-control-sm ${styles.queryInput}`}
                  placeholder="请输入保单号码"
                />
              </div>
              <div className={styles.queryRow}>
                <label className={styles.queryLabel}>手机(电话)号</label>
                <input
                  type="text"
                  name="mobileOrPhone"
                  value={query.mobileOrPhone || ""}
                  onChange={handleInputChange}
                  className={`form-control form-control-sm ${styles.queryInput}`}
                  placeholder="请输入手机（电话）号"
                />
              </div>
              <div className={styles.queryRow}>
                <label className={styles.queryLabel}>业务员</label>
                <div className={styles.inputWrap}>
                  <input
                    type="text"
                    className={`form-control form-control-sm ${styles.queryInputAgent}`}
                    value={isNormalUser ? currentUserName : agentInput}
                    placeholder="请输入业务员姓名"
                    disabled={isNormalUser} // 普通业务员不可改
                    autoComplete="off"
                    onFocus={() => !isNormalUser && agentInput && setAgentDropdown(true)}
                    onChange={e => {
                      if (!isNormalUser) {
                        setAgentInput(e.target.value);
                        setSelectedAgent(null);
                        setAgentDropdown(!!e.target.value);
                      }
                    }}
                    onClick={() => {
                      if (!isNormalUser) {
                        setAgentInput("");
                        setSelectedAgent(null);
                      }
                    }}
                    onBlur={() => setTimeout(() => setAgentDropdown(false), 120)}
                  />
                  {/* 清除按钮：只有管理员/超管才显示 */}
                  {!isNormalUser && agentInput && (
                    <button
                      type="button"
                      className={styles.clearBtn}
                      onClick={() => {
                        setAgentInput("");
                        setSelectedAgent(null);
                      }}
                      tabIndex={-1}
                      aria-label="清除"
                    >
                      ×
                    </button>
                  )}
                  {agentDropdown && (
                    <ul className={styles.agentDropdown}>
                      {filteredAgents.length === 0 ? (
                        <li className={styles.noMatch}>无匹配项</li>
                      ) : (
                        filteredAgents.map(a => (
                          <li
                            key={a.id}
                            onMouseDown={() => {
                              setAgentInput(a.displayName);
                              setSelectedAgent(a.displayName);
                              setAgentDropdown(false);
                            }}
                          >
                            {a.displayName}
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  style={{
                    minWidth: "50px",
                    paddingLeft: "0px",
                    paddingRight: "0px",
                    fontSize: "15px",
                    letterSpacing: "2px",
                  }}
                  type="button"
                  onClick={handleSearch}
                  disabled={!!agentInput && !selectedAgent}
                >查询</button>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{
                    minWidth: "50px",
                    paddingLeft: "0px",
                    paddingRight: "0px",
                    fontSize: "15px",
                    letterSpacing: "2px",
                  }}
                  type="button"
                  onClick={() => {
                    setQuery({
                      insuredName: "",
                      licensePlate: "",
                      signingDateStart: "",
                      signingDateEnd: "",
                      policyStartDateStart: "",
                      policyStartDateEnd: "",
                      commercialPolicyNumber: "",
                      mobileOrPhone: "",
                      salesAgent: ""
                    });
                    setAgentInput(""); // 管理员/超管清空业务员输入
                    setSelectedAgent(null);
                    // 普通用户特殊处理
                    if (isNormalUser) {
                      setQuery(q => ({ ...q, salesAgent: currentUserName }));
                    }
                  }}
                >
                  清除
                </button>
              </div>

            </div>
          </div>

          {/* 自定义筛选 */}
          <div className={`card-body ${styles.filterBox}`}>
            {/* 第一行：字段和逻辑 */}
            <div className={styles.filterRow}>
              <select
                className={`form-select form-select-sm ${styles.filterSelect}`}
                value={filterField}
                onChange={e => setFilterField(e.target.value)}
              >
                <option value="">选择字段</option>
                {fieldOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                className={`form-select form-select-sm ${styles.filterOperator}`}
                value={isDateField ? "=" : filterOperator}
                onChange={e => setFilterOperator(e.target.value)}
                disabled={isDateField}
              >
                <option value="=">=</option>
                {!isDateField && (
                  <>
                    <option value=">">&gt;</option>
                    <option value="<">&lt;</option>
                    <option value="like">like</option>
                    <option value="not like">not like</option>
                  </>
                )}
              </select>
            </div>
            {/* 第二行：条件和按钮 */}
            <div className={styles.filterRow}>
              {isDateField ? (
                <input
                  type="date"
                  className={`form-control form-control-sm ${styles.filterInput}`}
                  value={filterValue}
                  onChange={e => setFilterValue(e.target.value)}
                />
              ) : (
                <input
                  type="text"
                  className={`form-control form-control-sm ${styles.filterInput}`}
                  value={filterValue}
                  onChange={e => setFilterValue(e.target.value)}
                  placeholder="请输入条件"
                />
              )}
              <button className={`btn btn-sm btn-outline-primary ${styles.filterBtn}`} onClick={handleCustomFilter}>筛选</button>
              <button
                className={`btn btn-sm btn-outline-secondary ${styles.filterBtn}`}
                onClick={() => {
                  setFilterField("");
                  setFilterOperator("=");
                  setFilterValue("");
                  setMyList(searchResult);
                }}
              >清除</button>
            </div>
          </div>

          {/* 查询结果列表 */}
          {showList && (
            loading ? (
              <div style={{ padding: "32px 0", textAlign: "center", color: "#888" }}>
                <span className="spinner-border spinner-border-sm me-2"></span>
                正在查询，请稍候...
              </div>
            ) : myList.length === 0 ? (
              <div style={{ padding: "28px 0", textAlign: "center", color: "#bbb" }}>
                暂无查询结果
              </div>
            ) : (
              <div style={{ maxHeight: 350, overflowY: "auto" }}>
                <table className={styles.queryResultTable}>
                  <thead>
                    <tr>
                      <th className={styles.idxCol}>#</th>
                      <th className={styles.nameCol}>被保险人</th>
                      <th className={styles.idCardCol}>身份证号码</th>
                      <th className={styles.plateCol}>车牌号</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myList.map((item, idx) => (
                      <tr
                        key={item.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          setSelectedDetail(item);
                          setIsEditing(false);
                          setEditData(null);
                        }}
                        className={selectedDetail?.id === item.id ? styles.selectedRow : ""}
                      >
                        <td className={styles.idxCol}>{idx + 1}</td>
                        <td className={styles.nameCol}>{item.insuredName}</td>
                        <td className={styles.idCardCol} title={item.insuredIdNumber}>
                          {item.insuredIdNumber}
                        </td>
                        <td className={styles.plateCol}>{item.licensePlate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>

        {/* 右侧 详情、按钮组、弹窗 */}
        <div className="col-md-8">
          <div className="container">
            <div className="row">
              <div className={styles.filterStatusGroup}>
                {/* 未出单 */}
                <label className={styles.statusItem}>
                  <input
                    type="checkbox"
                    className={`form-check-input ${selectedDetail && filterConditions.notIssued(selectedDetail) ? styles.highlightYellow : ""}`}
                    checked={filters.notIssued}
                    onChange={() => handleFilterChange("notIssued")}
                    readOnly
                  />
                  <span className={selectedDetail && filterConditions.notIssued(selectedDetail) ? styles.labelYellow : ""}>
                    未出单
                  </span>
                </label>
                {/* 已出单 */}
                <label className={styles.statusItem}>
                  <input
                    type="checkbox"
                    className={`form-check-input ${selectedDetail && filterConditions.issued(selectedDetail) ? styles.highlightGreen : ""}`}
                    checked={filters.issued}
                    onChange={() => handleFilterChange("issued")}
                    readOnly
                  />
                  <span className={selectedDetail && filterConditions.issued(selectedDetail) ? styles.labelGreen : ""}>
                    已出单
                  </span>
                </label>
                {/* 未收款 */}
                <label className={styles.statusItem}>
                  <input
                    type="checkbox"
                    className={`form-check-input ${selectedDetail && filterConditions.notReceived(selectedDetail) ? styles.highlightYellow : ""}`}
                    checked={filters.notReceived}
                    onChange={() => handleFilterChange("notReceived")}
                    readOnly
                  />
                  <span className={selectedDetail && filterConditions.notReceived(selectedDetail) ? styles.labelYellow : ""}>
                    未收款
                  </span>
                </label>
                {/* 已收款 */}
                <label className={styles.statusItem}>
                  <input
                    type="checkbox"
                    className={`form-check-input ${selectedDetail && filterConditions.received(selectedDetail) ? styles.highlightGreen : ""}`}
                    checked={filters.received}
                    onChange={() => handleFilterChange("received")}
                    readOnly
                  />
                  <span className={selectedDetail && filterConditions.received(selectedDetail) ? styles.labelGreen : ""}>
                    已收款
                  </span>
                </label>
              </div>

              {/* 详细表格 */}
              {selectedDetail && (
                <div>
                  {/** 1. 在这里先过滤字段： */}
                  {(() => {
                    return (
                      <table className={`table table-bordered table-hover ${styles.customTable}`}>
                        <tbody>
                          {detailFieldOrder.map((pair, rowIdx) => {
                            const [key1, key2] = pair;
                            if (
                              (!isSuperAdmin && hiddenFieldsForUser.includes(key1)) ||
                              (!isSuperAdmin && key2 && hiddenFieldsForUser.includes(key2))
                            ) {
                              return null;
                            }
                            return (
                              <tr key={key1}>
                                <th>{insuranceDetailsNameMap[key1] || key1}</th>
                                {key2 ? (
                                  <>
                                    <td>
                                      {typeof selectedDetail?.[key1 as keyof InsuranceDetail] === "string"
                                        && (selectedDetail?.[key1 as keyof InsuranceDetail] as string).match(/^\d{4}-\d{2}-\d{2}/)
                                        ? (selectedDetail?.[key1 as keyof InsuranceDetail] as string).slice(0, 10)
                                        : String(selectedDetail?.[key1 as keyof InsuranceDetail] ?? "")}
                                    </td>
                                    <th>{insuranceDetailsNameMap[key2] || key2}</th>
                                    <td>
                                      {typeof selectedDetail?.[key2 as keyof InsuranceDetail] === "string"
                                        && (selectedDetail?.[key2 as keyof InsuranceDetail] as string).match(/^\d{4}-\d{2}-\d{2}/)
                                        ? (selectedDetail?.[key2 as keyof InsuranceDetail] as string).slice(0, 10)
                                        : String(selectedDetail?.[key2 as keyof InsuranceDetail] ?? "")}
                                    </td>
                                  </>
                                ) : (
                                  <td colSpan={3}>
                                    {key1 === "comment" ? (
                                      <div
                                        style={{
                                          whiteSpace: "nowrap",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          cursor: "pointer",
                                          minHeight: 28,
                                          color: "#49597b"
                                        }}
                                        title={selectedDetail?.comment ?? ""}
                                        onClick={() => {
                                          setCommentEditValue(selectedDetail?.comment ?? "");
                                          setShowCommentModal(true);
                                        }}
                                      >
                                        {selectedDetail?.comment ?? ""}
                                        <span style={{ marginLeft: 10, color: "#198cff", fontSize: 12 }}>📝点击编辑</span>
                                      </div>
                                    ) : (
                                      typeof selectedDetail?.[key1 as keyof InsuranceDetail] === "string"
                                        ? selectedDetail[key1 as keyof InsuranceDetail]
                                        : String(selectedDetail?.[key1 as keyof InsuranceDetail] ?? "")
                                    )}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    );
                  })()}
                  {/* 优化按钮组 */}
                  {renderButtonGroup()}
                </div>
              )}

              {/* 编辑/新增弹窗 */}
              {isEditing && editData && (
                <div className={styles.customModalOverlay}>
                  <div className={styles.customModal}>
                    <h4 style={{ marginBottom: 0 }}>
                      {editType === "add" ? "新增车险信息" : "编辑当前信息"}
                    </h4>
                    <table className={`table table-sm ${styles.editTable}`}>
                      <tbody>
                        {detailFieldOrder.map((pair, rowIdx) => {
                          const [key1, key2] = pair;
                          // 判断隐藏字段
                          if (
                            (!isSuperAdmin && hiddenFieldsForUser.includes(key1)) ||
                            (!isSuperAdmin && key2 && hiddenFieldsForUser.includes(key2))
                          ) {
                            return null;
                          }
                          return (
                            <tr key={key1}>
                              <th style={{ whiteSpace: "nowrap", width: "15%" }}>
                                {insuranceDetailsNameMap[key1] || key1}
                              </th>
                              <td>
                                {renderInput(
                                  key1,
                                  editData[key1 as keyof typeof editData]
                                )}
                              </td>
                              {key2 ? (
                                <>
                                  <th style={{ whiteSpace: "nowrap", width: "15%" }}>
                                    {insuranceDetailsNameMap[key2] || key2}
                                  </th>
                                  <td>
                                    {renderInput(
                                      key2,
                                      editData[key2 as keyof typeof editData]
                                    )}
                                  </td>
                                </>
                              ) : (
                                <>
                                  <th></th>
                                  <td></td>
                                </>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="d-flex justify-content-end mt-2">
                      <button className={styles.btn} onClick={() => setIsEditing(false)}>
                        取消
                      </button>
                      <button
                        className={`${styles.btn} ${styles.btnPrimary} ms-2`}
                        onClick={editType === "add" ? handleCreateSave : handleEditSave}
                      >
                        保存
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {showConfirmModal && (
                <div className={styles.confirmModalOverlay}>
                  <div className={styles.confirmModal}>
                    <h4>确认出单</h4>
                    <div style={{ margin: "20px 0 30px 0", color: "#333", fontSize: "1.07rem" }}>
                      您确定要出单吗？
                    </div>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <button
                        className={styles.cancelBtn}
                        onClick={() => setShowConfirmModal(false)}
                        type="button"
                      >
                        取消
                      </button>
                      <button
                        className={styles.confirmBtn}
                        disabled={confirming}
                        type="button"
                        onClick={async () => {
                          if (!selectedDetail) return;
                          setConfirming(true);
                          try {
                            await handleConfirmIssue(selectedDetail);
                            setShowConfirmModal(false);
                            alert("出单操作已完成！");
                          } catch (e: any) {
                            alert("出单操作失败: " + (e?.message || e));
                          }
                          setConfirming(false);
                        }}
                      >
                        确认
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/*历史投保弹窗 */}
              {historyModalVisible && (
                <div className={styles.historyModalOverlay}>
                  <div className={styles.historyModal}>
                    <div className={styles.historyModalHeader}>
                      <span>投保历史（最近10条）</span>
                      <button
                        className={styles.closeBtn}
                        onClick={() => setHistoryModalVisible(false)}
                      >×</button>
                    </div>
                    <table className={styles.historyTable}>
                      <thead>
                        <tr>
                          <th>车牌号</th>
                          <th>发动机号</th>
                          <th>被保险人</th>
                          <th>起保日期</th>
                          <th>保险公司</th>
                          <th>业务员</th>
                        </tr>
                      </thead>
                      <tbody>
                        {insuranceHistory.map((row, idx) => (
                          <tr key={idx}>
                            <td>{row.licensePlate}</td>
                            <td>{row.engineNumber}</td>
                            <td>{row.insuredName}</td>
                            <td>{row.policyStartDate ? String(row.policyStartDate).slice(0, 10) : ''}</td>
                            <td>{row.insuranceCompany}</td>
                            <td>{row.salesAgent}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {insuranceHistory.length === 0 && (
                      <div style={{ padding: 18, color: "#bbb", textAlign: "center" }}>暂无历史记录</div>
                    )}
                  </div>
                </div>
              )}

              {/* 图片 */}
              {imageModalVisible && (
                <div className={styles.imageModalOverlay}>
                  <div className={styles.imageModal}>
                    <div className={styles.imageModalHeader}>
                      <span>图片管理</span>
                      <button className={styles.closeBtn} onClick={() => setImageModalVisible(false)}>×</button>
                    </div>
                    <div className={styles.imageGridScroll}>

                      {/* ===== 第一行：身份证照片 ===== */}
                      <div className={styles.imageGrid}>
                        {/* 人像面 */}
                        <div className={styles.imageCard}>
                          <img
                            src={idCardImages.faceUrl || "/uploads/insured_idcards/idcard_face_example.png"}
                            alt="人像面"
                            className={styles.insuranceImg}
                          />
                          <div className={styles.cardActionRow} style={{ justifyContent: "center" }}>
                            <span
                              style={{
                                fontWeight: 600,
                                color: "#377ad6",
                                fontSize: 17,
                                marginRight: 28,
                                flexShrink: 0,
                                minWidth: 124,
                                textAlign: "center"
                              }}
                            >
                              身份证人像面
                            </span>
                            <label className={styles.cardBtn} style={{ marginRight: 16 }}>
                              上传/替换
                              <input
                                type="file"
                                accept="image/*"
                                disabled={idCardUploading.face}
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadIdCardImage(file, "face");
                                }}
                                style={{ display: "none" }}
                              />
                            </label>
                            {idCardImages.faceUrl && (
                              <a
                                href={idCardImages.faceUrl}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.cardBtn}
                                style={{ background: "#ffa600" }}
                              >
                                下载
                              </a>
                            )}
                            {idCardUploading.face && (
                              <span className={styles.uploadingTip} style={{ marginLeft: 10 }}>
                                上传中...
                              </span>
                            )}
                          </div>


                        </div>
                        {/* 国徽面 */}
                        <div className={styles.imageCard}>
                          <img
                            src={idCardImages.backUrl || "/uploads/insured_idcards/idcard_back_example.png"}
                            alt="国徽面"
                            className={styles.insuranceImg}
                          />
                          <div className={styles.cardActionRow} style={{ justifyContent: "center" }}>
                            <span
                              style={{
                                fontWeight: 600,
                                color: "#377ad6",
                                fontSize: 17,
                                marginRight: 28,
                                flexShrink: 0,
                                minWidth: 124,
                                textAlign: "center"
                              }}
                            >
                              身份证国徽面
                            </span>
                            <label className={styles.cardBtn} style={{ marginRight: 16 }}>
                              上传/替换
                              <input
                                type="file"
                                accept="image/*"
                                disabled={idCardUploading.face}
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadIdCardImage(file, "face");
                                }}
                                style={{ display: "none" }}
                              />
                            </label>
                            {idCardImages.faceUrl && (
                              <a
                                href={idCardImages.faceUrl}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.cardBtn}
                                style={{ background: "#ffa600" }}
                              >
                                下载
                              </a>
                            )}
                            {idCardUploading.face && (
                              <span className={styles.uploadingTip} style={{ marginLeft: 10 }}>
                                上传中...
                              </span>
                            )}
                          </div>

                        </div>
                      </div>

                      {/* ===== 第二行：上传新图片按钮 ===== */}
                      <div style={{ margin: "18px 0 8px 0", display: "flex", alignItems: "center" }}>
                        <label className={styles.cardBtn} style={{ fontSize: 15 }}>
                          上传图片
                          <input
                            type="file"
                            accept="image/*"
                            disabled={imageUploading}
                            onChange={handleUploadImage}
                            style={{ display: "none" }}
                          />
                        </label>
                        {imageUploading && (
                          <span className={styles.uploadingTip} style={{ marginLeft: 12 }}>
                            正在上传...
                          </span>
                        )}
                      </div>

                      {/* ===== 第三行起：所有已上传的图片，每行2个 ===== */}
                      <div className={styles.imageGrid}>
                        {insuranceImages.length === 0 && (
                          <span style={{ color: "#bbb", gridColumn: "1/3" }}>暂无图片</span>
                        )}
                        {insuranceImages.map(img => (
                          <div key={img.id} className={styles.imageCard}>
                            {/* 删除按钮 */}
                            <button
                              onClick={() => handleDeleteImage(img.id)}
                              className={styles.deleteBtn}
                              title="删除图片"
                            >
                              ×
                            </button>
                            {/* 图片 */}
                            <img
                              src={img.url}
                              alt="保险图片"
                              className={styles.insuranceImg}
                            />
                            {/* 操作区 */}
                            {editingRemarkId === img.id ? (
                              <div className={styles.cardActionRow}>
                                <input
                                  value={remarkDraft}
                                  onChange={e => setRemarkDraft(e.target.value)}
                                  className={styles.remarkInput}
                                />
                                <button onClick={() => handleSaveRemark(img)} className={styles.cardBtn}>保存</button>
                                <button onClick={() => setEditingRemarkId(null)} className={styles.cardBtn} style={{ background: "#bbb" }}>取消</button>
                              </div>
                            ) : (
                              <div className={styles.cardActionRow} style={{ justifyContent: "center" }}>
                                <span style={{ color: img.remark ? "#49597b" : "#bbb", marginRight: 10 }}>
                                  {img.remark || "无备注"}
                                </span>
                                <button
                                  onClick={() => handleEditRemark(img)}
                                  className={styles.cardBtn}
                                  style={{ background: "#19ad53" }}
                                >
                                  编辑备注
                                </button>
                                <a
                                  href={img.url}
                                  download
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.cardBtn}
                                  style={{ background: "#ffa600" }}
                                >
                                  下载
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/*日志弹窗 */}
              {showLogModal && (
                <div className={styles.historyModalOverlay /* 可以用已有弹窗的class */}>
                  <div className={styles.historyModal}>
                    <div className={styles.historyModalHeader}>
                      <span>变动日志</span>
                      <button className={styles.closeBtn} onClick={() => setShowLogModal(false)}>×</button>
                    </div>
                    <div className={styles.logModalBody} style={{ maxHeight: 440, overflowY: "auto" }}>
                      {logLoading ? (
                        <div style={{ padding: 30, textAlign: "center" }}>加载中...</div>
                      ) : (
                        <table className={styles.historyTable}>
                          <thead>
                            <tr>
                              <th>车险信息ID</th>
                              <th>字段</th>
                              <th>更改前</th>
                              <th>更改后</th>
                              <th>时间</th>
                              <th>变动人</th>
                            </tr>
                          </thead>
                          <tbody>
                            {logRecords.map((row, idx) => (
                              <tr key={row.id || idx}>
                                <td>{row.detailId}</td>
                                <td>{row.fieldName}</td>
                                <td>{row.oldValue}</td>
                                <td>{row.newValue}</td>
                                <td>{row.updateTime?.replace("T", " ").slice(0, 19)}</td>
                                <td>{row.updateUser}</td>
                              </tr>
                            ))}
                            {logRecords.length === 0 && (
                              <tr>
                                <td colSpan={6} style={{ color: "#bbb", textAlign: "center" }}>暂无日志记录</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/*编辑备注 */}
              {showCommentModal && (
                <div className={styles.customModalOverlay}>
                  <div className={styles.customCommentModal} style={{ minWidth: 400, maxWidth: 560 }}>
                    <h5>编辑备注</h5>
                    <textarea
                      className="form-control"
                      value={commentEditValue}
                      rows={7}
                      style={{ fontSize: 16, marginBottom: 20, marginTop: 10, resize: "vertical" }}
                      onChange={e => setCommentEditValue(e.target.value)}
                      placeholder="请输入备注"
                    />
                    <div className="d-flex justify-content-end mt-2">
                      <button className={styles.btn} onClick={() => setShowCommentModal(false)}>
                        取消
                      </button>
                      <button
                        className={`${styles.btn} ${styles.btnPrimary} ms-2`}
                        onClick={async () => {
                          if (!selectedDetail) return;
                          // 你需要写一个 updateInsuranceComment 接口，只发 id 和 comment
                          try {
                            await updateInsuranceComment(selectedDetail.id, commentEditValue);
                            // 本地同步数据
                            setSelectedDetail(prev =>
                              prev ? { ...prev, comment: commentEditValue } : prev
                            );
                            setMyList(list =>
                              list.map(item =>
                                item.id === selectedDetail.id
                                  ? { ...item, comment: commentEditValue }
                                  : item
                              )
                            );
                            setSearchResult(list =>
                              list.map(item =>
                                item.id === selectedDetail.id
                                  ? { ...item, comment: commentEditValue }
                                  : item
                              )
                            );
                            setShowCommentModal(false);
                            alert("备注已保存！");
                          } catch (err: any) {
                            alert("备注保存失败: " + (err?.message || "未知错误"));
                          }
                        }}
                      >
                        保存
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/*打印弹窗 */}
              {showPrintModal && selectedDetail && (
                <div className={styles.printOverlay}>
                  <div className={`${styles.printPanel} print-panel-global`}>
                    <div className={styles.printTitle}>续保流程单</div>
                    <div className={styles.printForm}>
                      {/* 第一行 */}
                      <div className={styles.printRow}>
                        <div style={{ width: '25%', display: 'flex', alignItems: 'center' }}>
                          被保险人
                          <span className={styles.printLine}>
                            {selectedDetail.insuredName}
                          </span>
                        </div>
                        <div style={{ width: '25%', display: 'flex', alignItems: 'center' }}>
                          车主
                          <span className={styles.printLine}>
                            {selectedDetail.applicantName}
                          </span>
                        </div>
                        <div style={{ width: '50%', display: 'flex', alignItems: 'center' }}>
                          被保险人证件号码
                          <span className={styles.printLine}>
                            {selectedDetail.insuredIdNumber}
                          </span>
                        </div>


                      </div>
                      {/* 第二行 */}
                      <div className={styles.printRow}>
                        <div style={{ width: '35%', display: 'flex', alignItems: 'center' }}>
                          保险单号
                          <span className={styles.printLine}>
                            {selectedDetail.commercialPolicyNumber}
                          </span>
                        </div>
                        <div style={{ width: '23%', display: 'flex', alignItems: 'center' }}>
                          车型
                          <span className={styles.printLine}>
                            {selectedDetail.vehicleModel}
                          </span>
                        </div>
                        <div style={{ width: '21%', display: 'flex', alignItems: 'center' }}>
                          车牌号码
                          <span className={styles.printLine}>
                            {selectedDetail.licensePlate}
                          </span>
                        </div>
                        <div style={{ width: '21%', display: 'flex', alignItems: 'center' }}>
                          起保日期
                          <span>
                            {typeof selectedDetail.policyStartDate === "string"
                              ? selectedDetail.policyStartDate.slice(0, 10)
                              : ""}
                          </span>
                        </div>
                      </div>
                      {/* 第三行 */}
                      <div className={styles.printRow}>
                        <div style={{ width: '100%', display: 'flex', alignItems: 'center' }}>投保险别
                          <span className={styles.printCoverage}>
                            {[
                              Number(selectedDetail.vehicleDamageCoverage) > 0 && '车损险',
                              Number(selectedDetail.thirdPartyCoverage) > 0 && '三者险',
                              Number(selectedDetail.outMedCoverage) > 0 && '医保外',
                              Number(selectedDetail.driverCoverage) > 0 && '司机险',
                              Number(selectedDetail.passengerCoverage) > 0 && '乘客险'
                            ]
                              .filter(Boolean)
                              .map((name, idx) => <span key={idx}>{name}</span>)}
                          </span>
                        </div>
                      </div>
                      {/* 第四行 */}
                      <div className={styles.printRow}>
                        <div style={{ width: '25%', display: 'flex', alignItems: 'center' }}>
                          商业发票
                          <span className={styles.printLine}>
                            ￥{selectedDetail.commercialPremium || '--'}
                          </span>
                        </div>
                        <div style={{ width: '25%', display: 'flex', alignItems: 'center' }}>
                          交强发票
                          <span className={styles.printLine}>
                            ￥{selectedDetail.compulsoryPremium || '--'}
                          </span>
                        </div>
                        <div style={{ width: '25%', display: 'flex', alignItems: 'center' }}>
                          车船税
                          <span className={styles.printLine}>
                            ￥{selectedDetail.vehicleTax || '--'}
                          </span>
                        </div>
                        <div style={{ width: '25%', display: 'flex', alignItems: 'center' }}>
                          驾意险
                          <span className={styles.printLine}>
                            ￥{selectedDetail.driverAccidentPremium || '--'}
                          </span>
                        </div>
                      </div>
                      {/* 第五行 */}
                      <div className={styles.printRow}>
                        <div style={{ width: '33.33%', display: 'flex', alignItems: 'center' }}>
                          总计金额
                          <span className={styles.printLine}>
                            ￥{selectedDetail.commercialPremium + selectedDetail.compulsoryPremium + selectedDetail.vehicleTax + selectedDetail.driverAccidentPremium ? selectedDetail.commercialPremium + selectedDetail.compulsoryPremium + selectedDetail.vehicleTax + selectedDetail.driverAccidentPremium : '--'}
                          </span>
                        </div>
                        <div style={{ width: '60%', display: 'flex', alignItems: 'center' }}>
                          交款方式
                          <span className={styles.radioGroup}>
                            <label>
                              <input
                                type="radio"
                                name="paymentType"
                              />
                              现金
                            </label>
                            <label>
                              <input
                                type="radio"
                                name="paymentType"
                              />
                              刷卡
                            </label>
                          </span>
                        </div>
                      </div>
                      {/* 第六行 */}
                      <div className={styles.printRow}>
                        <div style={{ width: '33.33%', display: 'flex', alignItems: 'center' }}>
                          财务签字
                          <span className={styles.printLine}></span>
                        </div>
                        <div style={{ width: '33.33%', display: 'flex', alignItems: 'center' }}>
                          复核人
                          <span className={styles.printLine}></span>
                        </div>
                        <div style={{ width: '33.33%', display: 'flex', alignItems: 'center' }}>
                          客户签字
                          <span className={styles.printLine}></span>
                        </div>
                      </div>
                      {/* 第七行 */}
                      <div className={styles.printRow}>
                        <div style={{ width: '70%', display: 'flex', alignItems: 'center' }}>
                          送单地址
                          <span className={styles.printLine}>
                            {selectedDetail.deliveryAddress}
                          </span>
                        </div>
                        <div style={{ width: '30%', display: 'flex', alignItems: 'center' }}>
                          业务员
                          <span className={styles.printLine}>
                            {selectedDetail.salesAgent}
                          </span>
                        </div>
                      </div>
                      {/* 第八行 */}
                      <div className={styles.printRow}>
                        <div style={{ width: '50%', display: 'flex', alignItems: 'center' }}>
                          客户电话
                          <span className={styles.printLine}>
                            {selectedDetail.mobile || selectedDetail.phone}
                          </span>
                        </div>
                        <div style={{ width: '50%', display: 'flex', alignItems: 'center' }}>
                          送单员
                          <input
                            className={styles.printInput}
                            readOnly={false}
                            onChange={e => {
                              /* 控制补充信息的state */
                            }}
                            placeholder="请填写送单员"
                          />
                        </div>
                      </div>
                      {/* 第九行 */}
                      <div className={styles.printRow}>
                        <div style={{ width: '100%' }}>
                          补充信息
                          <input
                            className={styles.printInput}
                            readOnly={false}
                            onChange={e => {
                              /* 控制补充信息的state */
                            }}
                            placeholder="请填写补充信息"
                          />
                        </div>
                      </div>
                    </div>
                    {/* 备注区 */}
                    <div className={styles.printRemarkBlock}>
                      <div>备注：</div>
                      <div>1、本流程单用于保险业务办理，所有信息请认真核对无误后签字。</div>
                      <div>2、如需变更，请及时联系保险专员。</div>
                      {/* 你可以加更多自定义备注 */}
                    </div>
                    <div className={styles.printBtnRow}>
                      <button className="btn btn-primary" onClick={() => window.print()}>打印</button>
                      <button className="btn btn-secondary ms-2" onClick={() => setShowPrintModal(false)}>关闭</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsuranceDetails;
