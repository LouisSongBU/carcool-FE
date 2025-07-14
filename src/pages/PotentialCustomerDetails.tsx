import React, { useState, useEffect } from "react";
import styles from "./PotentialCustomerDetails.module.css";
import type { InsuranceDetail } from './InsuranceDetails.tsx';
import { isAdminUser, getVisibleFields, groupEntriesInPairs, insuranceDetailsNameMap } from "../utils/fieldUtils";
import { fetchByRecordDate, fetchComprehensive, updatePotentialCustomer, addPotentialCustomer, addFollowUpPotential, updateFollowUpPotential, fetchFollowUpPotentialList } from '../api/potentialCustomer';
import { getTodayDate, getNowDateTime, formatDateTime, formatDate } from '../utils/dateUtils';

type PotentialCustomersProps = {
    insuranceCompanies: any[];
    userList: any[];
};

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
}

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
    registrationOwnerId: "车主身份证",
    vinNumber: "车架号",
    engineNumber: "发动机号",
    recordTime: "记录时间",
    insuranceCompany: "保险公司",
    note: "备注",
    salesAgent: "业务员",
    hierarchyCode: "层级码",
    scheduleFollowUpDate: "下次回访时间",
}

const detailFieldOrder = [
    "insuredCount", "registrationOwnerId",
    "licensePlate", "vinNumber",
    "vehicleModel", "engineNumber",
    "policyStartDate", "recordTime",
    "registrationOwner", "insuranceCompany",
    "phone", "salesAgent",
    "firstRegistrationDate", "hierarchyCode",
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

const hiddenCreateFieldsForUser = [
    "isSettlement",
    "financeVerification",
    "commercialAdjustment",
    "compulsoryAdjustment",
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
        recordTimeStart: "",
        recordTimeEnd: "",
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

    const isAdmin = isAdminUser();

    const [followUpDateQuery, setFollowUpDateQuery] = useState("");
    const [selectedFollowUpCount, setSelectedFollowUpCount] = useState<string | number>('');
    const [neverFollowUp, setNeverFollowUp] = useState(false);

    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editForm, setEditForm] = useState<PotentialCustomer | null>(null);

    const [historyModalVisible, setHistoryModalVisible] = useState(false);
    const [insuranceHistory, setInsuranceHistory] = useState<any[]>([]);

    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [createForm, setCreateForm] = useState<InsuranceDetail | null>(null);

    const [nextFollowUpDate, setNextFollowUpDate] = useState<string>('');

    // 新增一个 state
    const [initialFirstEmptyDateIdx, setInitialFirstEmptyDateIdx] = useState<number>(0);

    // 2. 详细信息数据相关
    // 详细信息数据相关
    const [allList, setAllList] = useState<PotentialCustomer[]>([]);
    const [myList, setMyList] = useState<PotentialCustomer[]>([]);
    const [selectedDetail, setSelectedDetail] = useState<PotentialCustomer | null>(null);
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

    // 3. 查询逻辑

    useEffect(() => {
        if (selectedDetail?.id) {
            fetchFollowUpPotentialList(selectedDetail.id).then(res => {
                setFollowUpList(res.data || []); // 保证是数组
            });
        } else {
            setFollowUpList([]);
        }
    }, [selectedDetail?.id]);

    const handleRecordDateSearch = () => {
        if (!query.recordTimeStart || !query.recordTimeEnd) {
            alert("请选择完整记录日期");
            return;
        }
        fetchByRecordDate(query.recordTimeStart, query.recordTimeEnd)
            .then(res => {
                setAllList(res.data);
                setMyList(res.data);
                setShowList(true);
            })
            .catch(err => {
                alert("查询失败: " + err.message);
            });
    };

    const handleComprehensiveSearch = () => {
        if (
            !query.recordTimeStart ||
            !query.recordTimeEnd ||
            !query.policyStartDateStart ||
            !query.policyStartDateEnd
        ) {
            alert("请输入完整记录日期和起保日期");
            return;
        }
        fetchComprehensive({
            recordTimeStart: query.recordTimeStart,
            recordTimeEnd: query.recordTimeEnd,
            policyStartDateStart: query.policyStartDateStart,
            policyStartDateEnd: query.policyStartDateEnd
        })
            .then(res => {
                setAllList(res.data);
                setMyList(res.data);
                setShowList(true);
            })
            .catch(err => {
                alert("查询失败: " + err.message);
            });
    };



    // 4. 筛选按钮
    const handleFilterBtn = (key: keyof typeof filters) => {
        setFilters(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const [filterField, setFilterField] = useState("");
    const [filterOperator, setFilterOperator] = useState("=");
    const [filterValue, setFilterValue] = useState("");

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
    const handleFollowUpDateQuery = () => {
        if (!followUpDateQuery) return;
        setMyList(
            allList.filter(
                item =>
                    item.scheduleFollowUpDate && String(item.scheduleFollowUpDate).slice(0, 10) === followUpDateQuery
            )
        );
        setShowList(true);
    };


    // 1. 回访次数选择变化时触发筛选
    const handleFollowUpCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setSelectedFollowUpCount(val);

        if (!val) {
            setMyList([...allList]);
            return;
        }
        setMyList(allList.filter(item => String(item.followUpCount ?? "") === val));
        setShowList(true);
    };


    // 2. 未回访多选框变化时触发筛选
    const handleNeverFollowUpChange = () => {
        const newVal = !neverFollowUp;
        setNeverFollowUp(newVal);
        if (!newVal) {
            setMyList([...allList]);
            return;
        }
        setMyList(allList.filter(item =>
            !item.firstFollowUpNote || item.firstFollowUpNote.trim() === ""
        ));
        setShowList(true);
    };


    const handleCustomFilter = () => {
        if (!filterField || !filterValue) {
            setMyList(allList);
            return;
        }

        setMyList(
            allList.filter(item => {
                const v = (item as any)[filterField];

                // 日期字段
                if (dateFields.has(filterField)) {
                    if (!v) return false;
                    return String(v).slice(0, 10) === filterValue;
                }

                // 非日期字段
                if (filterOperator === "=") {
                    return String(v ?? "") === filterValue;
                } else if (filterOperator === ">") {
                    return v > filterValue;
                } else if (filterOperator === "<") {
                    return v < filterValue;
                } else if (filterOperator === "like") {
                    return String(v ?? "").includes(filterValue);
                } else if (filterOperator === "not like") {
                    return !String(v ?? "").includes(filterValue);
                }

                // 默认不筛选
                return true;
            })
        );
    };


    // 3. 重置按钮，三个相关 state 也要重置
    const handleResetFilters = () => {
        setFilters({
            signed: false,
            notSigned: false,
            currentSigned: false,
            currentNotSigned: false,
            scheduled: false,
            notScheduledOrExpired: false,
        });
        setFollowUpDateQuery("");
        setMyList([...allList]);
        setSelectedFollowUpCount('');
        setNeverFollowUp(false);
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
            salesAgent: "",
            hierarchyCode: "",
            scheduleFollowUpDate: null,
            id: null,
            followUpCount: null,
            previousSignDate: null,
        }
    }

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
                onClick={() => {
                    // 模拟后端请求
                    setTimeout(() => {
                        setInsuranceHistory([
                            {
                                licensePlate: selectedDetail?.licensePlate || "苏A12345",
                                engineNumber: "E123456",
                                insuredName: selectedDetail?.registrationOwner || "张三",
                                insuredDate: "2024-07-10",
                                insuranceCompany: "中国人保",
                                agent: "李四"
                            },
                            // 可再多加几条
                        ]);
                        setHistoryModalVisible(true);
                    }, 100);
                }}
            >
                投保历史
            </button>

            {/* 提交出单 */}
            <button
                className={`btn btn btn-primary btn-sm`}
                style={{ minWidth: 85, marginRight: 6 }}
                onClick={() => {
                    // 自动提取字段填入新增浮窗
                    setCreateForm({
                        id: "不用填",
                        applicantName: "",
                        commercialPolicyNumber: "不用填",
                        applicantIdNumber: "",
                        compulsoryPolicyNumber: "不用填",
                        insuredName: "",
                        signingDate: getTodayDate(),
                        insuredIdNumber: "",
                        vehicleDamageCoverage: 0,
                        registrationOwner: selectedDetail?.registrationOwner ?? "",
                        vehicleDamagePremium: 0,
                        registrationOwnerId: selectedDetail?.registrationOwnerId ?? "",
                        thirdPartyCoverage: 0,
                        licensePlate: selectedDetail?.licensePlate ?? "",
                        thirdPartyPremium: 0,
                        vehicleModel: selectedDetail?.vehicleModel ?? "",
                        outMedCoverage: 0,
                        firstRegistrationDate: selectedDetail?.firstRegistrationDate ?? getTodayDate(),
                        outMedPremium: 0,
                        engineNumber: selectedDetail?.engineNumber ?? "",
                        driverCoverage: 0,
                        vinNumber: selectedDetail?.vinNumber ?? "",
                        driverPremium: 0,
                        approvedSeats: "",
                        passengerCoverage: 0,
                        approvedLoad: "",
                        passengerPremium: 0,
                        deliveryAddress: selectedDetail?.deliveryAddress ?? "",
                        commercialPremium: 0,
                        phone: selectedDetail?.phone ?? "",
                        compulsoryPremium: 0,
                        mobile: "",
                        driverAccidentPremium: 0,
                        salesAgent: selectedDetail?.salesAgent ?? "",
                        vehicleTax: 0,
                        salesManager: "",
                        receivablePremium: 0,
                        inputDate: getTodayDate(),
                        receivedPremium: 0,
                        intermediaryInvoiceNo: "",
                        policyStartDate: selectedDetail?.policyStartDate ?? getTodayDate(),
                        hierarchyCode: selectedDetail?.hierarchyCode ?? "",
                        insuranceCompany: selectedDetail?.insuranceCompany ?? "",
                        issuingOffice: "",
                        isSettlement: "",
                        financeVerification: "",
                        commercialAdjustment: 0,
                        compulsoryAdjustment: 0
                    });
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

            <button
                className="btn btn-outline-warning btn-sm"
                style={{ marginRight: 6, minWidth: 120, opacity: todayFollowUp ? 1 : 0.4, pointerEvents: todayFollowUp ? 'auto' : 'none' }}
                disabled={!todayFollowUp}
                onClick={() => {
                    setFollowUpContent(todayFollowUp?.content || "");
                    setEditingFollowUpId(todayFollowUp?.index || null);
                    setFollowUpEditMode("edit");
                    setFollowUpModalVisible(true);
                }}
            >
                编辑今日回访
            </button>

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
                        {/* 下次预约筛选 */}
                        <div className={styles.filterRow}>
                            <span style={{ fontSize: 12 }}>下次预约回访日期</span>
                            <input
                                type="date"
                                value={followUpDateQuery}
                                onChange={e => setFollowUpDateQuery(e.target.value)}
                                className={`form-control form-control-sm ${styles.filterInput}`}
                                style={{ width: 120 }}
                            />
                            <button
                                className={`btn btn-outline-success btn-sm ${styles.filterBtn}`}
                                onClick={handleFollowUpDateQuery}
                            >预约查询</button>
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
                            <div style={{ maxHeight: 350, overflowY: "auto" }}>
                                <table className={styles.queryResultTable}>
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>成功投保</th>
                                            <th>车牌号</th>
                                            <th>厂牌型号</th>
                                            <th>起保日期</th>
                                            <th>车主</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {myList.map((item, idx) => (
                                            <tr
                                                key={item.licensePlate + idx}
                                                style={{ cursor: "pointer" }}
                                                onClick={() => setSelectedDetail(item)}
                                                className={selectedDetail?.licensePlate === item.licensePlate ? styles.selectedRow : ""}
                                            >
                                                <td>{idx + 1}</td>
                                                <td>{item.insuredCount}</td>
                                                <td>{item.licensePlate}</td>
                                                <td>{item.vehicleModel}</td>
                                                <td>{item.policyStartDate ? String(item.policyStartDate).slice(0, 10) : ""}</td>
                                                <td>{item.registrationOwner}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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
                                            followUpList.map(item => (
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
                                        { key: "vehicleModel", label: "厂牌型号" },
                                        { key: "policyStartDate", label: "起保日期" },
                                        { key: "registrationOwner", label: "车主" },
                                        { key: "phone", label: "电话" },
                                        { key: "firstRegistrationDate", label: "初登日期" },
                                        { key: "vinNumber", label: "车架号" },
                                        { key: "engineNumber", label: "发动机号" },
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
                                    const renderInput = (key: string, value: any) => {
                                        // id 不可编辑
                                        if (key === "id") {
                                            return <input type="text" value={value ?? ""} disabled className={styles.editInput} />;
                                        }
                                        // 只读所有回访时间
                                        if (followUpDateFields.includes(key)) {
                                            return (
                                                <input
                                                    type="date"
                                                    className={`${styles.editInput} form-control`}
                                                    value={value ? String(value).slice(0, 10) : ""}
                                                    disabled
                                                    readOnly
                                                />
                                            );
                                        }
                                        // 可编辑所有回访内容，同时自动生成下一个回访时间
                                        if (followUpNoteFields.includes(key)) {
                                            const idx = followUpNoteFields.indexOf(key);
                                            const dateField = followUpDateFields[idx];
                                            // 新增模式，只允许编辑第一次回访内容
                                            if (!editForm?.id) {
                                                const canEdit = idx === 0;
                                                return (
                                                    <input
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
                                                idx < initialFirstEmptyDateIdx ||
                                                idx === initialFirstEmptyDateIdx;
                                            return (
                                                <input
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
                                        if (isDateField(key)) {
                                            return (
                                                <input
                                                    type="date"
                                                    className={`${styles.editInput} form-control`}
                                                    value={value ?? ""}
                                                    onChange={e =>
                                                        setEditForm(prev => prev ? { ...prev, [key]: e.target.value } : prev)
                                                    }
                                                />
                                            );
                                        }
                                        // 时间
                                        if (isTimeField(key)) {
                                            return (
                                                <input
                                                    type="datetime-local"
                                                    step="1"
                                                    className={`${styles.editInput} form-control`}
                                                    value={value ? String(value).slice(0, 19) : ""}
                                                    onChange={e =>
                                                        setEditForm(prev => prev ? { ...prev, [key]: e.target.value } : prev)
                                                    }
                                                />
                                            );
                                        }
                                        // 数字
                                        if (typeof value === "number" || /^\d+$/.test(String(value ?? ""))) {
                                            return (
                                                <input
                                                    type="number"
                                                    className={`${styles.editInput} form-control`}
                                                    value={value ?? ""}
                                                    onChange={e =>
                                                        setEditForm(prev => prev ? { ...prev, [key]: Number(e.target.value) } : prev)
                                                    }
                                                />
                                            );
                                        }
                                        // 默认文本
                                        return (
                                            <input
                                                type="text"
                                                className={`${styles.editInput} form-control`}
                                                value={value ?? ""}
                                                onChange={e =>
                                                    setEditForm(prev => prev ? { ...prev, [key]: e.target.value } : prev)
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
                                                        <tr key={key1}>
                                                            <th style={{ whiteSpace: "nowrap", width: "15%" }}>
                                                                {fieldNameMap[key1] || key1}
                                                            </th>
                                                            <td>{renderInput(key1, value1)}</td>
                                                            {key2 ? (
                                                                <>
                                                                    <th style={{ whiteSpace: "nowrap", width: "15%" }}>
                                                                        {fieldNameMap[key2] || key2}
                                                                    </th>
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
                                        <th>发动机号</th>
                                        <th>被保险人</th>
                                        <th>投保时间</th>
                                        <th>保险公司</th>
                                        <th>业务员</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {insuranceHistory.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item.licensePlate}</td>
                                            <td>{item.engineNumber}</td>
                                            <td>{item.insuredName}</td>
                                            <td>{item.insuredDate}</td>
                                            <td>{item.insuranceCompany}</td>
                                            <td>{item.agent}</td>
                                        </tr>
                                    ))}
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
                            <form
                                onSubmit={e => {
                                    e.preventDefault();
                                    // 保存/提交逻辑
                                    setCreateModalVisible(false);
                                }}
                            >
                                <table className={`table table-sm ${styles.editTable}`}>
                                    <tbody>
                                        {(() => {
                                            // 2. 计算当前新增时的隐藏字段
                                            const visibleCreateFields = getVisibleFields(createForm, isAdmin, hiddenCreateFieldsForUser);

                                            // 4. 两两分组渲染
                                            return groupEntriesInPairs(visibleCreateFields).map((pair, rowIdx) => {
                                                const [[key1, value1], [key2, value2] = []] = pair;

                                                // 通用输入控件
                                                const renderInput = (key: string, value: any) => {
                                                    // id 不可编辑
                                                    if (key === "id") return <input type="text" value={value} disabled className={`${styles.editInput} form-control`} />;
                                                    // 日期字段
                                                    if (key.endsWith("Date")) {
                                                        return (
                                                            <input
                                                                type="date"
                                                                className={`${styles.editInput} form-control`}
                                                                value={value ?? ""}
                                                                onChange={e =>
                                                                    setCreateForm(prev => prev ? { ...prev, [key]: e.target.value } : prev)
                                                                }
                                                            />
                                                        );
                                                    }

                                                    // 数字类型
                                                    if (typeof value === "number")
                                                        return (
                                                            <input
                                                                type="number"
                                                                className={`${styles.editInput} form-control`}
                                                                value={value}
                                                                onChange={e =>
                                                                    setCreateForm(prev => prev ? { ...prev, [key]: Number(e.target.value) } : prev)
                                                                }
                                                            />
                                                        );
                                                    // 其它用文本框
                                                    return (
                                                        <input
                                                            type="text"
                                                            className={`${styles.editInput} form-control`}
                                                            value={value ?? ""}
                                                            onChange={e =>
                                                                setCreateForm(prev => prev ? { ...prev, [key]: e.target.value } : prev)
                                                            }
                                                        />
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
                                    <button type="submit" className="btn btn-primary btn-sm">
                                        保存
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
                                                    date: today,
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