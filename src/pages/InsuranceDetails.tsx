import React, { useState } from "react";
import styles from "./InsuranceDetails.module.css";

interface InsuranceDetail {
  id: string;
  applicantName: string;
  commercialPolicyNumber: string;
  applicantIdNumber: string;
  compulsoryPolicyNumber: string;
  insuredName: string;
  signingDate: Date;
  insuredIdNumber: string;
  vehicleDamageCoverage: number;
  registrationOwner: string;
  vehicleDamagePremium: number;
  registrationOwnerId: string;
  thirdPartyCoverage: number;
  licensePlate: string;
  thirdPartyPremium: number;
  vehicleModel: string;
  outMedCoverage: number;
  firstRegistrationDate: Date;
  outMedPremium: number;
  engineNumber: string;
  driverCoverage: number;
  vinNumber: string;
  driverPremium: number;
  approvedSeats: String;
  passengerCoverage: number;
  approvedLoad: String;
  passengerPremium: number;
  deliveryAddress: string;
  commercialPremium: number;
  phone: string;
  compulsoryPremium: number;
  mobile: string;
  driverAccidentPremium: number;
  salesAgent: string;
  vehicleTax: number;
  salesManager: string;
  receivablePremium: number;
  inputDate: Date;
  receivedPremium: number;
  intermediaryInvoiceNo: string;
  policyStartDate: Date;
  hierarchyCode: string;
  insuranceCompany: string;
  issuingOffice: string;
  isSettlement: string;
  financeVerification: string;
  commercialAdjustment: number;
  compulsoryAdjustment: number;
}


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


const fieldNameMap: Record<string, string> = {
  applicantName: "投保人",
  commercialPolicyNumber: "商业保单号",
  applicantIdNumber: "投保人证件号",
  compulsoryPolicyNumber: "交强保单号",
  insuredName: "被保险人",
  signingDate: "签单日期",
  insuredIdNumber: "被保险人证件",
  vehicleDamageCoverage: "车损保额",
  registrationOwner: "行驶证车主",
  vehicleDamagePremium: "车损保费",
  registrationOwnerId: "车主证件号",
  thirdPartyCoverage: "三者保额",
  licensePlate: "车牌号",
  thirdPartyPremium: "三者保费",
  vehicleModel: "厂牌型号",
  outMedCoverage: "医保外保额",
  firstRegistrationDate: "初登日期",
  outMedPremium: "医保外保费",
  engineNumber: "发动机号",
  driverCoverage: "司机保额",
  vinNumber: "车架号",
  driverPremium: "司机保费",
  approvedSeats: "核定座位",
  passengerCoverage: "乘客保额",
  approvedLoad: "核定吨位",
  passengerPremium: "乘客保费",
  deliveryAddress: "送单地址",
  commercialPremium: "商业保费",
  phone: "电话",
  compulsoryPremium: "交强保费",
  mobile: "手机",
  driverAccidentPremium: "驾意险保费",
  salesAgent: "业务员",
  vehicleTax: "车船税",
  salesManager: "业务主管",
  receivablePremium: "应收保费",
  inputDate: "录入日期",
  receivedPremium: "已收保费",
  intermediaryInvoiceNo: "中介票号",
  policyStartDate: "起保日期",
  hierarchyCode: "层级码",
  insuranceCompany: "保险公司",
  issuingOffice: "出单处",
  isSettlement: "是否对账",
  financeVerification: "财务验证",
  commercialAdjustment: "商业加减点",
  compulsoryAdjustment: "交强加减点"
};

// === 2. 组件主体 ===
const InsuranceCustomers: React.FC = () => {

  // === 3. useState区（变量声明顺序） ===
  // 查询/筛选相关
  const [query, setQuery] = useState({
    insuredName: "",
    licensePlate: "",
    signingStartDate: "",
    signingEndDate: "",
    policyStartDate: "",
    policyEndDate: "",
    policyNumber: "",
    salesman: "",
  });

  const [filterField, setFilterField] = useState("");
  const [filterOperator, setFilterOperator] = useState("=");
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

  // 详细信息数据相关
  const [originalList, setOriginalList] = useState<InsuranceDetail[]>([
    {
      id: "00001",
      applicantName: "张三",
      commercialPolicyNumber: "L00001",
      applicantIdNumber: "张三身份证号",
      compulsoryPolicyNumber: "B00001",
      insuredName: "张三2",
      signingDate: new Date(2025, 5, 5),
      insuredIdNumber: "张三222222222222222222",
      vehicleDamageCoverage: 100,
      registrationOwner: "张三3",
      vehicleDamagePremium: 100.03,
      registrationOwnerId: "张三3身份证号",
      thirdPartyCoverage: 200,
      licensePlate: "京A88888",
      thirdPartyPremium: 300,
      vehicleModel: "布加迪威龙",
      outMedCoverage: 400,
      firstRegistrationDate: new Date(2020, 4, 28),
      outMedPremium: 45.52,
      engineNumber: "GB34556",
      driverCoverage: 500,
      vinNumber: "VN236678",
      driverPremium: 76.09,
      approvedSeats: "4",
      passengerCoverage: 600,
      approvedLoad: "10",
      passengerPremium: 5442,
      deliveryAddress: "北京市",
      commercialPremium: 7777,
      phone: "44444-444",
      compulsoryPremium: 3231,
      mobile: "123455666",
      driverAccidentPremium: 444,
      salesAgent: "甲",
      vehicleTax: 400,
      salesManager: "甲+1",
      receivablePremium: 9787.44,
      inputDate: new Date(2020, 4, 28),
      receivedPremium: 0,
      intermediaryInvoiceNo: "N554544",
      policyStartDate: new Date(2020, 6, 3),
      hierarchyCode: "12356778",
      insuranceCompany: "太平洋",
      issuingOffice: "丰台",
      isSettlement: "这是备注",
      financeVerification: "某人",
      commercialAdjustment: 1,
      compulsoryAdjustment: 2
    },
    {
      id: "00002",
      applicantName: "李四",
      commercialPolicyNumber: "A00002",
      applicantIdNumber: "李四身份证号",
      compulsoryPolicyNumber: "B00002",
      insuredName: "李四2",
      signingDate: new Date(2025, 5, 5),
      insuredIdNumber: "李四2身份证号",
      vehicleDamageCoverage: 100,
      registrationOwner: "李四3",
      vehicleDamagePremium: 100.03,
      registrationOwnerId: "李四3身份证号",
      thirdPartyCoverage: 200,
      licensePlate: "京B66666",
      thirdPartyPremium: 300,
      vehicleModel: "su7",
      outMedCoverage: 400,
      firstRegistrationDate: new Date(2020, 4, 28),
      outMedPremium: 45.52,
      engineNumber: "GB34556",
      driverCoverage: 500,
      vinNumber: "VN236678",
      driverPremium: 76.09,
      approvedSeats: "4",
      passengerCoverage: 600,
      approvedLoad: "10",
      passengerPremium: 5442,
      deliveryAddress: "北京市",
      commercialPremium: 7777,
      phone: "44444-444",
      compulsoryPremium: 3231,
      mobile: "123455666",
      driverAccidentPremium: 444,
      salesAgent: "甲",
      vehicleTax: 400,
      salesManager: "甲+1",
      receivablePremium: 9787.44,
      inputDate: new Date(2020, 4, 28),
      receivedPremium: 8000,
      intermediaryInvoiceNo: "N554544",
      policyStartDate: new Date(2020, 6, 3),
      hierarchyCode: "12356778",
      insuranceCompany: "人保01",
      issuingOffice: "丰台",
      isSettlement: "这是备注",
      financeVerification: "某人",
      commercialAdjustment: 1,
      compulsoryAdjustment: 2
    },
  ]);

  const [myList, setMyList] = useState(originalList);
  const [searchResult, setSearchResult] = useState(originalList); // 初始等于全部

  // 详情、编辑相关
  const [selectedDetail, setSelectedDetail] = useState<InsuranceDetail | null>(null);
  const [showList, setShowList] = useState(false);
  const [loading, setLoading] = useState(false);

  // 权限、编辑、新增相关
  const [isAdmin, setIsAdmin] = useState(true); // 假设从后端取，默认false
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<InsuranceDetail | null>(null);
  const [editType, setEditType] = useState<"add" | "edit">("edit");
  const [showPrintModal, setShowPrintModal] = useState(false);

  // 其它
  const fieldOptions = Object.entries(fieldNameMap).map(([key, label]) => ({
    value: key,
    label
  }));

  // === 4. 业务逻辑区（派生变量/条件函数等） ===
  // 是否日期字段
  const isDateField = dateFields.has(filterField);

  const filterConditions = {
    notIssued: (item: any) =>
      item.commercialPolicyNumber.startsWith("QL") || item.commercialPolicyNumber.startsWith("L"),
    issued: (item: any) =>
      !(item.commercialPolicyNumber.startsWith("QL") || item.commercialPolicyNumber.startsWith("L")),
    received: (item: any) => (item.receivedPremium ?? 0) > 0,
    notReceived: (item: any) => (item.receivedPremium ?? 0) == 0,
  };

  // 判断是否能编辑
  const canEdit = isAdmin || (selectedDetail && selectedDetail.commercialPolicyNumber.startsWith("L"));

  // 获取新增数据模板,新增时不带id/商业号/交强号/所有number字段清空
  const getDefaultNewData = () => {
    if (!selectedDetail) return null;
    const omitKeys = ["id", "commercialPolicyNumber", "compulsoryPolicyNumber"];
    const newData: any = {};
    Object.entries(selectedDetail).forEach(([key, value]) => {
      if (omitKeys.includes(key)) {
        newData[key] = "不用填"; // 显示但不填内容
        return;
      }
      if (typeof value === "number") {
        newData[key] = 0;
      } else if (key === "inputDate") {
        newData[key] = new Date();
      } else {
        newData[key] = value;
      }
    });
    return newData;
  };

  // === 5. 事件处理函数区 ===
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setQuery({ ...query, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    setLoading(true);
    setShowList(false); // 每次点击先隐藏，再查出来
    // 模拟后端
    setTimeout(() => {
      const result = originalList.filter((item) => {
        return (
          (query.insuredName === "" || item.insuredName.includes(query.insuredName)) &&
          (query.licensePlate === "" || item.licensePlate.includes(query.licensePlate))
        );
      });
      setSearchResult(result);
      setMyList(result);
      setLoading(false);
      setShowList(true);
    }, 100); // 模拟100ms延迟
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
        const rawDate = new Date(rawVal as Date);
        const rawStr = rawDate.toISOString().split("T")[0];
        val = rawStr;
        userInput = filterValue;
      } else if (typeof rawVal === "number") {
        val = rawVal;
        userInput = Number(filterValue);
      } else {
        val = String(rawVal);
      }

      if (filterOperator === "=") return val === userInput;
      if (filterOperator === ">") return Number(val) > Number(userInput);
      if (filterOperator === "<") return Number(val) < Number(userInput);
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
        setMyList(originalList);
        setHighlightedFilters({ issued: false, received: false });
        return updatedFilters;
      }

      const filteredList = originalList.filter((item) =>
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
    const isAdd = !originalList.some(i => i.id === editData.id);
    try {
      await new Promise<{ success: boolean }>(resolve =>
        setTimeout(() => resolve({ success: true }), 500)
      );
      if (isAdd) {
        setOriginalList(prev => [editData, ...prev]);
        setSearchResult(prev => [editData, ...prev]);
        setMyList(prev => [editData, ...prev]);
        setSelectedDetail(editData);
      } else {
        setOriginalList(prev =>
          prev.map(item => item.id === editData.id ? editData : item)
        );
        setSearchResult(prev =>
          prev.map(item => item.id === editData.id ? editData : item)
        );
        setMyList(prev =>
          prev.map(item => item.id === editData.id ? editData : item)
        );
        setSelectedDetail(editData);
      }
      setIsEditing(false);
    } catch {
      alert("网络错误，请稍后再试");
    }
  };

  const handleCreateSave = async () => {
    if (false) {
      // 未来上线后直接启用后端API
      //await axios.post('/api/insurance/create', editData);
      //alert("新增成功！");
    } else {
      // 现在仅做本地模拟
      alert("新增成功！（本地模拟）");
    }
    setIsEditing(false);
  };

  const handleRenewQuery = () => {
    // TODO: 续保查询功能
  };

  const handleImage = () => {
    // TODO: 图片功能
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
          setEditData({ ...selectedDetail });
          setEditType("edit");
          setIsEditing(true);
        }}
        type="button"
      >编辑</button>

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
      <button className={styles.btn} type="button" onClick={handleImage}>图片</button>
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
                  name="signingStartDate"
                  value={query.signingStartDate}
                  onChange={handleInputChange}
                  className={`form-control form-control-sm ${styles.queryInput}`}
                />
                <span className={styles.queryText}>至</span>
                <input
                  type="date"
                  name="signingEndDate"
                  value={query.signingEndDate}
                  onChange={handleInputChange}
                  className={`form-control form-control-sm ${styles.queryInput}`}
                />
              </div>
              <div className={styles.queryRow}>
                <label className={styles.queryLabel}>起保日期</label>
                <input
                  type="date"
                  name="policyStartDate"
                  value={query.policyStartDate}
                  onChange={handleInputChange}
                  className={`form-control form-control-sm ${styles.queryInput}`}
                />
                <span className={styles.queryText}>至</span>
                <input
                  type="date"
                  name="policyEndDate"
                  value={query.policyEndDate}
                  onChange={handleInputChange}
                  className={`form-control form-control-sm ${styles.queryInput}`}
                />
              </div>
              <div className={styles.queryRow}>
                <label className={styles.queryLabel}>保单号码</label>
                <input
                  type="text"
                  name="policyNumber"
                  value={query.policyNumber}
                  onChange={handleInputChange}
                  className={`form-control form-control-sm ${styles.queryInput}`}
                  placeholder="请输入保单号码"
                />
              </div>
              <div className={styles.queryRow}>
                <label className={styles.queryLabel}>业务员</label>
                <select
                  name="salesman"
                  value={query.salesman}
                  onChange={handleInputChange}
                  className={`form-select form-select-sm ${styles.queryInput}`}
                >
                  <option value="">请选择</option>
                  <option value="张三">张三</option>
                  <option value="李四">李四</option>
                </select>
                <button className={`btn btn-primary btn-sm ${styles.queryBtn}`} onClick={handleSearch}>查询</button>
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
                        onClick={() => setSelectedDetail(item)}
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
                    // 过滤后的键值对
                    const visibleEntries = Object.entries(selectedDetail).filter(
                      ([key]) => isAdmin || !hiddenFieldsForUser.includes(key)
                    );

                    return (
                      <table className={`table table-bordered table-hover ${styles.customTable}`}>
                        <tbody>
                          {Array.from({ length: Math.ceil(visibleEntries.length / 2) }).map((_, rowIdx) => {
                            const idx = rowIdx * 2;
                            const [key1, value1] = visibleEntries[idx];
                            const [key2, value2] = visibleEntries[idx + 1] || [];
                            return (
                              <tr key={key1}>
                                <th className="text-primary">{fieldNameMap[key1] || key1}</th>
                                <td>
                                  {value1 instanceof Date
                                    ? value1.toLocaleDateString()
                                    : String(value1)}
                                </td>
                                {key2 ? (
                                  <>
                                    <th className="text-primary">{fieldNameMap[key2] || key2}</th>
                                    <td>
                                      {value2 instanceof Date
                                        ? value2.toLocaleDateString()
                                        : String(value2)}
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <th></th><td></td>
                                  </>
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
                    {(() => {
                      // 过滤不显示的字段
                      const visibleEditFields = Object.entries(editData).filter(
                        ([key]) => isAdmin || !hiddenFieldsForUser.includes(key)
                      );
                      // 两两分组渲染
                      return (
                        <table className={`table table-sm ${styles.editTable}`}>
                          <tbody>
                            {Array.from({ length: Math.ceil(visibleEditFields.length / 2) }).map((_, rowIdx) => {
                              const idx = rowIdx * 2;
                              const [key1, value1] = visibleEditFields[idx];
                              const [key2, value2] = visibleEditFields[idx + 1] || [];
                              const renderInput = (key: string, value: any) => {
                                if (key === "id")
                                  return (
                                    <input type="text" className={`${styles.editInput} form-control`} value={value} disabled />
                                  );
                                if (value instanceof Date)
                                  return (
                                    <input
                                      type="date"
                                      className={`${styles.editInput} form-control`}
                                      value={new Date(value).toISOString().split("T")[0]}
                                      onChange={e =>
                                        setEditData(prev => prev ? { ...prev, [key]: new Date(e.target.value) } : prev)
                                      }
                                    />
                                  );
                                if (typeof value === "number")
                                  return (
                                    <input
                                      type="number"
                                      className={`${styles.editInput} form-control`}
                                      value={value}
                                      onChange={e =>
                                        setEditData(prev => prev ? { ...prev, [key]: Number(e.target.value) } : prev)
                                      }
                                    />
                                  );
                                return (
                                  <input
                                    type="text"
                                    className={`${styles.editInput} form-control`}
                                    value={value}
                                    onChange={e =>
                                      setEditData(prev => prev ? { ...prev, [key]: e.target.value } : prev)
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
                            })}
                          </tbody>
                        </table>
                      );
                    })()}
                    <div className="d-flex justify-content-end mt-2">
                      <button className={styles.btn} onClick={() => setIsEditing(false)}>取消</button>
                      <button className={`${styles.btn} ${styles.btnPrimary} ms-2`} onClick={editType === "add" ? handleCreateSave : handleEditSave}>保存</button>
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
                          <span className={styles.printLine}>
                            {selectedDetail.policyStartDate instanceof Date
                              ? selectedDetail.policyStartDate.toLocaleDateString()
                              : selectedDetail.policyStartDate}
                          </span>
                        </div>
                      </div>
                      {/* 第三行 */}
                      <div className={styles.printRow}>
                        <div style={{ width: '100%', display: 'flex', alignItems: 'center' }}>投保险别</div>

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
                            ￥{selectedDetail.vehicleTax || '--'}
                          </span>
                        </div>
                      </div>
                      {/* 第五行 */}
                      <div className={styles.printRow}>
                        <div style={{ width: '33.33%', display: 'flex', alignItems: 'center' }}>
                          总计金额
                          <span className={styles.printLine}>
                            ￥{selectedDetail.commercialPremium + selectedDetail.compulsoryPremium + selectedDetail.vehicleTax + selectedDetail.vehicleTax ? selectedDetail.commercialPremium + selectedDetail.compulsoryPremium + selectedDetail.vehicleTax + selectedDetail.vehicleTax : '--'}
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

export default InsuranceCustomers;
