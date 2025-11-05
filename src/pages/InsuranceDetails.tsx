import React, { useState } from "react";
import styles from "./InsuranceDetails.module.css";
import { insuranceDetailsNameMap, insuranceDetailFieldTypeMap } from "../utils/fieldUtils";
import { useEffect } from "react";
import { useRef } from "react";
import {
  addInsuranceDetail, exportInsuranceDetailsAll, updateInsuranceDetail, confirmIssueInsuranceDetail, fetchInsuranceHistory, uploadInsuranceImage,
  fetchInsuranceImages, deleteInsuranceImage, updateInsuranceImageRemark, uploadIdCardImage, fetchIdCardImage, fetchInsuranceChangeLogs
  , saveInsuranceChangeLogs, updateInsuranceComment, checkDuplicateLicensePlate, deleteInsuranceDetail, searchInsuranceDetails
} from "../api/insuranceDetails.ts";
import { getTodayDate, getNowDateTime, formatDateTime, formatDate } from '../utils/dateUtils';
import { renderInsuranceInput, calcReceivablePremium, InsuranceCompanySelect, AgentSelectInput } from "../utils/insuranceFormUtils";
import { exportXlsx, XlsxColumn } from "../utils/exportXlsx";

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
  extraFee: number;
}

// 文件顶层（组件外）
export const checkDupByPlateEngineVin = async (
  detail: Pick<InsuranceDetail, "licensePlate" | "engineNumber" | "vinNumber">
): Promise<boolean> => {
  const licensePlate = (detail.licensePlate || "").trim();
  const engineNumber = (detail.engineNumber || "").trim();
  const vinNumber = (detail.vinNumber || "").trim();

  try {
    const res = await checkDuplicateLicensePlate(licensePlate, engineNumber, vinNumber);
    return !!res?.data; // true=存在重复
  } catch (err: any) {
    alert("校验重复失败：" + (err?.message || "未知错误"));
    return true; // 保守阻断
  }
};

export const detailFieldOrder: string[][] = [
  ["id", "applicantName"],
  ["commercialPolicyNumber", "applicantIdNumber"],
  ["compulsoryPolicyNumber", "insuredName"],
  ["inputDate", "insuredIdNumber"],
  ["signingDate", "registrationOwner"],
  ["vehicleDamageCoverage", "registrationOwnerId"],
  ["thirdPartyCoverage", "licensePlate"],
  ["outMedCoverage", "vehicleModel"],
  ["driverCoverage", "firstRegistrationDate"],
  ["passengerCoverage", "engineNumber"],
  ["extraFee", "vinNumber"],
  ["commercialPremium", "approvedSeats"],
  ["compulsoryPremium", "approvedLoad"],
  ["driverAccidentPremium", "deliveryAddress"],
  ["vehicleTax", "phone"],
  ["receivablePremium", "mobile"],
  ["receivedPremium", "salesAgent"],
  ["policyStartDate", "salesManager"],
  ["insuranceCompany", "intermediaryInvoiceNo"],
  ["issuingOffice", "hierarchyCode"],
  ["comment"],
  ["isSettlement", "financeVerification"],
  ["commercialAdjustment", "compulsoryAdjustment"]
];



const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || '{}');
const hierarchyCode = userInfo.hierarchyCode || "";
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
let hiddenFieldsForUser: string[] = [];

if (isNormalUser || isAdmin) {
  hiddenFieldsForUser = [
    "isSettlement",
    "financeVerification",
    "commercialAdjustment",
    "compulsoryAdjustment"
  ];
}

// ★ 新增：把人员字段统一清洗成字符串，避免 [object Object]
function normalizePersonFields<T extends { salesManager?: any; hierarchyCode?: any }>(data: T): T {
  const mgr = data.salesManager;
  const mgrName =
    typeof mgr === "string"
      ? mgr
      : (mgr?.displayName || mgr?.name || mgr?.username || mgr?.realName || "");

  const code = data.hierarchyCode;
  const codeStr =
    typeof code === "string" || typeof code === "number"
      ? String(code)
      : (code?.code || code?.value || "");

  return { ...data, salesManager: mgrName || "", hierarchyCode: codeStr || "" };
}

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

  // 分页：只渲染当前页
  const [page, setPage] = useState(1);
  const [size] = useState(1000);      // 固定每页 1000，可做成下拉
  const [total, setTotal] = useState(0);
  const [pageInput, setPageInput] = useState<string>("1"); // 跳页输入框

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

  const [insuranceCompanyInput, setInsuranceCompanyInput] = useState("");
  const [insuranceDropdownOpen, setInsuranceDropdownOpen] = useState(false);

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
  const canEditPolicyNumber = isSuperAdmin || isAdmin;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);


  // === 在组件里新增这几个 state 和函数 ===
  const [colWidths, setColWidths] = useState<number[]>([50, 100, 120, 150, 120, 100]);
  const [dragging, setDragging] = useState<{ col: number; startX: number; startWidth: number } | null>(null);
  const [dragLineX, setDragLineX] = useState<number | null>(null);

  const listScrollRef = useRef<HTMLDivElement | HTMLTableSectionElement | null>(null);
  const [submitting, setSubmitting] = useState(false);


  const handleMouseDown = (e: React.MouseEvent, colIndex: number) => {
    setDragging({ col: colIndex, startX: e.clientX, startWidth: colWidths[colIndex] });
    setDragLineX(e.clientX);
    e.preventDefault();
  };

  function buildFilters() {
    const {
      insuredName,
      licensePlate,
      signingDateStart,
      signingDateEnd,
      policyStartDateStart,
      policyStartDateEnd,
      commercialPolicyNumber,
      mobileOrPhone,
    } = query;

    // 业务员：普通用户强制自己；管理员/超管只有选择下拉项才传
    const salesAgent = isNormalUser ? currentUserName : (selectedAgent || "");

    // 后端用 policyNumber 字段统一搜商业/交强
    return {
      insuredName,
      licensePlate,
      signingDateStart,
      signingDateEnd,
      policyStartDateStart,
      policyStartDateEnd,
      policyNumber: (commercialPolicyNumber || "").trim(),
      mobileOrPhone,
      salesAgent
    };
  }

  // ✅ 替换原来的 fetchPage 定义
  async function fetchPage(
    toPage: number,
    opts?: {
      // 允许只传一部分字段（比如仅 salesAgent）
      filtersOverride?: Partial<ReturnType<typeof buildFilters>>;
      customFiltersOverride?: { field: string; op: '=' | '>' | '<' | 'like' | 'not like'; value: string }[];
      sizeOverride?: number;
    }
  ) {
    setLoading(true);
    setShowList(false);
    try {
      const payloadFilters = opts?.filtersOverride ?? buildFilters();
      const payloadCustomFilters = opts?.customFiltersOverride ?? customFilters;
      const pageSize = opts?.sizeOverride ?? size;

      const res = await searchInsuranceDetails({
        ...payloadFilters,
        customFilters: payloadCustomFilters,
        page: toPage,
        size: pageSize,
        sort: "id,desc",
      }).then(r => r.data);

      const rows = res?.rows || [];
      setSearchResult(rows);
      setMyList(rows);
      setTotal(Number(res?.total || 0));
      setPage(toPage);
      setPageInput(String(toPage));
    } finally {
      setLoading(false);
      setShowList(true);
    }
  }

  // 计算总页数（避免 0）
  const totalPages = Math.max(1, Math.ceil(total / size));

  function gotoPage(p: number) {
    const clamped = Math.min(Math.max(1, p), totalPages);
    if (clamped !== page) fetchPage(clamped);
  }

  function onPrev() { if (page > 1) fetchPage(page - 1); }
  function onNext() { if (page < totalPages) fetchPage(page + 1); }

  function onJumpSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(pageInput, 10);
    if (!Number.isNaN(n)) gotoPage(n);
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging) return;
    const container = document.querySelector(`.${styles.queryResultTable}`)?.parentElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      setDragLineX(e.clientX - rect.left + container.scrollLeft);
    }

  };

  // 放到组件内其它 handler 附近
  const handleClearAndReload = () => {
    // 1) 清空查询 UI
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
    // 2) 清空“自定义筛选”UI
    setFilterField("");
    setFilterOperator("=");   // 跟你自定义筛选清除时保持一致
    setFilterValue("");

    // 3) 清空自定义筛选的 payload
    setCustomFilters([]);

    // 4) 业务员输入框/选中项复位
    if (isNormalUser) {
      setAgentInput(currentUserName);
      setSelectedAgent(currentUserName);
    } else {
      setAgentInput("");
      setSelectedAgent(null);
    }

    setPageInput("1"); // UI 上页码复位

    // 5) 立刻发起一次请求：仅带上必要的 salesAgent；其余条件/筛选均为空
    fetchPage(1, {
      filtersOverride: { salesAgent: isNormalUser ? currentUserName : "" },
      customFiltersOverride: []
    });
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

  // 放到组件内部、在 fetchPage 定义之后
  const didInitRef = useRef(false);

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    if (!currentUserName) return;
  
    if (isNormalUser) {
      // 普通业务员：默认看自己
      setAgentInput(currentUserName);
      setSelectedAgent(currentUserName);
      fetchPage(1, {
        filtersOverride: { salesAgent: currentUserName },
        customFiltersOverride: [],
        sizeOverride: 20,
      });
    } else {
      // 管理员/超管：业务员输入框留空，默认查全员
      setAgentInput("");
      setSelectedAgent(null);
  
      // 注意：你初始 query 里签单日期是“今天到今天”，会把结果限制掉；
      // 这里顺便把日期条件覆盖为空，确保能查全量
      fetchPage(1, {
        filtersOverride: {
          salesAgent: "",
          insuredName: "",
          licensePlate: "",
          signingDateStart: "",
          signingDateEnd: "",
          policyStartDateStart: "",
          policyStartDateEnd: "",
          policyNumber: "",
          mobileOrPhone: "",
        },
        customFiltersOverride: [],
        sizeOverride: 20,
      });
    }
  }, [currentUserName, isNormalUser]);  

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
    if (myList && myList.length > 0) {
      setSelectedIndex(0);
      setSelectedDetail(myList[0]);
    } else {
      setSelectedIndex(null);
      setSelectedDetail(null);
    }
  }, [myList]);  

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (selectedIndex > 0) {
          const newIndex = selectedIndex - 1;
          setSelectedIndex(newIndex);
          setSelectedDetail(myList[newIndex]);
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (selectedIndex < myList.length - 1) {
          const newIndex = selectedIndex + 1;
          setSelectedIndex(newIndex);
          setSelectedDetail(myList[newIndex]);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, myList]);

  const openImageWindow = (url: string) => {
    const imgWin = window.open("", "_blank", "width=800,height=600,resizable=yes,scrollbars=yes");
    if (imgWin) {
      imgWin.document.write(`
        <html>
          <head>
            <title>图片预览</title>
            <style>
              body {
                margin: 0;
                background: #000;
                overflow: auto;  /* 支持滚动 */
              }
              img {
                display: block;
                margin: auto;
                max-width: none;   /* 不限制大小 */
                max-height: none;
              }
            </style>
          </head>
          <body>
            <img src="${url}" />
          </body>
        </html>
      `);
    }
  };

  async function openImageAlwaysOnTop(url: string) {
    // 有 Doc-PiP 就用它；没有就退回原来的新窗口方案
    const hasDocPiP = (window as any).documentPictureInPicture?.requestWindow;
    if (!hasDocPiP) {
      openImageWindow(url); // 你现有的函数
      return;
    }

    const pipWin = await (window as any).documentPictureInPicture.requestWindow({
      width: 900,
      height: 700
    });

    // 写入样式与结构（支持滚轮缩放、拖拽、双击复位）
    pipWin.document.write(`
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            html,body{margin:0;height:100%;background:#111;color:#eee;overflow:hidden;}
            .toolbar{height:44px;display:flex;gap:10px;align-items:center;padding:0 10px;background:#1c1c1c;}
            .btn{border:1px solid #444;background:#2a2a2a;padding:6px 10px;border-radius:6px;cursor:pointer}
            #stage{height:calc(100% - 44px);overflow:hidden;position:relative;cursor:grab}
            #img{user-select:none;transform-origin:0 0;display:block}
          </style>
        </head>
        <body>
          <div class="toolbar">
            <button class="btn" id="fit">适配窗口</button>
            <button class="btn" id="maximize">最大化</button>
            <button class="btn" id="reset">1:1</button>
            <span>（滚轮缩放、拖拽平移、双击复位）</span>
          </div>
          <div id="stage"><img id="img" src="${url}" draggable="false" ></div>
          <script>
            const stage = document.getElementById('stage');
            const img = document.getElementById('img');
            let scale=1, tx=0, ty=0, dragging=false, sx=0, sy=0;
    
            function apply(){ img.style.transform = 'translate('+tx+'px,'+ty+'px) scale('+scale+')'; }
    
            // 滚轮缩放
            stage.addEventListener('wheel', e=>{
              e.preventDefault();
              const k = e.deltaY < 0 ? 1.1 : 0.9;
              scale = Math.max(0.05, Math.min(64, scale * k));
              apply();
            }, {passive:false});
    
            // 拖拽平移
            stage.addEventListener('mousedown', e=>{
              dragging=true; sx=e.clientX - tx; sy=e.clientY - ty; stage.style.cursor='grabbing';
            });
            window.addEventListener('mousemove', e=>{
              if(!dragging) return; tx=e.clientX - sx; ty=e.clientY - sy; apply();
            });
            window.addEventListener('mouseup', ()=>{ dragging=false; stage.style.cursor='grab'; });
    
            // 双击复位
            img.addEventListener('dblclick', ()=>{ scale=1; tx=0; ty=0; apply(); });
    
            // 适配窗口
            function fit(){
              const iw=img.naturalWidth, ih=img.naturalHeight;
              const sw=stage.clientWidth, sh=stage.clientHeight;
              scale=Math.min(sw/iw, sh/ih); tx=0; ty=0; apply();
            }
            document.getElementById('fit').addEventListener('click', fit);
    
            // 最大化（宽或高占满）
            function maximize(){
              const iw=img.naturalWidth, ih=img.naturalHeight;
              const sw=stage.clientWidth, sh=stage.clientHeight;
              scale=Math.max(sw/iw, sh/ih); tx=0; ty=0; apply();
            }
            document.getElementById('maximize').addEventListener('click', maximize);
    
            // 1:1
            document.getElementById('reset').addEventListener('click', ()=>{ scale=1; tx=0; ty=0; apply(); });
    
            window.addEventListener('load', fit);
          </script>
        </body>
      </html>
    `);
    pipWin.document.close();
  }

  function openImageSmart(url: string) {
    // 判断是否支持 Doc-PiP（Chrome/Chromium）
    const supportsDocPiP = (window as any).documentPictureInPicture?.requestWindow;

    if (supportsDocPiP) {
      openImageAlwaysOnTop(url);
    } else {
      openImageWindow(url);
    }
  }


  useEffect(() => {
    if (isNormalUser) {
      setAgentInput(currentUserName);
      setSelectedAgent(currentUserName);
    }
  }, [isNormalUser, currentUserName]);

  const normalizeEditData = (data: any) => {
    return {
      ...data,
      commercialPolicyNumber:
        data.commercialPolicyNumber === "" ? null : data.commercialPolicyNumber,
      compulsoryPolicyNumber:
        data.compulsoryPolicyNumber === "" ? null : data.compulsoryPolicyNumber,
    };
  };

  useEffect(() => {
    if (myList.length > 0) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.font = "12px Arial"; // 要跟表格里字体保持一致

      const titles = ["#", "被保险人", "身份证号码", "车牌号"];

      const widths = titles.map((t, colIdx) => {
        // 1. 标题宽度
        let maxWidth = ctx.measureText(t).width + 20;

        // 2. 遍历数据
        myList.forEach((row, rowIdx) => {
          let text = "";
          switch (colIdx) {
            case 0: text = String(rowIdx + 1); break;
            case 1: text = row.insuredName ?? ""; break;
            case 2: text = row.insuredIdNumber ?? ""; break;
            case 3: text = row.licensePlate ?? ""; break;
          }
          const w = ctx.measureText(text).width + 20; // 适当 padding
          if (w > maxWidth) maxWidth = w;
        });

        // 限制最大最小值
        return Math.min(Math.max(maxWidth, 10), 300);
      });

      setColWidths(widths);
    }
  }, [myList]);

  useEffect(() => {
    if (selectedDetail) {
      // ★ 新增：进入编辑态前统一把人员字段转成字符串
      setEditData(normalizePersonFields({ ...selectedDetail }));
    } else {
      setEditData(null);
    }
  }, [selectedDetail]);

  useEffect(() => {
    if (selectedIndex == null) return;
    scrollRowIntoView(selectedIndex, styles.queryResultTable);
  }, [selectedIndex]);

  function getScrollParent(node: HTMLElement | null): HTMLElement {
    let p: HTMLElement | null = node?.parentElement ?? null;
    while (p) {
      const oy = getComputedStyle(p).overflowY;
      if (oy === 'auto' || oy === 'scroll') return p;
      p = p.parentElement;
    }
    return (document.scrollingElement || document.documentElement) as HTMLElement;
  }

  function scrollRowIntoView(index: number, tableClass: string) {
    const row = document.querySelector(`.${tableClass} tr[data-index="${index}"]`) as HTMLElement | null;
    if (!row) return;
    const container = getScrollParent(row);
    const containerRect = container.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const thead = container.querySelector('thead') as HTMLElement | null;
    const headerH = thead ? thead.offsetHeight : 0;
    const targetTop = rowRect.top - containerRect.top + container.scrollTop - headerH;
    container.scrollTo({ top: Math.max(targetTop, 0), behavior: 'auto' }); // 想平滑用 'smooth'
  }

  const renderInput = (key: string, value: any) => {
    // —— 统一的权限判定（可编辑=超管/管理员；普通用户大多只读）——
    const canEdit = isSuperAdmin || isAdmin;
    const safeUpdate = (updater: (prev: InsuranceDetail) => InsuranceDetail) => {
      setEditData(prev => {
        // 确保 prev 不为 null（避免第一次修改“写不进去”）
        const base = prev ?? (selectedDetail ? { ...selectedDetail } as InsuranceDetail : {} as InsuranceDetail);
        return updater(base);
      });
    };

    // 1) 商业/交强保单号：只有超管/管理员可编辑
    if (key === "commercialPolicyNumber" || key === "compulsoryPolicyNumber") {
      const canEditPolicyNumber = isSuperAdmin || isAdmin;
      return (
        <div className={styles.policyNumberRow}>
          <input
            type="text"
            className={`${styles.policyNumberInput} ${styles.editInput} form-control`}
            value={value ?? ""}
            disabled={!canEditPolicyNumber}
            readOnly={!canEditPolicyNumber}
            onChange={(e) => {
              if (canEditPolicyNumber) {
                const v = e.target.value;
                safeUpdate(prev => ({ ...prev, [key]: v }));
              }
            }}
          />
        </div>
      );
    }

    // 2) 业务员：管理员/超管可下拉选择；普通用户固定为自己只读
    if (key === "salesAgent") {
      if (isNormalUser) {
        const displayName = (userInfo?.displayName ?? currentUserName ?? "") as string;
        return (
          <input
            type="text"
            className={`${styles.editInput} form-control`}
            value={value ?? displayName}
            readOnly
            disabled
          />
        );
      }

      // 管理员/超管：可从 userList 下拉选择；选中后自动回填主管/层级码
      return (
        <AgentSelectInput
          value={value ?? ""}
          userList={userList}
          onPick={(picked, typed) => {
            if (picked) {
              const mgrRaw = (picked as any).manager ?? "";
              const mgrName =
                typeof mgrRaw === "string"
                  ? mgrRaw
                  : (mgrRaw?.displayName || mgrRaw?.name || mgrRaw?.username || "");

              const codeRaw = (picked as any).hierarchyCode ?? "";
              const codeStr =
                typeof codeRaw === "string" || typeof codeRaw === "number"
                  ? String(codeRaw)
                  : (codeRaw?.code || codeRaw?.value || "");

              safeUpdate(prev => ({
                ...prev,
                salesAgent: picked.displayName,
                salesManager: mgrName || prev.salesManager || "",
                hierarchyCode: codeStr || prev.hierarchyCode || "",
              }));
            } else {
              // 允许手输（若组件配置允许）：仅先写入 salesAgent，保存时会强校验
              safeUpdate(prev => ({ ...prev, salesAgent: typed }));
            }
          }}
        />

      );
    }

    // 2.5) 保险公司：使用可输入即下拉的 InsuranceCompanySelect
    if (key === "insuranceCompany") {
      return (
        <InsuranceCompanySelect
          companies={insuranceCompanies}
          value={value ?? ""}
          onChange={(val: string) => {
            safeUpdate(prev => ({ ...prev, insuranceCompany: val }));
          }}
        />
      );
    }

    // 3) 主管/层级码：永远只读
    if (key === "salesManager" || key === "hierarchyCode") {
      return (
        <input
          type="text"
          className={`${styles.editInput} form-control`}
          value={value ?? ""}
          readOnly
          disabled
        />
      );
    }

    // 4) 备注：所有角色可编辑（如果你希望普通用户也能写备注）
    if (key === "comment") {
      return (
        <textarea
          className={`${styles.editInput} form-control`}
          value={value ?? ""}
          rows={3}
          onChange={e => safeUpdate(prev => ({ ...prev, comment: e.target.value }))}
        />
      );
    }

    // 5) 中介票号：仅超管可改
    if (key === "intermediaryInvoiceNo") {
      const isFieldEditable = isSuperAdmin;
      return (
        <input
          type="number"
          className={`${styles.editInput} form-control`}
          value={value ?? ""}
          onChange={e => {
            if (isFieldEditable) {
              const newVal = e.target.value === "" ? null : Number(e.target.value);
              safeUpdate(prev => ({ ...prev, [key]: newVal }));
            }
          }}
          disabled={!isFieldEditable}
          readOnly={!isFieldEditable}
        />
      );
    }

    // 6) 出单处：管理员/超管可改
    if (key === "issuingOffice") {
      const isFieldEditable = isSuperAdmin || isAdmin;
      return (
        <input
          type="text"
          className={`${styles.editInput} form-control`}
          value={value ?? ""}
          onChange={e => {
            if (isFieldEditable) {
              const v = e.target.value;
              safeUpdate(prev => ({ ...prev, [key]: v }));
            }
          }}
          disabled={!isFieldEditable}
          readOnly={!isFieldEditable}
        />
      );
    }

    // 7) 日期：inputDate 仅超管；signingDate 管理员/超管
    if (key === "inputDate" || key === "signingDate") {
      const isFieldEditable = key === "inputDate" ? isSuperAdmin : (isSuperAdmin || isAdmin);
      return (
        <input
          type="date"
          className={`${styles.editInput} form-control`}
          value={value ? String(value).slice(0, 10) : ""}
          onChange={e => {
            if (isFieldEditable) {
              safeUpdate(prev => ({ ...prev, [key]: e.target.value }));
            }
          }}
          disabled={!isFieldEditable}
          readOnly={!isFieldEditable}
        />
      );
    }

    // 8) 其它字段：走通用渲染（内部也要只按权限判断，不用 isEditing）
    return renderInsuranceInput(
      key,
      value,
      (updater: any) => {
        // 兼容你原来的 renderInsuranceInput(setEditData, ...)
        // 允许它传函数或直接对象
        if (typeof updater === "function") {
          safeUpdate(updater);
        } else {
          safeUpdate(() => updater);
        }
      },
      isNormalUser,
      insuranceCompanies,
      { isSuperAdmin, isAdmin, userList }
    );
  };


  // === 4. 业务逻辑区（派生变量/条件函数等） ===
  // 是否日期字段
  const isDateField = dateFields.has(filterField);

  // 安全 startsWith
  const starts = (v: any, prefix: string) =>
    typeof v === "string" && v.length > 0 && v.startsWith(prefix);

  // 取“优先保单号”：商业优先，其次交强；都无则空串
  const preferredPN = (it: any): string =>
    (typeof it?.commercialPolicyNumber === "string" && it.commercialPolicyNumber) ||
    (typeof it?.compulsoryPolicyNumber === "string" && it.compulsoryPolicyNumber) ||
    "";

  // 三态判断：未出单 / 已出单 / 都不属于
  const isNotIssued = (it: any) => starts(preferredPN(it), "QL");     // QL*
  const isNone = (it: any) => {                                  // L* 或 两者都空
    const pn = preferredPN(it);
    if (!pn) return true;
    return pn.startsWith("L");
  };
  const isIssued = (it: any) => {                                  // 其它前缀
    const pn = preferredPN(it);
    if (!pn) return false;
    if (pn.startsWith("QL")) return false;
    if (pn.startsWith("L")) return false;
    return true;
  };

  // 判断“优先保单号”是否以指定前缀开头
  const preferredStarts = (it: any, prefix: string) => starts(preferredPN(it), prefix);

  const filterConditions = {
    notIssued: (item: any) => isNotIssued(item), // QL*
    issued: (item: any) => isIssued(item),    // 非 QL* 且 非 L* 且 非空
    received: (item: any) => (item.receivedPremium ?? 0) > 0,
    notReceived: (item: any) => (item.receivedPremium ?? 0) == 0,
  };

  // 判断是否能编辑
  const canEdit = isSuperAdmin || isAdmin ||
    (isNormalUser && selectedDetail && typeof selectedDetail.commercialPolicyNumber === "string" &&
      selectedDetail.commercialPolicyNumber.startsWith("L"));

  // 获取新增数据模板,新增时不带id/商业号/交强号/中介票号/所有number字段清空
  const getDefaultNewData = () => {
    console.log("当前层级码：", userInfo.hierarchyCode, typeof userInfo.hierarchyCode);
    if (!selectedDetail) return null;
    const omitKeys = ["id", "commercialPolicyNumber", "compulsoryPolicyNumber", "intermediaryInvoiceNo"];
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

      // 出单处
      if (key === "issuingOffice" || key === "isSettlement" || key === "financeVerification") {
        newData[key] = "";
        return;
      }
      if (key === "inputDate") {
        newData.inputDate = getTodayDate();
        return;
      }
      if (key === "signingDate") {
        newData.signingDate = getTodayDate(); // 或者 null，看后端约定
        return;
      }
      if (typeof value === "number") {
        newData[key] = 0;
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
    } = query;

    const salesAgent = isNormalUser ? currentUserName : (selectedAgent || "");

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

    if (agentInput && !selectedAgent) {
      alert("请选择下拉列表中的业务员！");
      return;
    }

    // 1) 清空自定义筛选（避免“查询”还叠加旧筛选）
    setCustomFilters([]);

    // 2) 立刻按当前 buildFilters() 的结果请求第一页，并覆盖 customFilters 为空
    await fetchPage(1, { customFiltersOverride: [] });
  };


  // 组件 state：把自定义筛选累积起来（可选：只用单个）
  const [customFilters, setCustomFilters] = useState<
    { field: string; op: '=' | '>' | '<' | 'like' | 'not like'; value: string }[]
  >([]);

  const handleCustomFilter = () => {
    if (!filterField || !filterOperator || filterValue === "") return;
  
    const nextFilters = [
      { field: filterField, op: filterOperator as any, value: String(filterValue) }
    ];
  
    // 先请求再覆盖本地状态（顺序不变）
    fetchPage(1, { customFiltersOverride: nextFilters });
    setCustomFilters(nextFilters);
  };

  // 清除按钮改为：清空 customFilters 并刷第一页（只影响筛选）
  const clearCustomFilter = () => {
    setFilterField("");
    setFilterOperator("=");   // 日期字段默认就是 "="，复位保持一致
    setFilterValue("");
    setCustomFilters([]);

    // 关键：带上 customFiltersOverride: []，只清空筛选的 payload
    fetchPage(1, { customFiltersOverride: [] });
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
        issued: filteredList.some((it) => isIssued(it)),
        received: filteredList.some((it) => (it.receivedPremium ?? 0) > 0),
      });

      return updatedFilters;
    });
  };

  // === 编辑保存 ===
  const handleEditSave = async () => {
    if (!editData) return;
    if (submitting) return;
    setSubmitting(true);

    // 小工具：统一弹窗 + 复位 submitting
    const fail = (msg: string) => {
      alert(msg);
      setSubmitting(false);
      return;
    };

    // —— 基础清洗 —— //
    const dataToSave = normalizeEditData(editData);

    // 业务员必须下拉选择 + 回填字符串
    const pickedAgent = userList.find(u => u.displayName === dataToSave.salesAgent);
    if (!pickedAgent) return fail("请选择下拉列表中的业务员！");
    const mgrRaw = (pickedAgent as any).manager ?? "";
    const mgrName = typeof mgrRaw === "string"
      ? mgrRaw
      : (mgrRaw?.displayName || mgrRaw?.name || mgrRaw?.username || "");
    const codeRaw = (pickedAgent as any).hierarchyCode ?? "";
    const codeStr = (typeof codeRaw === "string" || typeof codeRaw === "number")
      ? String(codeRaw)
      : (codeRaw?.code || codeRaw?.value || "");
    dataToSave.salesAgent = pickedAgent.displayName;
    dataToSave.salesManager = mgrName || "";
    dataToSave.hierarchyCode = codeStr || "";

    // 兜底清洗（把可能塞进来的对象统一转成字符串）
    const finalDataToSave = normalizePersonFields(dataToSave);

    // —— 保单号/保费规则 —— //
    if (
      (editData.commercialPremium != null && Number(editData.commercialPremium) !== 0) &&
      (!editData.commercialPolicyNumber || editData.commercialPolicyNumber === "")
    ) {
      return fail("商业保费不为0时，商业保单号不能为空！");
    }
    if (
      (editData.compulsoryPremium != null && Number(editData.compulsoryPremium) !== 0) &&
      (!editData.compulsoryPolicyNumber || editData.compulsoryPolicyNumber === "")
    ) {
      return fail("交强保费不为0时，交强保单号不能为空！");
    }
    if (!editData.commercialPolicyNumber && !editData.compulsoryPolicyNumber) {
      return fail("商业保单号和交强保单号不能同时为空！");
    }

    // 保险公司校验
    const validCompanies = insuranceCompanies.map(c => c.insuranceCompany);
    if (!editData.insuranceCompany || !validCompanies.includes(editData.insuranceCompany)) {
      return fail("请选择下拉列表中的保险公司！");
    }

    // 已收保费 ≤ 应收保费 + 1
    {
      const receivable = Number(editData?.receivablePremium ?? 0) || 0;
      const received = Number(editData?.receivedPremium ?? 0) || 0;
      const maxAllowed = receivable + 1;
      if (received > maxAllowed) {
        return fail(`已收保费不能大于应收保费 + 1。应收：${receivable}，最大允许：${maxAllowed}。`);
      }
    }

    // 关键字段变更则写入当前操作者（财务验证人）
    if (
      (selectedDetail?.receivedPremium !== editData?.receivedPremium) ||
      (selectedDetail?.isSettlement !== editData?.isSettlement)
    ) {
      (finalDataToSave as any).financeVerification = currentUserName;
    }

    // ===== 权限闸门（非 L 开头仅管理员/超管可编辑）=====
    const pn = preferredPN(editData); // 商业优先，其次交强
    const isLPolicy = typeof pn === "string" && pn.startsWith("L");
    const isAdminOrSuper = isAdmin || isSuperAdmin; // 直接用顶层已有布尔量
    if (!isLPolicy && !isAdminOrSuper) {
      return fail("此保单当前非 L 开头，仅管理员或超级管理员可编辑。");
    }

    // ===== 仅当 L 开头且三要素（车牌/发动机号/车架号）变更时做重复校验 =====
    try {
      const toPlate = (s: string) => (s || "").trim().toUpperCase(); // 车牌统一大写
      const oldPlate = toPlate(selectedDetail?.licensePlate || "");
      const oldEngine = (selectedDetail?.engineNumber || "").trim();
      const oldVin = (selectedDetail?.vinNumber || "").trim();

      const newPlate = toPlate(editData.licensePlate || "");
      const newEngine = (editData.engineNumber || "").trim();
      const newVin = (editData.vinNumber || "").trim();

      const trioChanged = (oldPlate !== newPlate) || (oldEngine !== newEngine) || (oldVin !== newVin);

      if (isLPolicy && trioChanged) {
        const dup = await checkDupByPlateEngineVin({
          licensePlate: newPlate,
          engineNumber: newEngine,
          vinNumber: newVin
        });
        if (dup) return fail("该【车牌+发动机号+车架号】组合在近330天内已存在记录，不能保存！");
      }
    } catch (e: any) {
      return fail("重复性校验失败，请稍后重试：" + (e?.message || e));
    }

    // —— 提交 & 列表刷新 & 日志记录 —— //
    try {
      const updateRes = await updateInsuranceDetail(finalDataToSave);
      const updated = updateRes.data; // 假设后端返回最新对象

      // 列表顶替
      setMyList(list => [updated, ...list.filter(item => item.id !== updated.id)]);
      setSearchResult(list => [updated, ...list.filter(item => item.id !== updated.id)]);
      setIsEditing(false);
      setSelectedDetail(updated);

      alert("保存成功！");

      // ===== 变更日志（保持你的原有规则）=====
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

      // 供后续逻辑参考的标志位（若有其他用处）
      const isLtoQL = oldPolicy.startsWith("L") && newPolicy.startsWith("QL");
      const isPureL = newPolicy.startsWith("L") && !isLtoQL;

      // 工具函数 & 常量
      const oldComm = String((oldData as any)?.commercialPolicyNumber || "");
      const newComm = String((newData as any)?.commercialPolicyNumber || "");
      const oldComp = String((oldData as any)?.compulsoryPolicyNumber || "");
      const newComp = String((newData as any)?.compulsoryPolicyNumber || "");
      const isL = (s: string) => typeof s === "string" && s.startsWith("L");
      const isQL = (s: string) => typeof s === "string" && s.startsWith("QL");
      const oldFV = (oldData as any)?.financeVerification ?? "";
      const newFV = (newData as any)?.financeVerification ?? "";
      let financeLogPushed = false; // 避免交强+商业都走 L→L 时重复记“财务验证”

      // 处理单个保单号的变更：除 L→L 外都记日志；L→L 不记号，但补“财务验证”（只补一次）
      const handlePolicyChange = (label: "商业保单号" | "交强保单号", oldNum: string, newNum: string) => {
        const changed = oldNum !== newNum;
        const oldIsL = isL(oldNum);
        const newIsL = isL(newNum);
        const isLtoQLLocal = oldIsL && isQL(newNum);
        const isPureLLocal = newIsL && !isLtoQLLocal;

        if (changed && !(oldIsL && newIsL)) {
          logs.push({
            detailId: oldData?.id,
            fieldName: label,
            oldValue: oldNum,
            newValue: newNum,
            updateUser: currentUserName,
            updateTime: getNowDateTime(),
          });
        } else if (isPureLLocal) {
          if (!financeLogPushed && oldFV !== newFV) {
            logs.push({
              detailId: oldData?.id,
              fieldName: "财务验证",
              oldValue: oldFV,
              newValue: newFV,
              updateUser: currentUserName,
              updateTime: getNowDateTime(),
            });
            financeLogPushed = true;
          }
        }

        return { isPureL: isPureLLocal };
      };

      // 先处理两种保单号
      const { isPureL: isPureLComm } = handlePolicyChange("商业保单号", oldComm, newComm);
      const { isPureL: isPureLComp } = handlePolicyChange("交强保单号", oldComp, newComp);

      // 若任一为“纯 L 场景”，不跑通用字段对比
      const skipGeneralDiff = isPureLComm || isPureLComp;

      // 其他字段差异（跳过两个保单号字段）
      if (!skipGeneralDiff) {
        logFields.forEach(field => {
          if (field === "commercialPolicyNumber" || field === "compulsoryPolicyNumber") return;
          const oldValue = (oldData as any)?.[field];
          const newValue = (newData as any)?.[field];
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
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = async () => {
    try {
      setLoading(true);
  
      // 1) 构造导出筛选（直接复用你现有的 buildFilters / customFilters）
      const payload = {
        ...buildFilters(),
        customFilters,
        // 明确告诉后端忽略分页
        page: undefined,
        size: undefined,
        sort: "id,desc",
      };
  
      // 2) 请求后端导出
      const res = await exportInsuranceDetailsAll(payload);
  
      // 3) 解析文件名（兼容 Content-Disposition）
      const disposition = (res.headers?.["content-disposition"] || "") as string;
      let filename = `车险导出_${new Date().toISOString().slice(0,10)}.xlsx`;
      const match = disposition.match(/filename\*?=(?:UTF-8'')?([^;]+)/i);
      if (match && match[1]) {
        try {
          const raw = match[1].trim().replace(/^"|"$/g, "");
          filename = decodeURIComponent(raw);
        } catch { /* 忽略解析失败，走默认名 */ }
      }
  
      // 4) 触发下载
      const blob = new Blob([res.data], {
        type: res.headers["content-type"] || "application/octet-stream",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("导出失败：" + (err?.message || "未知错误"));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSave = async () => {
    if (!editData) return;
    if (submitting) return; // 防重复点击

    const failCreate = (msg: string) => {
      alert(msg);
      setSubmitting(false);
      return false as const;
    };

    // —— 1) 先做同步校验（此时不要上锁）——
    const validCompanies = insuranceCompanies.map(c => c.insuranceCompany);
    if (!editData.insuranceCompany || !validCompanies.includes(editData.insuranceCompany)) {
      return failCreate("请选择下拉列表中的保险公司！");
    }

    const pickedAgent = userList.find(u => u.displayName === editData.salesAgent);
    if (!pickedAgent) {
      return failCreate("请选择下拉列表中的业务员！");
    }

    // 回填字符串字段
    const mgrRaw = (pickedAgent as any).manager ?? "";
    const mgrName = typeof mgrRaw === "string" ? mgrRaw
      : (mgrRaw?.displayName || mgrRaw?.name || mgrRaw?.username || "");
    const codeRaw = (pickedAgent as any).hierarchyCode ?? "";
    const codeStr = (typeof codeRaw === "string" || typeof codeRaw === "number")
      ? String(codeRaw) : (codeRaw?.code || codeRaw?.value || "");
    editData.salesAgent = pickedAgent.displayName;
    editData.salesManager = mgrName || "";
    editData.hierarchyCode = codeStr || "";

    // 统一清洗
    const finalEditData = normalizePersonFields(editData);

    // —— 2) 重复校验（仍然不加锁）——
    // 建议做一次与编辑保存一致的规范化（车牌大写、去空格）
    const toPlate = (s: string) => (s || "").trim().toUpperCase();
    const dup = await checkDupByPlateEngineVin({
      licensePlate: toPlate(finalEditData.licensePlate || ""),
      engineNumber: (finalEditData.engineNumber || "").trim(),
      vinNumber: (finalEditData.vinNumber || "").trim()
    });
    if (dup) {
      return failCreate("该【车牌+发动机号+车架号】组合在近330天内已存在记录，不能新增！");
    }

    // —— 3) 真正提交时再上锁 —— 
    setSubmitting(true);
    try {
      const submitData: any = {
        insurancedetails: { ...finalEditData },
        username: userInfo.username || ""
      };
      if (!isSuperAdmin) {
        submitData.insurancedetails.salesAgent = currentUserName;
      }
      // 新增必须去掉以下字段
      delete submitData.insurancedetails.id;
      delete submitData.insurancedetails.commercialPolicyNumber;
      delete submitData.insurancedetails.compulsoryPolicyNumber;

      const addRes = await addInsuranceDetail(submitData);
      const newRecord = addRes.data;

      setMyList(list => [newRecord, ...list]);
      setSearchResult(list => [newRecord, ...list]);
      setIsEditing(false);
      setSelectedDetail(newRecord);

      alert("新增成功！");
      await saveInsuranceChangeLogs([{
        detailId: newRecord.id,
        fieldName: "商业保单号",
        oldValue: "",
        newValue: newRecord.commercialPolicyNumber,
        updateUser: currentUserName,
        updateTime: getNowDateTime()
      }]);
    } catch (e: any) {
      alert("新增失败: " + (e?.message || e));
    } finally {
      setSubmitting(false);
    }
  };


  function getTodayDateStr() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  const handleConfirmIssue = async (detail: InsuranceDetail): Promise<boolean> => {
    // ① 必填字段校验
    const requiredFields: (keyof InsuranceDetail)[] = [
      "applicantName",
      "applicantIdNumber",
      "insuredName",
      "insuredIdNumber",
      "registrationOwner",
      "registrationOwnerId",
      "licensePlate",
      "vehicleModel",
      "firstRegistrationDate",
      "engineNumber",
      "vinNumber",
      "approvedSeats",
      "phone"
    ];

    for (const field of requiredFields) {
      if (!detail[field] || String(detail[field]).trim() === "") {
        alert(`字段「${insuranceDetailsNameMap[field] || field}」不能为空！`);
        return false;
      }
    }

    try {
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

      return true; // ✅ 成功
    } catch (err: any) {
      alert("出单接口失败：" + (err.message || "未知错误"));
      return false;
    }
  };

  const handleDeleteDetail = async () => {
    if (!selectedDetail) return;
    if (!window.confirm("确定要删除该车险信息吗？此操作不可恢复！")) return;
    try {
      await deleteInsuranceDetail(selectedDetail.id); // 调用已有 API
      setMyList(list => list.filter(item => item.id !== selectedDetail.id));
      setSearchResult(list => list.filter(item => item.id !== selectedDetail.id));
      setSelectedDetail(null);
      alert("删除成功！");
    } catch (err: any) {
      alert("删除失败：" + (err?.message || "未知错误"));
    }
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
          setInsuranceCompanyInput("");
          setEditData(newData);
          setEditType("add");
          setIsEditing(true);
        }}
        type="button"
      >新增</button>

      {/* 保存 */}
      <button
        className={`${styles.btn} ${styles.btnPrimary}`}
        disabled={!selectedDetail || !canEdit || submitting}
        onClick={handleEditSave}
        type="button"
      >
        保存
      </button>

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
      >
        图片
      </button>
      {isSuperAdmin && selectedDetail && (
        <>
          <button
            className={styles.btn}
            type="button"
            style={{ background: "#323c68", color: "#fff", marginLeft: 8 }}
            onClick={handleShowLogModal}
          >
            日志
          </button>
          <button
            className={styles.btn}
            type="button"
            style={{ background: "#c0392b", color: "#fff", marginLeft: 8 }}
            onClick={handleDeleteDetail}
          >
            删除
          </button>
        </>
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
                  placeholder="请输入商业/交强保单号码"
                />
              </div>
              <div className={styles.queryRow}>
                <label className={styles.queryLabel}>手机(电话)</label>
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
                className="btn btn-secondary btn-sm"
                style={{ minWidth: "50px", paddingLeft: "0px", paddingRight: "0px", fontSize: "15px", letterSpacing: "2px" }}
                type="button"
                onClick={clearCustomFilter}
              >
                清除
              </button>

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
              <div style={{ position: "relative" }}>
                {/* 拖动辅助线 */}
                {dragLineX !== null && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: dragLineX,
                      width: 2,
                      height: "100%",
                      background: "red",
                      zIndex: 10,
                    }}
                  />
                )}
                <div className={styles.queryResultWrap} ref={listScrollRef} style={{ maxHeight: 300, overflowY: 'auto' }}>
                  <table className={styles.queryResultTable}>
                    <thead>
                      <tr>
                        {["#", "被保险人", "身份证号码", "车牌号"].map((title, idx) => (
                          <th key={idx} style={{ width: colWidths[idx], position: "relative" }}>
                            {title}
                            <div
                              style={{
                                position: "absolute",
                                right: 0,
                                top: 0,
                                bottom: 0,
                                width: 5,
                                cursor: "col-resize",
                              }}
                              onMouseDown={(e) => handleMouseDown(e, idx)}
                            />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {myList.map((item, idx) => (
                        <tr
                          key={item.licensePlate + idx}
                          data-index={idx}                              // ★ 标记索引，供滚动定位
                          style={{ cursor: "pointer" }}
                          onClick={() => {
                            setSelectedDetail(item);                    // 设置详情
                            setSelectedIndex(idx);                      // 保存当前索引
                          }}
                          className={selectedDetail?.id === item.id ? styles.selectedRow : ""}
                        >
                          <td>{idx + 1}</td>
                          <td>{item.insuredName}</td>
                          <td>{item.insuredIdNumber}</td>
                          <td>{item.licensePlate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            )
          )}
          {/* 分页条（粘在左侧列表容器的底部，不改变整体布局） */}
          <div
            style={{
              position: 'sticky',
              bottom: 0,
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              padding: '5px 3px',
              borderTop: '1px solid #eef3fc',
              background: '#fff',      // 或者 'inherit'，看你左侧背景
            }}
          >
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={onPrev}
              disabled={loading || page <= 1}
            >
              上
            </button>

            <span style={{ margin: '0 1px', whiteSpace: 'nowrap' }}>
              第<strong>{page}</strong>/{totalPages}页,共<strong>{total}</strong>
            </span>

            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={onNext}
              disabled={loading || page >= totalPages}
            >
              下
            </button>

            <form
              onSubmit={onJumpSubmit}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 1, marginLeft: 1 }}
            >
              <span>跳至</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={pageInput}
                onChange={e => setPageInput(e.target.value)}
                className="form-control form-control-sm"
                style={{ width: 32 }}
              />
              <span>页</span>
              <button type="submit" className="btn btn-sm btn-primary">确定</button>
            </form>
          </div>
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
                {isSuperAdmin && (
                  <button
                    className="btn btn-success btn-sm"
                    style={{
                      minWidth: "50px",
                      padding: "2px 6px",
                      fontSize: "12px",
                      marginLeft: "4px"
                    }}
                    type="button"
                    onClick={handleExport}
                  >
                    导出
                  </button>
                )}
              </div>

              {/* 详细表格 */}
              {selectedDetail && (
                <div>
                  {/* 可编辑详情表格 */}
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
                          <tr key={rowIdx}>
                            {/* 第一列标题 */}
                            <th>{insuranceDetailsNameMap[key1] || key1}</th>

                            {/* 如果有 key2：正常渲染左右两列；如果没有 key2：直接让 value 占满右侧三列 */}
                            {key2 ? (
                              <>
                                <td>
                                  {renderInput(
                                    key1,
                                    editData ? editData[key1 as keyof InsuranceDetail] : ""
                                  )}
                                </td>
                                <th>{insuranceDetailsNameMap[key2] || key2}</th>
                                <td>
                                  {renderInput(
                                    key2,
                                    editData ? editData[key2 as keyof InsuranceDetail] : ""
                                  )}
                                </td>
                              </>
                            ) : (
                              <td colSpan={3} className={styles.commentCell}>
                                {renderInput(
                                  key1,
                                  editData ? editData[key1 as keyof InsuranceDetail] : ""
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* 按钮组保持原调用 */}
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
                            <tr key={rowIdx}>
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
                      <button
                        className={styles.btn}
                        onClick={() => {
                          setIsEditing(false);
                          setEditType("edit");
                          if (selectedDetail) {
                            setEditData(normalizePersonFields({ ...selectedDetail }));
                          } else {
                            setEditData(null);
                          }
                        }}
                      >
                        取消
                      </button>
                      <button
                        className={`${styles.btn} ${styles.btnPrimary} ms-2`}
                        onClick={editType === "add" ? handleCreateSave : handleEditSave}
                        disabled={submitting}
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
                          const ok = await handleConfirmIssue(editData || selectedDetail);
                          setConfirming(false);
                          if (ok) {
                            setShowConfirmModal(false);
                            alert("出单操作已完成！");
                          }
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
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                              openImageWindow(idCardImages.faceUrl || "/uploads/insured_idcards/idcard_face_example.png")
                            }
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
                            style={{ cursor: "pointer" }}
                            onClick={() =>
                              openImageWindow(idCardImages.backUrl || "/uploads/insured_idcards/idcard_back_example.png")
                            }
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
                                disabled={idCardUploading.back}
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadIdCardImage(file, "back");
                                }}
                                style={{ display: "none" }}
                              />
                            </label>
                            {idCardImages.backUrl && (
                              <a
                                href={idCardImages.backUrl}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.cardBtn}
                                style={{ background: "#ffa600" }}
                              >
                                下载
                              </a>
                            )}
                            {idCardUploading.back && (
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
                              style={{ cursor: "pointer" }}
                              onClick={() => openImageWindow(img.url)} // 点击时设置浮动窗口
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
                            {selectedDetail.registrationOwner}
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
                        <div style={{ width: '45%', display: 'flex', alignItems: 'center' }}>
                          车型
                          <span className={styles.printLine}>
                            {selectedDetail.vehicleModel}
                          </span>
                        </div>
                        <div style={{ width: '20%', display: 'flex', alignItems: 'center' }}>
                          车牌号码
                          <span className={styles.printLine}>
                            {selectedDetail.licensePlate}
                          </span>
                        </div>

                      </div>
                      {/* 第三行 */}
                      <div className={styles.printRow}>
                        <div style={{ width: '80%', display: 'flex', alignItems: 'left' }}>投保险别
                          <span className={styles.printCoverage}>
                            {[
                              Number(selectedDetail.vehicleDamageCoverage) > 0 && '车损险',
                              Number(selectedDetail.thirdPartyCoverage) > 0 &&
                              `三者险(${selectedDetail.thirdPartyCoverage}万)`,
                              Number(selectedDetail.outMedCoverage) > 0 && '医保外',
                              Number(selectedDetail.driverCoverage) > 0 && '司机险',
                              Number(selectedDetail.passengerCoverage) > 0 && '乘客险',
                            ]
                              .filter(Boolean)
                              .map((name, idx) => (
                                <span key={idx} style={{ marginRight: 8 }}>{name}</span>
                              ))}
                          </span>
                        </div>
                        <div style={{ width: '20%', display: 'flex', alignItems: 'center' }}>
                          起保日期
                          <span className={styles.printLine}>
                            {typeof selectedDetail.policyStartDate === "string"
                              ? selectedDetail.policyStartDate.slice(0, 10)
                              : ""}
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
                            {(() => {
                              const total =
                                Number(selectedDetail.commercialPremium || 0) +
                                Number(selectedDetail.compulsoryPremium || 0) +
                                Number(selectedDetail.vehicleTax || 0) +
                                Number(selectedDetail.driverAccidentPremium || 0);

                              return total > 0 ? `￥${total.toFixed(2)}` : '--';
                            })()}
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
      {loading && (
        <div
          className={styles.loadingMask}
          role="dialog"
          aria-modal="true"
          aria-busy="true"
        >
          <div className={styles.loadingBox}>
            <div className={styles.spinner} />
            <div>正在查询，请稍候…</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsuranceDetails;
