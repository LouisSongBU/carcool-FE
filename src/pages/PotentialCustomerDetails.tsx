import React, { useState, useEffect } from "react";
import styles from "./PotentialCustomerDetails.module.css";
import type { InsuranceDetail } from './InsuranceDetails.tsx';
import { checkDupByPlateEngineVin } from "./InsuranceDetails.tsx";
import { getVisibleFields, groupEntriesInPairs, insuranceDetailsNameMap } from "../utils/fieldUtils";
import {
    fetchByRecordDate, fetchComprehensive, updatePotentialCustomer, addPotentialCustomer, addFollowUpPotential, updateFollowUpPotential,
    fetchFollowUpPotentialList, fetchMineWithInsured, fetchByFollowUpDate, searchPotentialCustomers
} from '../api/potentialCustomer';
import { getTodayDate, getNowDateTime, formatDateTime, formatDate } from '../utils/dateUtils';
import { addInsuranceDetail, fetchInsuranceHistory } from "../api/insuranceDetails";
import { initInsuranceForm, renderInsuranceInput, calcReceivablePremium } from "../utils/insuranceFormUtils";
import { detailFieldOrder as insuranceDetailFieldOrder } from "./InsuranceDetails";
import { AgentSelectInput } from "../utils/insuranceFormUtils";
import dayjs from "dayjs";

type PotentialCustomersProps = {
    insuranceCompanies: any[];
    userList: any[];
};

const SHOW_EDIT_TODAY = false;

export interface PotentialCustomer {
    insuredCount: number | null;
    licensePlate: string;
    vehicleModel: string | null;
    policyStartDate: string;
    registrationOwner: string | null;
    phone: string | null;
    firstRegistrationDate: string | null;
    deliveryAddress: string | null;
    registrationOwnerId: string | null;
    vinNumber: string | null;
    engineNumber: string | null;
    recordTime: string | null;
    insuranceCompany: string | null;
    note: string | null;
    note2: string | null;
    salesAgent: string | null;
    hierarchyCode: string | null;
    scheduleFollowUpDate: string | null;
    id: number | null;
    followUpCount: number | null;
    previousSignDate: string | null;
    firstFollowUpNote?: string | null;
    secondFollowUpNote?: string | null;
    insuredName?: string | null;
    insuredIdNumber?: string | null;
}

// 允许的操作符（字面量联合，避免被扩大为 string）
export const ALLOWED_OPS = ['=', '>', '<', 'like', 'not like'] as const;
export type Op = typeof ALLOWED_OPS[number];

export type CustomFilter = {
    field: string;
    op: Op;
    value: string;
};

interface FollowUpPotential {
    index: number;
    content: string;
    date: string;
    // 其它字段可加
}

const fieldNameMap: Record<string, string> = {
    insuredCount: "成功投保",
    licensePlate: "车牌号",
    vehicleModel: "厂牌型号",
    policyStartDate: "起保日期",
    registrationOwner: "车主",
    phone: "电话",
    firstRegistrationDate: "初登日期",
    deliveryAddress: "地址",
    registrationOwnerId: "车主证件号",
    vinNumber: "车架号",
    engineNumber: "发动机号",
    recordTime: "记录时间",
    insuranceCompany: "保险公司",
    note: "备注",
    salesAgent: "业务员",
    hierarchyCode: "层级码",
    scheduleFollowUpDate: "下次回访时间",
    insuredName: "被保险人",
    insuredIdNumber: "被保险人证件号",
}

const detailFieldOrder = [
    "insuredCount", "vehicleModel",
    "licensePlate", "vinNumber",
    "policyStartDate", "engineNumber",
    "registrationOwner", "firstRegistrationDate",
    "registrationOwnerId", "insuranceCompany",
    "insuredName", "recordTime",
    "insuredIdNumber", "salesAgent",
    "phone", "hierarchyCode",
    "deliveryAddress", "scheduleFollowUpDate",
    "note"
];

const dateFields = new Set([
    "policyStartDate",
    "firstRegistrationDate",
    "recordTime",
    "firstFollowUpDate",
    "secondFollowUpDate",
    "thirdFollowUpDate",
    "fourFollowUpDate",
    "fiveFollowUpDate",
    "sixFollowUpDate",
    "sevenFollowUpDate",
    "eightFollowUpDate",
    "nineFollowUpDate",
    "tenFollowUpDate",
    "elevenFollowUpDate",
    "twelveFollowUpDate",
    "thirteenFollowUpDate",
    "fourteenFollowUpDate",
    "fifteenFollowUpDate",
    "scheduleFollowUpDate"
]);

const hiddenFieldsForAll = [
    "id",
    "followUpCount",
    "previousSignDate",
];



const followUpDateFields = [
    "firstFollowUpDate",
    "secondFollowUpDate",
    "thirdFollowUpDate",
    "fourFollowUpDate",
    "fiveFollowUpDate",
    "sixFollowUpDate",
    "sevenFollowUpDate",
    "eightFollowUpDate",
    "nineFollowUpDate",
    "tenFollowUpDate",
    "elevenFollowUpDate",
    "twelveFollowUpDate",
    "thirteenFollowUpDate",
    "fourteenFollowUpDate",
    "fifteenFollowUpDate"
];

const followUpNoteFields = [
    "firstFollowUpNote",
    "secondFollowUpNote",
    "thirdFollowUpNote",
    "fourFollowUpNote",
    "fiveFollowUpNote",
    "sixFollowUpNote",
    "sevenFollowUpNote",
    "eightFollowUpNote",
    "nineFollowUpNote",
    "tenFollowUpNote",
    "elevenFollowUpNote",
    "twelveFollowUpNote",
    "thirteenFollowUpNote",
    "fourteenFollowUpNote",
    "fifteenFollowUpNote"
];


// === 2. 组件主体 ===
// ...模拟数据和 interface 省略...

const PotentialCustomer: React.FC<PotentialCustomersProps> = ({ insuranceCompanies, userList }) => {
    // 1. 查询和筛选
    const [query, setQuery] = useState({
        recordTimeStart: getTodayDate(),
        recordTimeEnd: getTodayDate(),
        policyStartDateStart: "",
        policyStartDateEnd: "",
    });

    const [filters, setFilters] = useState({
        signed: false,
        notSigned: false,
        currentSigned: false,
        currentNotSigned: false,
        scheduled: false,
        notScheduledOrExpired: false,
    });

    const [followUpDateQuery, setFollowUpDateQuery] = useState("");
    const [selectedFollowUpCount, setSelectedFollowUpCount] = useState<string | number>('');
    const [neverFollowUp, setNeverFollowUp] = useState(false);

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editForm, setEditForm] = useState<PotentialCustomer | null>(null);

    const [historyModalVisible, setHistoryModalVisible] = useState(false);
    const [insuranceHistory, setInsuranceHistory] = useState<any[]>([]);

    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [createForm, setCreateForm] = useState<InsuranceDetail | null>(null);

    const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
    const role = userInfo.role || "normal";
    const isSuperAdmin = role === "superAdmin";
    const isAdmin = role === "admin";
    const isNormalUser = role === "normal";
    const currentUserName = userInfo.displayName || "";
    const [historyLoading, setHistoryLoading] = useState(false);

    const hiddenCreateFieldsForUser = isSuperAdmin
        ? [] // 超级管理员不隐藏
        : ["isSettlement", "financeVerification", "commercialAdjustment", "compulsoryAdjustment"];

    const [nextFollowUpDate, setNextFollowUpDate] = useState<string>('');

    // 新增一个 state
    const [initialFirstEmptyDateIdx, setInitialFirstEmptyDateIdx] = useState<number>(0);

    // 2. 详细信息数据相关
    // 详细信息数据相关
    const [allList, setAllList] = useState<PotentialCustomer[]>([]);
    const [myList, setMyList] = useState<PotentialCustomer[]>([]);
    const [selectedDetail, setSelectedDetail] = useState<PotentialCustomer | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [showList, setShowList] = useState(false);

    const [followUpList, setFollowUpList] = useState<FollowUpPotential[]>([]);
    const [commentEditValue, setCommentEditValue] = useState("");
    const [showCommentModal, setShowCommentModal] = useState(false);

    // 回访相关弹窗控制
    const [followUpModalVisible, setFollowUpModalVisible] = useState(false);
    const [followUpEditMode, setFollowUpEditMode] = useState<"add" | "edit" | null>(null);
    const [followUpContent, setFollowUpContent] = useState("");
    const [editingFollowUpId, setEditingFollowUpId] = useState<number | null>(null);

    // 计算今日回访（每次回访包含字段如：id, potential_customer_id, content, date）
    const today = getTodayDate();
    const todayFollowUp = followUpList.find(f => f.date === today);

    // === 在组件里新增这几个 state 和函数 ===
    const [colWidths, setColWidths] = useState<number[]>([30, 30, 100, 60, 100, 100]);
    const [dragging, setDragging] = useState<{ col: number; startX: number; startWidth: number } | null>(null);
    const [dragLineX, setDragLineX] = useState<number | null>(null);

    // 组件顶部其它 useState 旁边加
    const [createSubmitting, setCreateSubmitting] = useState(false);
    // 同一车辆组合同时只允许一条请求在路上
    const inflightCreateRef = React.useRef<Set<string>>(new Set());

    // —— 分页（与保险明细页一致）——
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(1000);     // 你也可以用 1000，保持两页一致即可
    const [total, setTotal] = useState(0);
    const [pageInput, setPageInput] = useState<string>("1");

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

    function buildFilters() {
        // 先保持极简：仅按业务员查（后续你再加其它筛选）
        const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
        const currentUserName = userInfo.displayName || "";
        return { salesAgent: currentUserName };
    }

    // ✅ 关键：与保险明细页风格一致，只是调用 searchPotentialCustomers
    async function fetchPage(
        toPage: number,
        opts?: {
            filtersOverride?: FiltersPayload;
            customFiltersOverride?: CustomFilter[];
            sizeOverride?: number;
            sortOverride?: string;
        }
    ) {
        setShowList(false);

        // ❶ 选定本次要用的条件（优先 override，否则用“上一份”）
        const payloadFilters: FiltersPayload = opts?.filtersOverride ?? lastFilters;
        const payloadCustom: CustomFilter[] = opts?.customFiltersOverride ?? lastCustomFilters;
        const pageSize = opts?.sizeOverride ?? lastSize;
        const sortStr = opts?.sortOverride ?? lastSort;

        try {
            const res = await searchPotentialCustomers({
                ...payloadFilters,
                customFilters: payloadCustom,
                page: toPage,
                size: pageSize,
                sort: sortStr,
            }).then(r => r.data);

            const rows = (res?.rows ?? res?.content ?? []) as any[];
            const totalFromRes = (res?.total ?? res?.totalElements ?? 0) as number;

            setMyList(rows);
            setAllList(rows);
            setTotal(Number(totalFromRes));
            setPage(toPage);
            setPageInput(String(toPage));

            // ❷ 这一次真正“生效”的条件，写回缓存（成为“上一份”）
            setLastFilters(payloadFilters);
            setLastCustomFilters(payloadCustom);
            setLastSort(sortStr);
            setLastSize(pageSize);
        } finally {
            setShowList(true);
        }
    }

    function applySingleFilter(cf: CustomFilter | null) {
        const next = cf ? [cf] : [];
        setCustomFilters(next);
        fetchPage(1, { customFiltersOverride: next });
    }

    const handleMouseDown = (e: React.MouseEvent, colIndex: number) => {
        setDragging({ col: colIndex, startX: e.clientX, startWidth: colWidths[colIndex] });
        setDragLineX(e.clientX);
        e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!dragging) return;
        const container = document.querySelector(`.${styles.queryResultTable}`)?.parentElement;
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

    // —— 小工具：纯日期加天（不受本地时区/DST影响）——
    const addDaysPlain = (dateStr: string, days: number): string => {
        const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!m) return "";
        const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
        const dt = new Date(Date.UTC(y, mo - 1, d, 0, 0, 0));
        dt.setUTCDate(dt.getUTCDate() + days);
        const yy = dt.getUTCFullYear();
        const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(dt.getUTCDate()).padStart(2, "0");
        return `${yy}-${mm}-${dd}`;
    };

    // —— 工具：生成幂等 Key —— 车牌|发动机|VIN|起保日（统一大写，减少匹配误差）——
    const makeIdemKey = (form: any, startDate: string) => {
        const plate = String(form.licensePlate || "").trim().toUpperCase();
        const engine = String(form.engineNumber || "").trim().toUpperCase();
        const vin = String(form.vinNumber || "").trim().toUpperCase();
        return [plate, engine, vin, startDate].join("|");
    };

    // ✅ 提炼后的保存函数：同步校验 → 去重/加锁 → 异步执行（带 finally）
    const handleCreateSave = React.useCallback(
        async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            if (!createForm) return;

            // —— 0) 纯同步校验（此时尚未加锁，早退安全）——
            const startDate = String(createForm.policyStartDate || "").slice(0, 10);
            if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
                alert("起保日期为必填项，且格式必须是 YYYY-MM-DD");
                return;
            }

            // 0.2 三要素必填（出单必需）
            const plateRaw = String(createForm.licensePlate || "").trim();
            const engineRaw = String(createForm.engineNumber || "").trim();
            const vinRaw = String(createForm.vinNumber || "").trim();
            if (!plateRaw || !engineRaw || !vinRaw) {
                alert("请填写完整：车牌号、发动机号、车架号（VIN）");
                return;
            }

            // 统一规范化，减少大小写/空格差异
            createForm.licensePlate = plateRaw.toUpperCase();
            createForm.engineNumber = engineRaw.toUpperCase();
            createForm.vinNumber = vinRaw.toUpperCase();

            const today = getTodayDate();
            const validCompanies = insuranceCompanies
                .filter(c => {
                    const s = c.validStartDate?.slice(0, 10);
                    const e2 = c.validEndDate?.slice(0, 10);
                    return (!s || s <= today) && (!e2 || e2 >= today);
                })
                .map(c => c.insuranceCompany);

            if (!createForm.insuranceCompany || !validCompanies.includes(createForm.insuranceCompany)) {
                alert("请选择有效期内的保险公司！");
                return;
            }

            // —— 1) 生成去重Key，并先做 in-flight 拦截（尽量早，减少并发窗口）——
            const idemKey = makeIdemKey(createForm, startDate);
            if (inflightCreateRef.current.has(idemKey)) {
                alert("正在保存中，请勿重复点击…");
                return;
            }

            // —— 2) 提交锁（防二次点击） + 标记in-flight —— 
            if (createSubmitting) return;
            inflightCreateRef.current.add(idemKey);
            setCreateSubmitting(true);

            try {
                // —— 3) 异步预检：三项查重（近330天）——
                const dup = await checkDupByPlateEngineVin({
                    licensePlate: createForm.licensePlate,
                    vinNumber: createForm.vinNumber,
                    engineNumber: createForm.engineNumber,
                });
                if (dup) {
                    alert("该【车牌+发动机号+车架号】组合在近330天内已存在记录，不能新增！");
                    return; // ← 会进入 finally，安全释放
                }

                // —— 4) 组装 payload 并去除不该传的字段 —— 
                const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
                const payload: any = {
                    insurancedetails: { ...createForm },
                    username: userInfo.username || ""
                };
                payload.insurancedetails.inputDate = getTodayDate(); // 录入日期=今天
                payload.insurancedetails.signingDate = getTodayDate();
                delete payload.insurancedetails.id;
                delete payload.insurancedetails.commercialPolicyNumber;
                delete payload.insurancedetails.compulsoryPolicyNumber;

                // —— 5) 新增保单 —— 
                await addInsuranceDetail(payload);

                // —— 6) 成功后联动更新“希望客户”：成功投保=-1、下次回访=起保+335天 —— 
                if (selectedDetail?.id != null) {
                    const updatedCustomer = {
                        ...selectedDetail,
                        insuredCount: -1 as number,
                        scheduleFollowUpDate: addDaysPlain(startDate, 335),
                    };
                    try {
                        const res2 = await updatePotentialCustomer(updatedCustomer);
                        const saved = res2.data ?? updatedCustomer;

                        // 同步 UI
                        setSelectedDetail(saved);
                        setMyList(list => list.map(i => (i.id === saved.id ? saved : i)));
                        setAllList(list => list.map(i => (i.id === saved.id ? saved : i)));
                    } catch (err) {
                        console.error(err);
                        alert("保单已保存，但同步更新希望客户（成功投保/下次回访）失败，请稍后在希望客户页手动修改。");
                    }
                }

                alert("出单成功！");
                setCreateModalVisible(false);
            } catch (err) {
                console.error(err);
                alert("出单失败，请稍后再试");
            } finally {
                // —— 7) 统一释放锁与 in-flight 标记（无论成功/失败/早退）——
                inflightCreateRef.current.delete(idemKey);
                setCreateSubmitting(false);
            }
        },
        [
            createForm,
            insuranceCompanies,
            selectedDetail,
            createSubmitting,
            setCreateSubmitting,
            setCreateModalVisible,
            setSelectedDetail,
            setMyList,
            setAllList
        ]
    );

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

    // 3. 查询逻辑

    // ① 页面初始化：进入页面时自动查询希望客户列表
    useEffect(() => {
        // 首屏：查“自己”的客户，限定 insuredCount ≥ 1，分页一次 1000 条，按 id desc
        fetchPage(1, {
            filtersOverride: {
                salesAgent: currentUserName,
                minInsuredCount: 0,   // ✨ 关键：首屏只要有保单的客户
            },
            customFiltersOverride: [
                { field: "scheduleFollowUpDate", op: "=", value: today }  // ✅ 新增条件
            ],
            sizeOverride: 1000,
            sortOverride: "insuredCount,desc",
        });
        // 如果你的 fetchPage 会缓存/复用上次 filters，后续翻页就会自动带上 minInsuredCount
    }, [currentUserName]);


    // ② 详情页：当选中客户发生变化时，查询该客户的回访记录
    useEffect(() => {
        if (selectedDetail?.id) {
            fetchFollowUpPotentialList(selectedDetail.id).then(res => {
                setFollowUpList(res.data || []); // 保证是数组
            });
        } else {
            setFollowUpList([]);
        }
    }, [selectedDetail?.id]);

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

    // 1) 按记录日期查询：改为分页调用
    const handleRecordDateSearch = () => {
        if (!query.recordTimeStart || !query.recordTimeEnd) {
            alert("请输入完整记录日期");
            return;
        }
        const recordStart = dayjs(query.recordTimeStart).startOf("day").format("YYYY-MM-DD HH:mm:ss");
        const recordEnd = dayjs(query.recordTimeEnd).endOf("day").format("YYYY-MM-DD HH:mm:ss");

        // ✅ 点“查询”前：清空所有筛选的本地状态（不会改你的“上一份查询条件”的 filters）
        setCustomFilters([]);
        setSelectedFollowUpCount('');
        setNeverFollowUp(false);
        setFilters({ signed: false, notSigned: false, currentSigned: false, currentNotSigned: false, scheduled: false, notScheduledOrExpired: false });

        // ✅ 同时把 customFiltersOverride 显式置空，确保这次查询不叠加旧筛选
        fetchPage(1, {
            filtersOverride: {
                recordTimeStart: recordStart,
                recordTimeEnd: recordEnd,
                salesAgent: isNormalUser ? currentUserName : undefined,
            } as any,
            customFiltersOverride: [],   // ← 关键
        });
    };

    // 2) 综合查询：同样改为分页调用
    const handleComprehensiveSearch = () => {
        if (!query.recordTimeStart || !query.recordTimeEnd || !query.policyStartDateStart || !query.policyStartDateEnd) {
            alert("请输入完整记录日期和起保日期");
            return;
        }
        const recordStart = dayjs(query.recordTimeStart).startOf("day").format("YYYY-MM-DD HH:mm:ss");
        const recordEnd = dayjs(query.recordTimeEnd).endOf("day").format("YYYY-MM-DD HH:mm:ss");
        const policyStart = dayjs(query.policyStartDateStart).startOf("day").format("YYYY-MM-DD HH:mm:ss");
        const policyEnd = dayjs(query.policyStartDateEnd).endOf("day").format("YYYY-MM-DD HH:mm:ss");

        // ✅ 清空筛选UI和 customFilters
        setCustomFilters([]);
        setSelectedFollowUpCount('');
        setNeverFollowUp(false);
        setFilters({ signed: false, notSigned: false, currentSigned: false, currentNotSigned: false, scheduled: false, notScheduledOrExpired: false });

        // ✅ customFiltersOverride 显式传空
        fetchPage(1, {
            filtersOverride: {
                recordTimeStart: recordStart,
                recordTimeEnd: recordEnd,
                policyStartDateStart: policyStart,
                policyStartDateEnd: policyEnd,
                salesAgent: isNormalUser ? currentUserName : undefined,
            } as any,
            customFiltersOverride: [],   // ← 关键
        });
    };

    // 4. 筛选按钮
    const handleFilterBtn = (key: keyof typeof filters) => {
        const nextFlag = !filters[key];

        // ① 清空并只保留当前项的选中状态
        const base = {
            signed: false, notSigned: false,
            currentSigned: false, currentNotSigned: false,
            scheduled: false, notScheduledOrExpired: false,
        };
        setFilters({ ...base, [key]: nextFlag });

        // ② 覆盖式生成 customFilters
        if (!nextFlag) {
            applySingleFilter(null);
            return;
        }

        if (key === 'signed') return applySingleFilter({ field: 'insuredCount', op: '>' as Op, value: '0' });
        if (key === 'notSigned') return applySingleFilter({ field: 'insuredCount', op: '=' as Op, value: '0' });
        if (key === 'scheduled') return applySingleFilter({ field: 'scheduleFollowUpDate', op: 'not like' as Op, value: '' });

        // TODO: currentSigned/currentNotSigned/notScheduledOrExpired
        // - 若后端有专用布尔，建议走 filtersOverride；
        // - 若用日期比较表达（如 “< 今天”），同样只生成一条并 applySingleFilter(...)
    };

    const [filterField, setFilterField] = useState("");
    const [filterOperator, setFilterOperator] = useState<Op>('=');
    const [filterValue, setFilterValue] = useState("");

    const [customFilters, setCustomFilters] = useState<CustomFilter[]>([]);

    type FiltersPayload = ReturnType<typeof buildFilters> & { minInsuredCount?: number };

    const [lastFilters, setLastFilters] = useState<FiltersPayload>(() => buildFilters());
    const [lastCustomFilters, setLastCustomFilters] = useState<CustomFilter[]>([]);
    const [lastSize, setLastSize] = useState<number>(size);
    const [lastSort, setLastSort] = useState<string>("id,desc");

    const excludedFilterFields = [
        "firstFollowUpDate",
        "secondFollowUpDate",
        "thirdFollowUpDate",
        "fourFollowUpDate",
        "fiveFollowUpDate",
        "sixFollowUpDate",
        "sevenFollowUpDate",
        "eightFollowUpDate",
        "nineFollowUpDate",
        "tenFollowUpDate",
        "elevenFollowUpDate",
        "twelveFollowUpDate",
        "thirteenFollowUpDate",
        "fourteenFollowUpDate",
        "fifteenFollowUpDate",
        "firstFollowUpNote",
        "secondFollowUpNote",
        "thirdFollowUpNote",
        "fourFollowUpNote",
        "fiveFollowUpNote",
        "sixFollowUpNote",
        "sevenFollowUpNote",
        "eightFollowUpNote",
        "nineFollowUpNote",
        "tenFollowUpNote",
        "elevenFollowUpNote",
        "twelveFollowUpNote",
        "thirteenFollowUpNote",
        "fourteenFollowUpNote",
        "fifteenFollowUpNote"
    ];

    const isDateField = dateFields.has(filterField);

    const fieldOptions = Object.entries(fieldNameMap)
        .filter(([key]) => !excludedFilterFields.includes(key))
        .map(([key, label]) => ({
            value: key,
            label
        }));

    // 5. 下次回访日期查询
    const handleFollowUpDateQuery = async () => {
        if (!followUpDateQuery) {
            alert("请选择下次预约回访日期");
            return;
        }
        try {
            const res = await fetchByFollowUpDate(followUpDateQuery, currentUserName);
            const sorted = (res.data || []).sort(
                (a, b) => (b.insuredCount ?? 0) - (a.insuredCount ?? 0)
            );
            setAllList(sorted);
            setMyList(sorted);
            setShowList(true);
        } catch (err: any) {
            alert("预约查询失败: " + (err.message || "未知错误"));
        }
    };

    const handleFollowUpCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setSelectedFollowUpCount(val);
        applySingleFilter(val ? { field: 'followUpCount', op: '=' as Op, value: String(val) } : null);
    };

    const handleNeverFollowUpChange = () => {
        const newVal = !neverFollowUp;
        setNeverFollowUp(newVal);
        applySingleFilter(newVal ? { field: 'firstFollowUpNote', op: 'like' as Op, value: '' } : null);
    };

    // 点击筛选按钮：仅保留本次条件
    const handleCustomFilter = () => {
        if (!filterField || !filterOperator || filterValue === "") return;
        applySingleFilter({
            field: filterField,
            op: filterOperator as Op,
            value: String(filterValue),
        });
    };

    // 重置按钮：清空所有自定义筛选并重新拉第一页
    const handleResetFilters = () => {
        // ① 清 UI
        setFilters({
            signed: false, notSigned: false,
            currentSigned: false, currentNotSigned: false,
            scheduled: false, notScheduledOrExpired: false,
        });
        setSelectedFollowUpCount('');
        setNeverFollowUp(false);
        setFilterField(''); setFilterOperator('=' as Op); setFilterValue('');
        setCustomFilters([]);

        // ② 重置“上一份”缓存为你的默认首屏（按需调整）
        const DEFAULT_FILTERS: FiltersPayload = { salesAgent: currentUserName, minInsuredCount: 0 };
        const DEFAULT_SIZE = 1000;
        const DEFAULT_SORT = "insuredCount,desc";

        setLastFilters(DEFAULT_FILTERS);
        setLastCustomFilters([]);
        setLastSize(DEFAULT_SIZE);
        setLastSort(DEFAULT_SORT);

        // ③ 真正以默认值重新拉第一页
        fetchPage(1, {
            filtersOverride: DEFAULT_FILTERS,
            customFiltersOverride: [],
            sizeOverride: DEFAULT_SIZE,
            sortOverride: DEFAULT_SORT,
        });
    };

    function getEmptyPotentialCustomer(): PotentialCustomer {
        return {
            insuredCount: null,
            licensePlate: "",
            vehicleModel: "",
            policyStartDate: "",
            registrationOwner: "",
            phone: "",
            firstRegistrationDate: null,
            deliveryAddress: "",
            registrationOwnerId: "",
            vinNumber: "",
            engineNumber: "",
            recordTime: getNowDateTime(),
            insuranceCompany: "",
            note: "",
            note2: "",
            salesAgent: isNormalUser ? currentUserName : "",
            hierarchyCode: isNormalUser ? (userInfo.hierarchyCode || "") : "",
            scheduleFollowUpDate: dayjs().add(1, "day").format("YYYY-MM-DD"),
            id: null,
            followUpCount: null,
            previousSignDate: null,
            insuredName: "",
            insuredIdNumber: "",
        }
    }

    const handleOpenHistory = async () => {
        if (!selectedDetail) {
            alert("请先在左侧列表选中一个希望客户");
            return;
        }
        const licensePlate = (selectedDetail.licensePlate || "").trim();
        const vinNumber = (selectedDetail.vinNumber || "").trim();

        if (!licensePlate || !vinNumber) {
            alert("缺少【车牌号】或【车架号】，无法查询投保历史");
            return;
        }

        try {
            setHistoryLoading(true);
            const res = await fetchInsuranceHistory({ licensePlate, vinNumber });
            // 如果后端字段名与你弹窗展示不一致，这里做一次映射
            const rows = (res?.data || []).map((x: any) => ({
                licensePlate: x.licensePlate ?? licensePlate,
                vinNumber: x.vinNumber ?? vinNumber,
                insuredName: x.insuredName ?? x.registrationOwner ?? "",
                insuredDate: (x.insuredDate || x.policyStartDate || "").slice(0, 10),
                insuranceCompany: x.insuranceCompany ?? "",
                agent: x.salesAgent ?? x.agent ?? "",
            }));
            setInsuranceHistory(rows);
            setHistoryModalVisible(true);
        } catch (err: any) {
            console.error(err);
            alert("查询投保历史失败：" + (err?.message || "未知错误"));
        } finally {
            setHistoryLoading(false);
        }
    };

    // === 6. 渲染相关函数 ===
    // === 新增/编辑按钮组 ===
    const renderButtonGroup = () => (
        <div className={styles.buttonGroupBox}>
            {/* 下次回访日期选择和保存 */}
            <input
                type="date"
                value={nextFollowUpDate}
                onChange={e => setNextFollowUpDate(e.target.value)}
                className={styles.dateInput}
                style={{ width: 140, marginRight: 6 }}
            />
            <button
                className={`btn btn-success btn-sm`}
                style={{ marginRight: 6, minWidth: 94 }}
                onClick={async () => {
                    if (!nextFollowUpDate || !selectedDetail) return;
                    const updated = { ...selectedDetail, scheduleFollowUpDate: nextFollowUpDate || "" };
                    try {
                        const res = await updatePotentialCustomer(updated);
                        const saved = res.data;
                        setSelectedDetail(saved);
                        setMyList(list => list.map(item => item.id === saved.id ? saved : item));
                        setAllList(list => list.map(item => item.id === saved.id ? saved : item));
                        alert("下次回访日期已保存！");
                    } catch (err: any) {
                        alert("保存失败：" + (err.message || "未知错误"));
                    }
                }}
            >
                保存下次回访
            </button>

            {/* 编辑按钮 */}
            <button
                className={`btn btn-outline-success btn-sm`}
                style={{ marginRight: 6, minWidth: 70 }}
                onClick={() => {
                    setEditForm(selectedDetail);
                    // 关键：计算初始空date下标，只看编辑前的数据
                    const idx = followUpDateFields.findIndex(f => !(selectedDetail as any)[f]);
                    setInitialFirstEmptyDateIdx(idx === -1 ? followUpDateFields.length : idx); // 没有空就等于length
                    setEditModalVisible(true);
                }}
            >
                编辑
            </button>

            {/* 投保历史 */}
            <button
                className={`btn btn-outline-primary btn-sm`}
                style={{ marginRight: 6, minWidth: 85 }}
                onClick={handleOpenHistory}
            >
                投保历史
            </button>

            {/* 提交出单 */}
            <button
                className={`btn btn btn-primary btn-sm`}
                style={{ minWidth: 85, marginRight: 6 }}
                onClick={() => {
                    if (!selectedDetail) return;

                    let detailForSubmit: any = { ...selectedDetail };

                    if (isNormalUser && userInfo.manager?.displayName) {
                        detailForSubmit.salesManager = userInfo.manager.displayName;
                    }

                    if ((isSuperAdmin || isAdmin) && selectedDetail?.salesAgent) {
                        const matchedAgent = userList.find(u => u.displayName === selectedDetail.salesAgent);
                        if (matchedAgent?.manager?.displayName) {
                            detailForSubmit.salesManager = matchedAgent.manager.displayName;
                        }
                    }

                    const form = initInsuranceForm(detailForSubmit, userInfo, isSuperAdmin, isAdmin);
                    form.receivablePremium = calcReceivablePremium(form);

                    // ★ 投保人/被保险人 字段自动回填（规则：被保险人优先 → 车主兜底）
                    const pick = (first?: any, fallback?: any) => {
                        const a = (first ?? "").toString().trim();
                        if (a) return a;
                        const b = (fallback ?? "").toString().trim();
                        return b || "";
                    };
                    form.inputDate = getTodayDate();
                    form.signingDate = "";
                    // 被保险人及其证件号（为空则回落到车主）
                    form.insuredName = pick(detailForSubmit.insuredName, detailForSubmit.registrationOwner);
                    form.insuredIdNumber = pick(detailForSubmit.insuredIdNumber, detailForSubmit.registrationOwnerId);

                    // 投保人及其证件号（被保险人优先，为空则回落到车主）
                    form.applicantName = pick(detailForSubmit.insuredName, detailForSubmit.registrationOwner);
                    form.applicantIdNumber = pick(detailForSubmit.insuredIdNumber, detailForSubmit.registrationOwnerId);


                    setCreateForm(form);
                    setCreateModalVisible(true);
                }}
            >
                提交出单
            </button>


            <button
                className="btn btn-warning btn-sm"
                style={{
                    marginRight: 6,
                    minWidth: 100,
                    opacity: todayFollowUp ? 0.4 : 1,
                    pointerEvents: todayFollowUp ? 'none' : 'auto'
                }}
                disabled={!!todayFollowUp}
                onClick={() => {
                    setFollowUpContent("");
                    setFollowUpEditMode("add");
                    setEditingFollowUpId(null);
                    setFollowUpModalVisible(true);
                }}
            >
                新增回访
            </button>

            {SHOW_EDIT_TODAY && (
                <button
                    className="btn btn-outline-warning btn-sm"
                    style={{ marginRight: 6, minWidth: 120 }}
                    onClick={() => {
                        setFollowUpContent(todayFollowUp?.content || "");
                        setEditingFollowUpId(todayFollowUp?.index || null);
                        setFollowUpEditMode("edit");
                        setFollowUpModalVisible(true);
                    }}
                >
                    编辑今日回访
                </button>
            )}

        </div>
    );

    // 7. 渲染函数（可根据你实际需求调整字段显示）
    return (
        <div className="container mt-0" style={{ width: "100%", minWidth: "1200px" }}>
            <div className="row">
                {/* 左侧 查询与筛选 */}
                <div className="col-md-4">
                    <div className={styles.queryFormCard}>
                        {/* 查询条件 */}
                        <div className={styles.queryForm}>
                            <div className={styles.queryRow}>
                                <label className={styles.queryLabel}>记录日期</label>
                                <input
                                    type="date"
                                    name="recordTimeStart"
                                    value={query.recordTimeStart}
                                    onChange={e => setQuery(q => ({ ...q, recordTimeStart: e.target.value }))}
                                    className={`form-control form-control-sm ${styles.queryInput}`}
                                />
                                <span className={styles.queryText}>至</span>
                                <input
                                    type="date"
                                    name="recordTimeEnd"
                                    value={query.recordTimeEnd}
                                    onChange={e => setQuery(q => ({ ...q, recordTimeEnd: e.target.value }))}
                                    className={`form-control form-control-sm ${styles.queryInput}`}
                                />
                            </div>
                            <div className={styles.queryRow}>
                                <label className={styles.queryLabel}>起保日期</label>
                                <input
                                    type="date"
                                    name="policyStartDateStart"
                                    value={query.policyStartDateStart}
                                    onChange={e => setQuery(q => ({ ...q, policyStartDateStart: e.target.value }))}
                                    className={`form-control form-control-sm ${styles.queryInput}`}
                                />
                                <span className={styles.queryText}>至</span>
                                <input
                                    type="date"
                                    name="policyStartDateEnd"
                                    value={query.policyStartDateEnd}
                                    onChange={e => setQuery(q => ({ ...q, policyStartDateEnd: e.target.value }))}
                                    className={`form-control form-control-sm ${styles.queryInput}`}
                                />
                            </div>
                            <div className={styles.queryRow}>
                                <button
                                    className={`btn btn-success btn-sm ${styles.queryBtn}`}
                                    onClick={() => {
                                        // 构造空白客户对象
                                        setEditForm(getEmptyPotentialCustomer());
                                        setEditModalVisible(true);
                                    }}
                                >
                                    新增希望客户
                                </button>
                                <button
                                    className={`btn btn-success btn-sm ${styles.queryBtn}`}
                                    onClick={handleRecordDateSearch}
                                >
                                    按记录日期查询
                                </button>
                                <button
                                    className={`btn btn-success btn-sm ${styles.queryBtn}`}
                                    onClick={handleComprehensiveSearch}
                                >
                                    综合查询
                                </button>
                            </div>

                            {/* 新增：下次预约回访查询 */}
                            <div className={styles.queryRow} style={{ marginTop: 8 }}>
                                <label className={styles.queryLabel}>下次预约回访日期</label>
                                <input
                                    type="date"
                                    value={followUpDateQuery}
                                    onChange={e => setFollowUpDateQuery(e.target.value)}
                                    className={`form-control form-control-sm ${styles.queryInput}`}
                                    style={{ width: 120 }}
                                />
                                <button
                                    className={`btn btn-outline-success btn-sm ${styles.queryBtn}`}
                                    onClick={handleFollowUpDateQuery}
                                    style={{ width: 80 }}
                                >
                                    预约查询
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 筛选区 */}
                    <div className={`card-body ${styles.filterBox}`}>
                        {/* 第一行 */}
                        <div className={styles.filterRow}>
                            <label className={styles.filterCheckboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={filters.signed}
                                    onChange={() => handleFilterBtn("signed")}
                                    className={styles.filterCheckbox}
                                />
                                已投保
                            </label>
                            <label className={styles.filterCheckboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={filters.currentSigned}
                                    onChange={() => handleFilterBtn("currentSigned")}
                                    className={styles.filterCheckbox}
                                />
                                当期已投保
                            </label>
                            <label className={styles.filterCheckboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={filters.scheduled}
                                    onChange={() => handleFilterBtn("scheduled")}
                                    className={styles.filterCheckbox}
                                />
                                已预约
                            </label>
                        </div>
                        {/* 第二行 */}
                        <div className={styles.filterRow}>
                            <label className={styles.filterCheckboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={filters.notSigned}
                                    onChange={() => handleFilterBtn("notSigned")}
                                    className={styles.filterCheckbox}
                                />
                                未投保
                            </label>

                            <label className={styles.filterCheckboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={filters.currentNotSigned}
                                    onChange={() => handleFilterBtn("currentNotSigned")}
                                    className={styles.filterCheckbox}
                                />
                                当期未投保
                            </label>
                            <label className={styles.filterCheckboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={filters.notScheduledOrExpired}
                                    onChange={() => handleFilterBtn("notScheduledOrExpired")}
                                    className={styles.filterCheckbox}
                                />
                                未预约或过期
                            </label>
                        </div>
                        <div className={styles.filterRow} style={{ gap: 5 }}>
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
                                onChange={e => setFilterOperator(e.target.value as Op)}
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
                            <button
                                className={`btn btn-outline-success btn-sm ${styles.filterBtn}`}
                                onClick={handleCustomFilter}
                            >筛选</button>
                        </div>


                        <div className={styles.filterRow}>
                            {/* 下拉选框 */}
                            <select
                                className={styles.filterSelect}
                                value={selectedFollowUpCount}
                                onChange={handleFollowUpCountChange}
                                style={{ width: 120, marginRight: 12 }}
                            >
                                <option value="">选择回访次数</option>
                                {Array.from({ length: 15 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                                ))}
                            </select>

                            {/* 未回访多选框 */}
                            <label className={styles.filterCheckboxLabel} style={{ marginTop: 8 }}>
                                <input
                                    type="checkbox"
                                    checked={neverFollowUp}
                                    onChange={handleNeverFollowUpChange}
                                    className={styles.filterCheckbox}
                                />
                                未回访
                            </label>

                            {/* 重置按钮 */}
                            <button
                                className={`btn btn-outline-secondary btn-sm ${styles.filterBtn}`}
                                onClick={handleResetFilters}
                            >
                                重置筛选
                            </button>
                        </div>

                    </div>


                    {/* 查询结果列表 */}
                    {showList && (
                        myList.length === 0 ? (
                            <div style={{ padding: "28px 0", textAlign: "center", color: "#bbb" }}>
                                暂无查询结果
                            </div>
                        ) : (
                            <div style={{ maxHeight: 360, overflowY: "auto", position: "relative" }}>
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
                                <table className={styles.queryResultTable}>
                                    <thead>
                                        <tr>
                                            {["#", "成功", "车牌号", "车主", "起保日期", "厂牌型号"].map((title, idx) => (
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
                                                style={{ cursor: "pointer" }}
                                                onClick={() => {
                                                    setSelectedDetail(item);   // 设置详情
                                                    setSelectedIndex(idx);     // 保存当前索引
                                                }}
                                                className={
                                                    selectedDetail?.id === item.id
                                                        ? styles.selectedRow
                                                        : ""
                                                }
                                            >
                                                <td>{idx + 1}</td>
                                                <td>{item.insuredCount}</td>
                                                <td>{item.licensePlate}</td>
                                                <td>{item.registrationOwner}</td>
                                                <td>{item.policyStartDate ? String(item.policyStartDate).slice(0, 10) : ""}</td>
                                                <td>{item.vehicleModel}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {showList && myList.length > 0 && (
                                    <div style={{
                                        position: 'sticky',
                                        bottom: 0,
                                        zIndex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        padding: '5px 3px',
                                        borderTop: '1px solid #eef3fc',
                                        background: '#fff',      // 或者 'inherit'，看你左侧背景
                                    }}>
                                        <button
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={onPrev}
                                            disabled={page <= 1}
                                        >
                                            上
                                        </button>
                                        <span style={{ margin: "0 8px" }}>
                                            第{page}/{totalPages}页，共{total}条
                                        </span>
                                        <button
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={onNext}
                                            disabled={page >= totalPages}
                                        >
                                            下
                                        </button>
                                        <form onSubmit={onJumpSubmit} style={{ display: "inline-block", marginLeft: 10 }}>
                                            <input
                                                type="number"
                                                value={pageInput}
                                                onChange={(e) => setPageInput(e.target.value)}
                                                style={{ width: 50 }}
                                            />
                                            <button className="btn btn-sm btn-outline-secondary" type="submit">
                                                跳转
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        )
                    )}

                </div>

                <div
                    className="col-md-8"
                    style={{
                        maxHeight: 'calc(100vh - 80px)', // 80px可适当大于topBar高度
                        overflowY: 'auto',
                        minHeight: '300px'
                    }}
                >
                    {/* 右侧 详情 */}
                    {selectedDetail && (
                        <div>
                            {/* 按钮组 */}
                            {renderButtonGroup()}
                            {(() => {
                                const visibleEntries: [string, any][] = detailFieldOrder
                                    .filter(key => !hiddenFieldsForAll.includes(key))
                                    .map(key => [key, selectedDetail[key as keyof PotentialCustomer]]);
                                const grouped = groupEntriesInPairs(visibleEntries);

                                return (
                                    <table className={`table table-bordered table-hover ${styles.customTable}`}>
                                        <tbody>
                                            {grouped.map((pair, rowIdx) => {
                                                const [[key1, value1], [key2, value2] = []] = pair;
                                                return (
                                                    <tr key={key1}>
                                                        <th style={{ width: 110 }}>{fieldNameMap[key1] || key1}</th>
                                                        {key2 ? (
                                                            <>
                                                                <td>
                                                                    {selectedDetail[key1 as keyof PotentialCustomer] ?? ""}
                                                                </td>
                                                                <th style={{ width: 110 }}>{fieldNameMap[key2] || key2}</th>
                                                                <td>
                                                                    {selectedDetail[key2 as keyof PotentialCustomer] ?? ""}
                                                                </td>
                                                            </>
                                                        ) : (
                                                            // 单字段一行（备注专用，合并3列）
                                                            <td colSpan={3}>
                                                                {key1 === "note" ? (
                                                                    <div
                                                                        style={{
                                                                            whiteSpace: "nowrap",
                                                                            overflow: "hidden",
                                                                            textOverflow: "ellipsis",
                                                                            cursor: "pointer",
                                                                            minHeight: 28,
                                                                            color: "#49597b"
                                                                        }}
                                                                        title={selectedDetail.note ?? ""}
                                                                        onClick={() => {
                                                                            setCommentEditValue(selectedDetail.note ?? "");
                                                                            setShowCommentModal(true);
                                                                        }}
                                                                    >
                                                                        {selectedDetail.note || <span style={{ color: "#bbb" }}>暂无备注</span>}
                                                                        <span style={{ marginLeft: 10, color: "#198cff", fontSize: 12 }}>📝点击编辑</span>
                                                                    </div>
                                                                ) : (
                                                                    selectedDetail[key1 as keyof PotentialCustomer] ?? ""
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

                            {/* 回访信息表格 */}
                            <div className={styles.followUpTableWrapper}>
                                <table className={styles.followUpTable}>
                                    <thead>
                                        <tr>
                                            <th style={{ width: "10%" }}>序号</th>
                                            <th style={{ width: "70%" }}>回访信息</th>
                                            <th style={{ width: "20%" }}>时间</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {followUpList.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className={styles.followUpEmpty}>暂无回访信息</td>
                                            </tr>
                                        ) : (
                                            [...followUpList]   // 先复制，避免直接修改 state
                                                .sort((a, b) => b.index - a.index)  // 按 index 倒序
                                                .map(item => (
                                                    <tr key={item.index}>
                                                        <td>{item.index}</td>
                                                        <td style={{ whiteSpace: "pre-line", textAlign: "left" }}>{item.content}</td>
                                                        <td>{item.date}</td>
                                                    </tr>
                                                ))
                                        )}
                                    </tbody>
                                </table>
                            </div>


                            {/* 备注编辑弹窗 */}
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
                                                    try {
                                                        // 这里用你的实际接口
                                                        await updatePotentialCustomer({
                                                            ...selectedDetail,
                                                            note: commentEditValue
                                                        });
                                                        setSelectedDetail(prev =>
                                                            prev ? { ...prev, note: commentEditValue } : prev
                                                        );
                                                        setMyList(list =>
                                                            list.map(item =>
                                                                item.id === selectedDetail.id
                                                                    ? { ...item, note: commentEditValue }
                                                                    : item
                                                            )
                                                        );
                                                        setAllList(list =>
                                                            list.map(item =>
                                                                item.id === selectedDetail.id
                                                                    ? { ...item, note: commentEditValue }
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
                        </div>
                    )}
                </div>

                {editModalVisible && editForm && (
                    <div className={styles.customModalOverlay}>
                        <div className={styles.customModal}>
                            {historyLoading && <div style={{ color: "#888", marginBottom: 8 }}>查询中…</div>}
                            <h4 style={{ marginBottom: 0 }}>
                                {editForm.id != null ? "编辑希望客户" : "新增希望客户"}
                            </h4>
                            <form
                                onSubmit={async e => {
                                    e.preventDefault();
                                    if (!editForm) return;

                                    // 1. 必填字段（字段名和中文名都与你的fieldNameMap严格一致）
                                    const requiredFields = [
                                        { key: "licensePlate", label: "车牌号" },
                                        { key: "registrationOwner", label: "车主" },
                                        { key: "phone", label: "电话" },
                                        { key: "scheduleFollowUpDate", label: "下次回访时间" },
                                        { key: "policyStartDate", label: "起保日期" },
                                    ];

                                    // 2. 检查哪些字段为空
                                    const missingFields = requiredFields.filter(({ key }) => {
                                        // 推荐：用 as keyof PotentialCustomer 保证类型安全
                                        const v = editForm[key as keyof PotentialCustomer];
                                        return !v || String(v).trim() === "";
                                    });

                                    if (missingFields.length > 0) {
                                        alert(
                                            "以下字段不能为空：\n" +
                                            missingFields.map(f => f.label).join("、")
                                        );
                                        return; // 阻止提交
                                    }

                                    if (editForm.id != null) {
                                        // ---- 编辑 ----
                                        try {
                                            const res = await updatePotentialCustomer(editForm);
                                            const updated = res.data;
                                            setMyList(list => list.map(item => item.id === updated.id ? updated : item));
                                            setAllList(list => list.map(item => item.id === updated.id ? updated : item));
                                            setSelectedDetail(updated);
                                            setEditModalVisible(false);
                                            alert("保存成功！");
                                        } catch (err: any) {
                                            alert("保存失败：" + (err.message || "未知错误"));
                                        }
                                    } else {
                                        // ---- 新增 ----
                                        try {
                                            const res = await addPotentialCustomer(editForm);
                                            const newCustomer = res.data;
                                            setMyList(list => [newCustomer, ...list]);
                                            setAllList(list => [newCustomer, ...list]);
                                            setSelectedDetail(newCustomer);
                                            setEditModalVisible(false);
                                            alert("新增成功！");
                                        } catch (err: any) {
                                            alert("新增失败：" + (err.message || "未知错误"));
                                        }
                                    }
                                }}
                            >
                                {/* -------- renderInput 单独定义在这里 -------- */}
                                {(() => {
                                    const isDateField = (key: string) => key.endsWith("Date");
                                    const isTimeField = (key: string) => key.endsWith("Time");
                                    const renderInput = (key: string, value: any, fieldName?: string) => {
                                        if (key === "salesAgent") {
                                            if (isSuperAdmin || isAdmin) {
                                                return (
                                                    <AgentSelectInput
                                                        value={value ?? ""}
                                                        userList={userList}
                                                        onPick={(u, typed) =>
                                                            setEditForm(prev => {
                                                                if (!prev) return prev;
                                                                return {
                                                                    ...prev,
                                                                    salesAgent: u ? u.displayName : typed,
                                                                    hierarchyCode: u?.hierarchyCode ? String(u.hierarchyCode) : ""
                                                                };
                                                            })
                                                        }
                                                    />
                                                );
                                            } else {
                                                if (editForm?.hierarchyCode !== userInfo.hierarchyCode) {
                                                    setEditForm(prev => prev ? { ...prev, salesAgent: currentUserName, hierarchyCode: userInfo.hierarchyCode } : prev);
                                                }
                                                return (
                                                    <input
                                                        name={fieldName || key}
                                                        type="text"
                                                        className={`${styles.editInput} form-control`}
                                                        value={currentUserName}
                                                        disabled
                                                        readOnly
                                                    />
                                                );
                                            }
                                        }

                                        // 层级码：只读
                                        if (key === "hierarchyCode") {
                                            return (
                                                <input
                                                    name={fieldName || key}
                                                    type="text"
                                                    className={`${styles.editInput} form-control`}
                                                    value={value ?? ""}
                                                    disabled
                                                    readOnly
                                                />
                                            );
                                        }

                                        // id 不可编辑
                                        if (key === "id") {
                                            return (
                                                <input
                                                    name={fieldName || key}
                                                    type="text"
                                                    value={value ?? ""}
                                                    disabled
                                                    className={styles.editInput}
                                                />
                                            );
                                        }

                                        // 记录时间：锁死为只读
                                        if (key === "recordTime") {
                                            return (
                                                <input
                                                    name={fieldName || key}
                                                    type="text"
                                                    className={`${styles.editInput} form-control`}
                                                    value={value ?? ""}
                                                    disabled
                                                    readOnly
                                                />
                                            );
                                        }

                                        // 回访时间：全部只读
                                        if (followUpDateFields.includes(key)) {
                                            return (
                                                <input
                                                    name={fieldName || key}
                                                    type="date"
                                                    className={`${styles.editInput} form-control`}
                                                    value={value ? String(value).slice(0, 10) : ""}
                                                    disabled
                                                    readOnly
                                                />
                                            );
                                        }

                                        // 回访内容：控制是否可编辑
                                        if (followUpNoteFields.includes(key)) {
                                            const idx = followUpNoteFields.indexOf(key);
                                            const dateField = followUpDateFields[idx];

                                            if (!editForm?.id) {
                                                const canEdit = idx === 0;
                                                return (
                                                    <input
                                                        name={fieldName || key}
                                                        type="text"
                                                        className={`${styles.editInput} form-control`}
                                                        value={value ?? ""}
                                                        disabled={!canEdit}
                                                        onChange={e => {
                                                            const inputVal = e.target.value;
                                                            setEditForm(prev => {
                                                                if (!prev) return prev;
                                                                const updated = { ...prev, [key]: inputVal };
                                                                if (canEdit && inputVal && !(prev as any)[dateField]) {
                                                                    (updated as any)[dateField] = getTodayDate();
                                                                }
                                                                return updated;
                                                            });
                                                        }}
                                                    />
                                                );
                                            }

                                            const canEdit =
                                                idx < initialFirstEmptyDateIdx || idx === initialFirstEmptyDateIdx;
                                            return (
                                                <input
                                                    name={fieldName || key}
                                                    type="text"
                                                    className={`${styles.editInput} form-control`}
                                                    value={value ?? ""}
                                                    disabled={!canEdit}
                                                    onChange={e => {
                                                        const inputVal = e.target.value;
                                                        setEditForm(prev => {
                                                            if (!prev) return prev;
                                                            const updated = { ...prev, [key]: inputVal };
                                                            if (
                                                                canEdit &&
                                                                idx === initialFirstEmptyDateIdx &&
                                                                inputVal &&
                                                                !(prev as any)[dateField]
                                                            ) {
                                                                (updated as any)[dateField] = getTodayDate();
                                                            }
                                                            return updated;
                                                        });
                                                    }}
                                                />
                                            );
                                        }

                                        // 普通日期
                                        if (key.endsWith("Date")) {
                                            return (
                                                <input
                                                    name={fieldName || key}
                                                    type="date"
                                                    className={`${styles.editInput} form-control`}
                                                    value={value ?? ""}
                                                    onPaste={(e) => {
                                                        e.preventDefault();
                                                        const text = e.clipboardData.getData("text").trim();

                                                        // 统一分隔符
                                                        let norm = text.replace(/[./\s]/g, "-");

                                                        // 纯8位数字 -> YYYY-MM-DD
                                                        if (/^\d{8}$/.test(norm)) {
                                                            norm = norm.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
                                                        }

                                                        let parsed: string | null = null;

                                                        // 情况1：YYYY-M-D / YYYY-MM-DD
                                                        if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(norm)) {
                                                            let [y, m, d] = norm.split("-");
                                                            const yy = String(y).padStart(4, "0");
                                                            const mm = String(Number(m)).padStart(2, "0");
                                                            const dd = String(Number(d)).padStart(2, "0");

                                                            // 校验日期合法性
                                                            const tmp = new Date(Number(yy), Number(mm) - 1, Number(dd));
                                                            if (!isNaN(tmp.getTime()) &&
                                                                tmp.getFullYear() === Number(yy) &&
                                                                tmp.getMonth() === Number(mm) - 1 &&
                                                                tmp.getDate() === Number(dd)) {
                                                                parsed = `${yy}-${mm}-${dd}`; // ★ 保持本地字符串，不走 UTC
                                                            }
                                                        }

                                                        // 情况2：D-M-YYYY / DD-MM-YYYY
                                                        if (!parsed && /^\d{1,2}-\d{1,2}-\d{4}$/.test(norm)) {
                                                            let [d, m, y] = norm.split("-");
                                                            const yy = String(y).padStart(4, "0");
                                                            const mm = String(Number(m)).padStart(2, "0");
                                                            const dd = String(Number(d)).padStart(2, "0");

                                                            const tmp = new Date(Number(yy), Number(mm) - 1, Number(dd));
                                                            if (!isNaN(tmp.getTime()) &&
                                                                tmp.getFullYear() === Number(yy) &&
                                                                tmp.getMonth() === Number(mm) - 1 &&
                                                                tmp.getDate() === Number(dd)) {
                                                                parsed = `${yy}-${mm}-${dd}`; // ★ 同上
                                                            }
                                                        }

                                                        if (parsed) {
                                                            setEditForm((prev) => (prev ? { ...prev, [key]: parsed } : prev));
                                                        } else {
                                                            alert("日期格式应为 YYYY-MM-DD / YYYY/MM/DD / YYYY.MM.DD / YYYYMMDD / DD-MM-YYYY");
                                                        }
                                                    }}

                                                    onChange={e =>
                                                        setEditForm(prev =>
                                                            prev ? { ...prev, [key]: e.target.value } : prev
                                                        )
                                                    }
                                                />
                                            );
                                        }

                                        // 时间
                                        if (key.endsWith("Time")) {
                                            return (
                                                <input
                                                    name={fieldName || key}
                                                    type="datetime-local"
                                                    step="1"
                                                    className={`${styles.editInput} form-control`}
                                                    value={value ? String(value).slice(0, 19) : ""}
                                                    onChange={e =>
                                                        setEditForm(prev =>
                                                            prev ? { ...prev, [key]: e.target.value } : prev
                                                        )
                                                    }
                                                />
                                            );
                                        }

                                        // 数字（允许小数）
                                        // 数字字段（允许小数）
                                        if (["insuredCount", "followUpCount"].includes(key)) {
                                            return (
                                                <input
                                                    name={fieldName || key}
                                                    type="text"
                                                    inputMode="numeric"
                                                    className={`${styles.editInput} form-control`}
                                                    value={value == null ? "" : String(value)}
                                                    onKeyDown={e => {
                                                        // 允许的控制键
                                                        const control = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Home", "End", "Tab", "Enter"].includes(e.key) || (e.ctrlKey || e.metaKey);
                                                        if (control) return;

                                                        // 仅允许 0-9 和 '-'；其它一概拦截
                                                        if (!/^[0-9-]$/.test(e.key)) {
                                                            e.preventDefault();
                                                            return;
                                                        }

                                                        // 处理 '-'：只能出现在开头，且只能有一个
                                                        if (e.key === "-") {
                                                            const el = e.currentTarget as HTMLInputElement;
                                                            const v = el.value || "";
                                                            const selStart = el.selectionStart ?? 0;
                                                            // 只能在第0位输入，且原值不能已以 '-' 开头
                                                            if (selStart !== 0 || v.startsWith("-")) {
                                                                e.preventDefault();
                                                            }
                                                        }
                                                    }}
                                                    onChange={e => {
                                                        // 统一全角数字 -> 半角
                                                        let norm = e.target.value.replace(/[０-９]/g, ch =>
                                                            String.fromCharCode(ch.charCodeAt(0) - 0xFF10 + 0x30)
                                                        );
                                                        // 统一各种横线/负号为标准 '-'
                                                        norm = norm.replace(/[－—‒–―−]/g, "-");

                                                        // 只允许 “可选前导- + 任意位数字”（含空串与仅“-”的过渡态）
                                                        if (/^-?\d*$/.test(norm)) {
                                                            // 折叠多余的 '-'（例如用户粘贴了多个负号）
                                                            if (/^-{2,}/.test(norm)) norm = "-" + norm.replace(/-/g, "");
                                                            setEditForm(prev => (prev ? { ...prev, [key]: norm } : prev));
                                                        }
                                                        // 不合法输入直接丢弃（不 setState），光标不跳
                                                    }}
                                                    onBlur={e => {
                                                        const v = (e.target.value || "").trim();
                                                        // 失焦时把孤立 '-' 清掉（也可以改成设为 "0"）
                                                        if (v === "-") {
                                                            setEditForm(prev => (prev ? { ...prev, [key]: "" } : prev));
                                                        }
                                                    }}
                                                />
                                            );
                                        }

                                        // 默认文本
                                        return (
                                            <input
                                                name={fieldName || key}
                                                type="text"
                                                className={`${styles.editInput} form-control`}
                                                value={value ?? ""}
                                                onChange={e =>
                                                    setEditForm(prev =>
                                                        prev ? { ...prev, [key]: e.target.value } : prev
                                                    )
                                                }
                                            />
                                        );
                                    };


                                    // 2. 计算当前隐藏字段
                                    const editHiddenFields = isAdmin
                                        ? hiddenFieldsForAll
                                        : [...hiddenFieldsForAll, ...hiddenCreateFieldsForUser];
                                    // 3. 过滤可见字段
                                    const visibleEditFields: [string, any][] = detailFieldOrder
                                        .filter(key => !editHiddenFields.includes(key) && editForm.hasOwnProperty(key))
                                        .map(key => [key, editForm[key as keyof PotentialCustomer]]);
                                    // 4. 两两分组
                                    return (
                                        <table className={`table table-sm ${styles.editTable}`}>
                                            <tbody>
                                                {groupEntriesInPairs(visibleEditFields).map((pair, rowIdx) => {
                                                    const [[key1, value1], [key2, value2] = []] = pair;
                                                    return (
                                                        // ✅ 用 rowIdx 作为 key，避免 React 重建导致光标丢失
                                                        <tr key={rowIdx}>
                                                            <th style={{ whiteSpace: "nowrap", width: "15%" }}>
                                                                {fieldNameMap[key1] || key1}
                                                            </th>
                                                            <td>
                                                                {renderInput(key1, value1, key1)}
                                                            </td>
                                                            {key2 ? (
                                                                <>
                                                                    <th style={{ whiteSpace: "nowrap", width: "15%" }}>
                                                                        {fieldNameMap[key2] || key2}
                                                                    </th>
                                                                    <td>
                                                                        {renderInput(key2, value2, key2)}
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

                                    );
                                })()}
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: 14, marginTop: 16 }}>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditModalVisible(false)}>
                                        取消
                                    </button>
                                    <button type="submit" className="btn btn-success btn-sm">
                                        保存
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {historyModalVisible && (
                    <div className={styles.customModalOverlay}>
                        <div className={styles.customModal} style={{ maxWidth: 820, minHeight: 350, background: '#f5faff' }}>
                            <h4 style={{ marginBottom: 18, color: '#337acc' }}>投保历史</h4>
                            <table className={styles.historyTable}>
                                <thead>
                                    <tr>
                                        <th>车牌号</th>
                                        <th>车架号</th>
                                        <th>被保险人</th>
                                        <th>投保时间</th>
                                        <th>保险公司</th>
                                        <th>业务员</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historyLoading ? (
                                        <tr><td colSpan={6} style={{ textAlign: "center", color: "#999" }}>查询中…</td></tr>
                                    ) : insuranceHistory.length === 0 ? (
                                        <tr><td colSpan={6} style={{ textAlign: "center", color: "#999" }}>暂无历史</td></tr>
                                    ) : (
                                        insuranceHistory.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>{item.licensePlate}</td>
                                                <td>{item.vinNumber}</td>
                                                <td>{item.insuredName}</td>
                                                <td>{item.insuredDate}</td>
                                                <td>{item.insuranceCompany}</td>
                                                <td>{item.agent}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 26 }}>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setHistoryModalVisible(false)}>
                                    关闭
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {createModalVisible && createForm && (
                    <div className={styles.customModalOverlay}>
                        <div className={styles.customNewPolicy}>
                            <h4 style={{ marginBottom: 0 }}>新增保单</h4>
                            <form onSubmit={handleCreateSave}>
                                <table className={`table table-sm ${styles.editTable}`}>
                                    <tbody>
                                        {(() => {
                                            // 1) 用 InsuranceDetails 的顺序数组拍平
                                            const orderedKeys = insuranceDetailFieldOrder.flat();

                                            // 2) 根据角色隐藏“结算/财审/调整”——你前面已经做了动态 hiddenCreateFieldsForUser，这里继续沿用
                                            const hidden = hiddenCreateFieldsForUser;

                                            // 3) 只取：createForm 里存在的键 + 不在隐藏列表里的键，且按 orderedKeys 的顺序
                                            const visibleEntries: [string, any][] = orderedKeys
                                                .filter((k) => (createForm as any).hasOwnProperty(k) && !hidden.includes(k))
                                                .map((k) => [k, (createForm as any)[k]] as [string, any]);

                                            // 4) 两两分组再渲染（顺序此时与 InsuranceDetails 完全一致）
                                            return groupEntriesInPairs(visibleEntries).map((pair) => {
                                                const [[key1, value1], [key2, value2] = []] = pair;

                                                const isNormalUser = !(isAdmin || isSuperAdmin);
                                                const renderInput = (key: string, value: any) => {
                                                    // 新增页：保单号自动生成，禁改
                                                    if (key === "commercialPolicyNumber" || key === "compulsoryPolicyNumber") {
                                                        return (
                                                            <input
                                                                type="text"
                                                                className={`${styles.editInput} form-control`}
                                                                value={String(value ?? "")}
                                                                disabled
                                                                readOnly
                                                            />
                                                        );
                                                    }
                                                    if (key === "intermediaryInvoiceNo") {
                                                        return (
                                                          <input
                                                            type="number"
                                                            className={`${styles.editInput} form-control`}
                                                            value={String(value ?? "")}
                                                            disabled
                                                            readOnly
                                                          />
                                                        );
                                                      }
                                                    // 其余字段走通用渲染
                                                    return renderInsuranceInput(
                                                        key,
                                                        value,
                                                        setCreateForm,
                                                        isNormalUser,
                                                        insuranceCompanies,
                                                        { isSuperAdmin, isAdmin, userList }
                                                    );
                                                };


                                                return (
                                                    <tr key={key1}>
                                                        <th style={{ whiteSpace: "nowrap", width: "15%" }}>{insuranceDetailsNameMap[key1] || key1}</th>
                                                        <td>{renderInput(key1, value1)}</td>
                                                        {key2 ? (
                                                            <>
                                                                <th style={{ whiteSpace: "nowrap", width: "15%" }}>{insuranceDetailsNameMap[key2] || key2}</th>
                                                                <td>{renderInput(key2, value2)}</td>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <th></th>
                                                                <td></td>
                                                            </>
                                                        )}
                                                    </tr>
                                                );
                                            });

                                        })()}
                                    </tbody>
                                </table>
                                <div style={{ display: "flex", justifyContent: "flex-end", gap: 14, marginTop: 16 }}>
                                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCreateModalVisible(false)}>
                                        取消
                                    </button>
                                    <button type="submit" className="btn btn-success btn-sm" disabled={createSubmitting}>
                                        {createSubmitting ? "保存中…" : "保存"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {followUpModalVisible && (
                    <div className={styles.customModalOverlay}>
                        <div className={styles.customModal} style={{ width: 800, height: 300 }}>
                            <h5>{followUpEditMode === "add" ? "新增回访" : "编辑今日回访"}</h5>
                            <textarea
                                className="form-control"
                                value={followUpContent}
                                rows={6}
                                style={{ fontSize: 16, marginBottom: 16 }}
                                placeholder="请输入回访内容"
                                onChange={e => setFollowUpContent(e.target.value)}
                            />
                            <div className="d-flex justify-content-end mt-2">
                                <button className="btn btn-secondary btn-sm" onClick={() => setFollowUpModalVisible(false)}>
                                    取消
                                </button>
                                <button
                                    className="btn btn-success btn-sm ms-2"
                                    onClick={async () => {
                                        if (!selectedDetail?.id) return alert("未选中客户");
                                        if (!followUpContent.trim()) return alert("请填写回访内容");
                                        try {

                                            if (followUpEditMode === "add") {
                                                const nextIndex = followUpList.length === 0
                                                    ? 1
                                                    : Math.max(...followUpList.map(f => f.index || 0)) + 1;
                                                await addFollowUpPotential({
                                                    potentialCustomerId: selectedDetail.id,
                                                    content: followUpContent,
                                                    date: getNowDateTime(),
                                                    index: nextIndex,
                                                });
                                            } else if (followUpEditMode === "edit" && editingFollowUpId) {
                                                await updateFollowUpPotential({
                                                    potentialCustomerId: selectedDetail.id,
                                                    index: editingFollowUpId,
                                                    content: followUpContent,
                                                });
                                            }
                                            // 无论新增还是编辑，接下来都 fetch 一次回访最新列表
                                            const res = await fetchFollowUpPotentialList(selectedDetail.id);
                                            setFollowUpList(res.data || []);
                                            setFollowUpModalVisible(false);
                                            setFollowUpContent("");
                                            setEditingFollowUpId(null);
                                        } catch (err: any) {
                                            alert("操作失败：" + (err?.message || "未知错误"));
                                        }
                                    }}
                                >
                                    保存
                                </button>
                            </div>
                        </div>
                    </div>
                )}



            </div>
        </div>
    );
};

export default PotentialCustomer;