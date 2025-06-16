import React, { useState } from "react";
import styles from "./PotentialCustomerDetails.module.css";
import type { InsuranceDetail } from './InsuranceDetails.tsx';
import { isAdminUser, getVisibleFields, groupEntriesInPairs, insuranceDetailsNameMap } from "../utils/fieldUtils";

interface PotentialCustomer {
    insuredCount: number | null;
    fourFollowUpNote: string | null;
    licensePlate: string;
    fourFollowUpDate: Date | null;
    vehicleModel: string | null;
    fiveFollowUpNote: string | null;
    policyStartDate: Date;
    fiveFollowUpDate: Date | null;
    registrationOwner: string | null;
    sixFollowUpNote: string | null;
    phone: string | null;
    sixFollowUpDate: Date | null;
    firstRegistrationDate: Date | null;
    sevenFollowUpNote: string | null;
    deliveryAddress: string | null;
    sevenFollowUpDate: Date | null;
    registrationOwnerId: string | null;
    eightFollowUpNote: string | null;
    vinNumber: string | null;
    eightFollowUpDate: Date | null;
    engineNumber: string | null;
    nineFollowUpNote: string | null;
    recordTime: Date | null;
    nineFollowUpDate: Date | null;
    insuranceCompany: string | null;
    tenFollowUpNote: string | null;
    Note1: string | null;
    tenFollowUpDate: Date | null;
    Node2: string | null;
    elevenFollowUpNote: string | null;
    salesAgent: string | null;
    elevenFollowUpDate: Date | null;
    hierarchyCode: string | null;
    twelveFollowUpNote: string | null;
    scheduleFollowUpDate: Date | null;
    twelveFollowUpDate: Date | null;
    firstFollowUpNote: string | null;
    thirteenFollowUpNote: string | null;
    firstFollowUpDate: Date | null;
    thirteenFollowUpDate: Date | null;
    secondFollowUpNote: string | null;
    fourteenFollowUpNote: string | null;
    secondFollowUpDate: Date | null;
    fourteenFollowUpDate: Date | null;
    thirdFollowUpNote: string | null;
    fifteenFollowUpNote: string | null;
    thirdFollowUpDate: Date | null;
    fifteenFollowUpDate: Date | null;
    id: number | null;
    followUpCount: number | null;
    previousSignDate: Date | null;
}

const fieldNameMap: Record<string, string> = {
    insuredCount: "成功投保",
    fourFollowUpNote: "四次回访",
    licensePlate: "车牌号",
    fourFollowUpDate: "四次时间",
    vehicleModel: "厂牌型号",
    fiveFollowUpNote: "五次回访",
    policyStartDate: "起保日期",
    fiveFollowUpDate: "五次时间",
    registrationOwner: "车主",
    sixFollowUpNote: "六次回访",
    phone: "电话",
    sixFollowUpDate: "六次时间",
    firstRegistrationDate: "初登日期",
    sevenFollowUpNote: "七次回访",
    deliveryAddress: "地址",
    sevenFollowUpDate: "七次时间",
    registrationOwnerId: "车主身份证",
    eightFollowUpNote: "八次回访",
    vinNumber: "车架号",
    eightFollowUpDate: "八次时间",
    engineNumber: "发动机号",
    nineFollowUpNote: "九次回访",
    recordTime: "记录时间",
    nineFollowUpDate: "九次时间",
    insuranceCompany: "保险公司",
    tenFollowUpNote: "十次回访",
    Note1: "备注1",
    tenFollowUpDate: "十次时间",
    Node2: "备注2",
    elevenFollowUpNote: "十一次回访",
    salesAgent: "业务员",
    elevenFollowUpDate: "十一次时间",
    hierarchyCode: "层级码",
    twelveFollowUpNote: "十二次回访",
    scheduleFollowUpDate: "下次回访时间",
    twelveFollowUpDate: "十二次时间",
    firstFollowUpNote: "一次回访",
    thirteenFollowUpNote: "十三次回访",
    firstFollowUpDate: "一次时间",
    thirteenFollowUpDate: "十三次时间",
    secondFollowUpNote: "二次回访",
    fourteenFollowUpNote: "十四次回访",
    secondFollowUpDate: "二次时间",
    fourteenFollowUpDate: "十四次时间",
    thirdFollowUpNote: "三次回访",
    fifteenFollowUpNote: "十五次回访",
    thirdFollowUpDate: "三次时间",
    fifteenFollowUpDate: "十五次时间"
}

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
    "fifteenFollowUpDate"
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

// === 2. 组件主体 ===
// ...模拟数据和 interface 省略...

const PotentialCustomer: React.FC = () => {
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

    // 2. 详细信息数据相关
    // 详细信息数据相关
    const [originalList, setOriginalList] = useState<PotentialCustomer[]>([
        {
            insuredCount: -1,
            fourFollowUpNote: null,
            licensePlate: "京A88888",
            fourFollowUpDate: null,
            vehicleModel: "福特探险者",
            fiveFollowUpNote: null,
            policyStartDate: new Date(2025, 8, 8),
            fiveFollowUpDate: null,
            registrationOwner: "王五",
            sixFollowUpNote: null,
            phone: "408-111-9999",
            sixFollowUpDate: null,
            firstRegistrationDate: new Date(2021, 8, 8),
            sevenFollowUpNote: null,
            deliveryAddress: "北京市海淀区111",
            sevenFollowUpDate: null,
            registrationOwnerId: "1113X",
            eightFollowUpNote: null,
            vinNumber: "VN12345",
            eightFollowUpDate: null,
            engineNumber: "GF11111",
            nineFollowUpNote: null,
            recordTime: new Date(2025, 8, 8, 14, 30, 45),
            nineFollowUpDate: null,
            insuranceCompany: "人保",
            tenFollowUpNote: null,
            Note1: "备注1",
            tenFollowUpDate: null,
            Node2: "备注2",
            elevenFollowUpNote: null,
            salesAgent: "业务员A",
            elevenFollowUpDate: null,
            hierarchyCode: "层级码1",
            twelveFollowUpNote: null,
            scheduleFollowUpDate: new Date(2025, 7, 8),
            twelveFollowUpDate: null,
            firstFollowUpNote: "一次回访",
            thirteenFollowUpNote: null,
            firstFollowUpDate: new Date(2025, 6, 8),
            thirteenFollowUpDate: null,
            secondFollowUpNote: "二次回访",
            fourteenFollowUpNote: null,
            secondFollowUpDate: new Date(2025, 6, 9),
            fourteenFollowUpDate: null,
            thirdFollowUpNote: "三次回访",
            fifteenFollowUpNote: null,
            thirdFollowUpDate: new Date(2025, 6, 10),
            fifteenFollowUpDate: null,
            id: 1,
            followUpCount: 1,
            previousSignDate: new Date(2024, 8, 8)
        },
        {
            insuredCount: 9,
            fourFollowUpNote: null,
            licensePlate: "京B99999",
            fourFollowUpDate: null,
            vehicleModel: "特斯拉",
            fiveFollowUpNote: null,
            policyStartDate: new Date(2025, 6, 6),
            fiveFollowUpDate: null,
            registrationOwner: "赵六",
            sixFollowUpNote: null,
            phone: "13808886666",
            sixFollowUpDate: null,
            firstRegistrationDate: new Date(2015, 6, 6),
            sevenFollowUpNote: null,
            deliveryAddress: "北京市东城区222",
            sevenFollowUpDate: null,
            registrationOwnerId: "110333",
            eightFollowUpNote: null,
            vinNumber: "VN54321",
            eightFollowUpDate: null,
            engineNumber: "ER9999",
            nineFollowUpNote: null,
            recordTime: new Date(2015, 5, 5, 14, 30, 45),
            nineFollowUpDate: null,
            insuranceCompany: "太平",
            tenFollowUpNote: null,
            Note1: "备注1",
            tenFollowUpDate: null,
            Node2: "备注2",
            elevenFollowUpNote: null,
            salesAgent: "业务员B",
            elevenFollowUpDate: null,
            hierarchyCode: "层级码2",
            twelveFollowUpNote: null,
            scheduleFollowUpDate: new Date(2025, 6, 4),
            twelveFollowUpDate: null,
            firstFollowUpNote: "一次回访",
            thirteenFollowUpNote: null,
            firstFollowUpDate: new Date(2025, 4, 6),
            thirteenFollowUpDate: null,
            secondFollowUpNote: "二次回访",
            fourteenFollowUpNote: null,
            secondFollowUpDate: new Date(2025, 4, 8),
            fourteenFollowUpDate: null,
            thirdFollowUpNote: "三次回访",
            fifteenFollowUpNote: null,
            thirdFollowUpDate: new Date(2025, 4, 10),
            fifteenFollowUpDate: null,
            id: 2,
            followUpCount: 9,
            previousSignDate: new Date(2024, 6, 6)
        },
    ]);


    const [myList, setMyList] = useState<PotentialCustomer[]>(originalList);
    const [selectedDetail, setSelectedDetail] = useState<PotentialCustomer | null>(null);
    const [showList, setShowList] = useState(false);

    // 3. 查询逻辑
    const handleRecordDateSearch = () => {
        setShowList(true);
        // 只返回第一条
        setMyList([originalList[0]]);
    };

    const handleComprehensiveSearch = () => {
        setShowList(true);
        // 返回所有数据
        setMyList([...originalList]);
    };

    // 4. 筛选按钮
    const handleFilterBtn = (key: keyof typeof filters) => {
        setFilters(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // 5. 下次回访日期查询
    const handleFollowUpDateQuery = () => {
        if (!followUpDateQuery) return;
        setMyList(
            originalList.filter(
                item =>
                    item.scheduleFollowUpDate &&
                    new Date(item.scheduleFollowUpDate).toISOString().split("T")[0] === followUpDateQuery
            )
        );
        setShowList(true);
    };

    // 1. 回访次数选择变化时触发筛选
    const handleFollowUpCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setSelectedFollowUpCount(val);

        if (!val) {
            setMyList([...originalList]);
            return;
        }
        setMyList(originalList.filter(item => String(item.followUpCount ?? "") === val));
        setShowList(true);
    };

    // 2. 未回访多选框变化时触发筛选
    const handleNeverFollowUpChange = () => {
        const newVal = !neverFollowUp;
        setNeverFollowUp(newVal);
        if (!newVal) {
            setMyList([...originalList]);
            return;
        }
        setMyList(originalList.filter(item =>
            !item.firstFollowUpNote || item.firstFollowUpNote.trim() === ""
        ));
        setShowList(true);
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
        setMyList([...originalList]);
        setSelectedFollowUpCount('');
        setNeverFollowUp(false);
    };

    // === 6. 渲染相关函数 ===
    // === 新增/编辑按钮组 ===
    const renderButtonGroup = () => (
        <div className={styles.buttonGroupBox} style={{ display: "flex", gap: 16, marginTop: 18, alignItems: "center" }}>
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
                style={{ marginRight: 20, minWidth: 94 }}
                onClick={() => {
                    if (!nextFollowUpDate || !selectedDetail) return;
                    // 更新当前记录 scheduleFollowUpDate
                    const updated = { ...selectedDetail, scheduleFollowUpDate: new Date(nextFollowUpDate) };
                    setSelectedDetail(updated);
                    setMyList(list =>
                        list.map(item =>
                            item.id === updated.id ? updated : item
                        )
                    );
                    alert("下次回访日期已保存！");
                }}
            >
                保存下次回访
            </button>

            {/* 编辑按钮 */}
            <button
                className={`btn btn-outline-success btn-sm`}
                style={{ marginRight: 16, minWidth: 70 }}
                onClick={() => {
                    setEditForm(selectedDetail);
                    setEditModalVisible(true);
                }}
            >
                编辑
            </button>

            {/* 投保历史 */}
            <button
                className={`btn btn-outline-info btn-sm`}
                style={{ marginRight: 16, minWidth: 85 }}
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
                className={`btn btn-outline-primary btn-sm`}
                style={{ minWidth: 85 }}
                onClick={() => {
                    // 自动提取字段填入新增浮窗
                    setCreateForm({
                        id: "不用填",
                        applicantName: "",
                        commercialPolicyNumber: "不用填",
                        applicantIdNumber: "",
                        compulsoryPolicyNumber: "不用填",
                        insuredName: "",
                        signingDate: new Date(),
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
                        firstRegistrationDate: selectedDetail?.firstRegistrationDate ?? new Date(),
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
                        inputDate: new Date(),
                        receivedPremium: 0,
                        intermediaryInvoiceNo: "",
                        policyStartDate: selectedDetail?.policyStartDate ?? new Date(),
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
                                                <td>{item.policyStartDate.toLocaleDateString()}</td>
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
                            {(() => {
                                // 过滤掉不显示的字段
                                const visibleEntries = getVisibleFields(selectedDetail, false, hiddenFieldsForAll);

                                return (
                                    <table className={`table table-bordered table-hover ${styles.customTable}`}>
                                        <tbody>
                                            {groupEntriesInPairs(visibleEntries).map((pair, rowIdx) => {
                                                const [[key1, value1], [key2, value2] = []] = pair;
                                                return (
                                                    <tr key={key1}>
                                                        <th>{fieldNameMap[key1] || key1}</th>
                                                        <td>
                                                            {value1 instanceof Date
                                                                ? (key1 === "recordTime"
                                                                    ? value1.toLocaleString()
                                                                    : value1.toLocaleDateString()
                                                                )
                                                                : String(value1 ?? "")}
                                                        </td>
                                                        {key2 ? (
                                                            <>
                                                                <th>{fieldNameMap[key2] || key2}</th>
                                                                <td>
                                                                    {value2 instanceof Date
                                                                        ? value2.toLocaleDateString()
                                                                        : String(value2 ?? "")}
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
                        </div>
                    )}
                    {/* 按钮组 */}
                    {renderButtonGroup()}
                </div>


                {editModalVisible && editForm && (
                    <div className={styles.customModalOverlay}>
                        <div className={styles.customModal}>
                            <h4 style={{ marginBottom: 0 }}>编辑潜在客户</h4>
                            <form
                                onSubmit={e => {
                                    e.preventDefault();
                                    // 保存逻辑
                                    setEditModalVisible(false);
                                }}
                            >
                                <table className={`table table-sm ${styles.editTable}`}>
                                    <tbody>
                                        {(() => {
                                            // 2. 计算当前隐藏字段
                                            const editHiddenFields = isAdmin
                                                ? hiddenFieldsForAll
                                                : [...hiddenFieldsForAll, ...hiddenCreateFieldsForUser];
                                            // 3. 过滤可见字段
                                            const visibleEditFields = getVisibleFields(editForm, isAdmin, editHiddenFields);
                                            // 4. 两两分组
                                            return groupEntriesInPairs(visibleEditFields).map((pair, rowIdx) => {
                                                const [[key1, value1], [key2, value2] = []] = pair;

                                                // 渲染输入控件
                                                const renderInput = (key: string, value: any) => {
                                                    // id 不可编辑
                                                    if (key === "id") return <input type="text" value={value} disabled className={styles.editInput} />;
                                                    // 日期类型
                                                    if (value instanceof Date)
                                                        return (
                                                            <input
                                                                type="date"
                                                                className={`${styles.editInput} form-control`}
                                                                value={value ? value.toISOString().split("T")[0] : ""}
                                                                onChange={e =>
                                                                    setEditForm(prev => prev ? { ...prev, [key]: e.target.value ? new Date(e.target.value) : null } : prev)
                                                                }
                                                            />
                                                        );
                                                    // 数字类型
                                                    if (typeof value === "number")
                                                        return (
                                                            <input
                                                                type="number"
                                                                className={`${styles.editInput} form-control`}
                                                                value={value}
                                                                onChange={e =>
                                                                    setEditForm(prev => prev ? { ...prev, [key]: Number(e.target.value) } : prev)
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
                                                                setEditForm(prev => prev ? { ...prev, [key]: e.target.value } : prev)
                                                            }
                                                        />
                                                    );
                                                };

                                                return (
                                                    <tr key={key1}>
                                                        <th style={{ whiteSpace: "nowrap", width: "15%" }}>{fieldNameMap[key1] || key1}</th>
                                                        <td>{renderInput(key1, value1)}</td>
                                                        {key2 ? (
                                                            <>
                                                                <th style={{ whiteSpace: "nowrap", width: "15%" }}>{fieldNameMap[key2] || key2}</th>
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
                        <div className={styles.customModal}>
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
                                                    // 日期类型
                                                    if (value instanceof Date)
                                                        return (
                                                            <input
                                                                type="date"
                                                                className={`${styles.editInput} form-control`}
                                                                value={value ? value.toISOString().split("T")[0] : ""}
                                                                onChange={e =>
                                                                    setCreateForm(prev => prev ? { ...prev, [key]: e.target.value ? new Date(e.target.value) : null } : prev)
                                                                }
                                                            />
                                                        );
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




            </div>
        </div>
    );
};

export default PotentialCustomer;