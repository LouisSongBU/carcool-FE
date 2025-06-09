import React, { useState } from "react";
import "./InsuranceDetails.css";

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
  approvedSeats: number;
  passengerCoverage: number;
  approvedLoad: number;
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
  remark: string;
  financeVerification: string;
  commercialAdjustment: number;
  compulsoryAdjustment: number;
}

const dateFields = new Set([
  "signingDate",
  "firstRegistrationDate",
  "inputDate",
  "policyStartDate"
]);

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
  remark: "是否对账",
  financeVerification: "财务验证",
  commercialAdjustment: "商业加减点",
  compulsoryAdjustment: "交强加减点"
};

const InsuranceCustomers: React.FC = () => {
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

  const [filterField, setFilterField] = useState("");
  const [filterOperator, setFilterOperator] = useState("=");
  const [filterValue, setFilterValue] = useState("");

  const isDateField = dateFields.has(filterField);

  const filterConditions = {
    issued: (item: any) => !item.commercialPolicyNumber.startsWith("QL"),
    notIssued: (item: any) => item.commercialPolicyNumber.startsWith("QL"),
    received: (item: any) => (item.receivedPremium ?? 0) > 0,
    notReceived: (item: any) => (item.receivedPremium ?? 0) == 0,
  };

  const [originalList, setOriginalList] = useState<InsuranceDetail[]>([
    {
      id: "00001",
      applicantName: "张三",
      commercialPolicyNumber: "QL00001",
      applicantIdNumber: "张三身份证号",
      compulsoryPolicyNumber: "B00001",
      insuredName: "张三2",
      signingDate: new Date(2025, 5, 5),
      insuredIdNumber: "张三2身份证号",
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
      approvedSeats: 4,
      passengerCoverage: 600,
      approvedLoad: 10,
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
      remark: "这是备注",
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
      approvedSeats: 4,
      passengerCoverage: 600,
      approvedLoad: 10,
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
      remark: "这是备注",
      financeVerification: "某人",
      commercialAdjustment: 1,
      compulsoryAdjustment: 2
    },
  ]);

  const [myList, setMyList] = useState(originalList);

  const [selectedDetail, setSelectedDetail] = useState<InsuranceDetail | null>(null);

  const [showList, setShowList] = useState(false);

  const [searchResult, setSearchResult] = useState(originalList); // 初始等于全部

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<InsuranceDetail | null>(null);

  const fieldOptions = Object.entries(fieldNameMap).map(([key, label]) => ({
    value: key,
    label
  }));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setQuery({ ...query, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    // 模拟查询操作
    console.log("查询按钮被点击");

    const result = originalList.filter((item) => {
      return (
        (query.insuredName === "" || item.insuredName.includes(query.insuredName)) &&
        (query.licensePlate === "" || item.licensePlate.includes(query.licensePlate))
      );
    });

    setSearchResult(result);
    setMyList(result);
    // 设置显示列表
    setShowList(true);
  };

  const handleCloseDetails = () => {
    setSelectedDetail(null);
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
        // 将日期字段格式化为 yyyy-MM-dd 再比较，避免时区和时间影响
        const rawDate = new Date(rawVal as Date);
        const rawStr = rawDate.toISOString().split("T")[0]; // 例如 "2020-05-28"
        val = rawStr;
        userInput = filterValue;
      } else if (typeof rawVal === "number") {
        val = rawVal;
        userInput = Number(filterValue);
      } else {
        val = String(rawVal);
      }

      // 比较逻辑
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

      // 更新高亮状态
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

  const handleSave = async () => {
    if (!editData) return;

    try {
      // 模拟调用接口，可以替换成真实 fetch('/api/update', { method: 'POST', ... })
      const response = await new Promise<{ success: boolean }>((resolve) =>
        setTimeout(() => resolve({ success: true }), 500)
      );

      if (response.success) {
        alert("修改成功");

        // ✅ 更新选中的详细信息
        setSelectedDetail(editData);

        setOriginalList((prev) =>
          prev.map((item) => (item.id === editData.id ? editData : item))
        );
        
        setSearchResult((prev) =>
          prev.map((item) => (item.id === editData.id ? editData : item))
        );
        
        setMyList((prev) =>
          prev.map((item) => (item.id === editData.id ? editData : item))
        );

      } else {
        alert("保存失败，请稍后再试");
      }
    } catch (err) {
      console.error("保存出错", err);
      alert("网络错误，请稍后再试");
    }

    // ✅ 关闭弹窗
    setIsEditing(false);
  };

  return (
    <div className="container mt-0" style={{ width: "100%", minWidth: "1200px" }}>
      <div className="row">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body search-box">
              <div className="row">
                <div className="col-md-12 d-flex align-items-center">
                  <label
                    htmlFor="insuredName"
                    className="form-label mb-0"
                    style={{ flexBasis: "20%", fontSize: "12px" }}
                  >
                    被保险人
                  </label>
                  <input
                    type="text"
                    id="insuredName"
                    name="insuredName"
                    value={query.insuredName}
                    onChange={handleInputChange}
                    className="form-control form-control-sm"
                    style={{ flexBasis: "40%", fontSize: "12px", margin: "" }}
                    placeholder="请输入姓名"
                  />
                  <label
                    htmlFor="licensePlate"
                    className="form-label mb-0 ml-1"
                    style={{ flexBasis: "20%", fontSize: "12px" }}
                  >
                    车牌号码
                  </label>
                  <input
                    type="text"
                    id="licensePlate"
                    name="licensePlate"
                    value={query.licensePlate}
                    onChange={handleInputChange}
                    className="form-control form-control-sm"
                    style={{ flexBasis: "40%", fontSize: "12px" }}
                    placeholder="请输入车牌号码"
                  />
                </div>
                <div className="col-md-12 d-flex align-items-center mt-1">
                  <label
                    htmlFor="signingStartDate"
                    className="form-label mb-2"
                    style={{ flexBasis: "16%", fontSize: "12px" }}
                  >
                    签单日期
                  </label>
                  <input
                    type="date"
                    id="signingStartDate"
                    name="signingStartDate"
                    value={query.signingStartDate}
                    onChange={handleInputChange}
                    className="form-control form-control-sm"
                    style={{ flexBasis: "37%", fontSize: "12px" }}
                  />
                  <p>&nbsp;至&nbsp;</p>
                  <input
                    type="date"
                    id="signingEndDate"
                    name="signingEndDate"
                    value={query.signingEndDate}
                    onChange={handleInputChange}
                    className="form-control form-control-sm"
                    style={{ flexBasis: "37%", fontSize: "12px" }}
                  />

                </div>
                <div className="col-md-12 d-flex align-items-center mt-1">
                  <label
                    htmlFor="policyStartDate"
                    className="form-label mb-2"
                    style={{ flexBasis: "15%", fontSize: "12px" }}
                  >
                    起保日期
                  </label>
                  <input
                    type="date"
                    id="policyStartDate"
                    name="policyStartDate"
                    value={query.policyStartDate}
                    onChange={handleInputChange}
                    className="form-control form-control-sm ml-1"
                    style={{ flexBasis: "37%", fontSize: "12px" }}
                  />
                  <p>&nbsp;至&nbsp;</p>
                  <input
                    type="date"
                    id="policyEndDate"
                    name="policyEndDate"
                    value={query.policyEndDate}
                    onChange={handleInputChange}
                    className="form-control form-control-sm"
                    style={{ flexBasis: "37%", fontSize: "12px" }}
                  />
                </div>
                <div className="col-md-12 d-flex align-items-center mt-1">
                  <label
                    htmlFor="policyNumber"
                    className="form-label mb-0"
                    style={{ flexBasis: "15%", fontSize: "12px" }}
                  >
                    保单号码
                  </label>
                  <input
                    type="text"
                    id="policyNumber"
                    name="policyNumber"
                    value={query.policyNumber}
                    onChange={handleInputChange}
                    className="form-control form-control-sm ml-1"
                    style={{ flexBasis: "85%" }}
                    placeholder="请输入保单号码"
                  />
                </div>
                <div className="col-md-12 d-flex align-items-center mt-1">
                  <label
                    htmlFor="salesman"
                    className="form-label mb-0"
                    style={{ flexBasis: "20%", fontSize: "12px" }}
                  >
                    业务员
                  </label>
                  <select
                    id="salesman"
                    name="salesman"
                    value={query.salesman}
                    onChange={handleInputChange}
                    className="form-select form-select-sm"
                    style={{ flexBasis: "50%" }}
                  >
                    <option value="">请选择业务员</option>
                    <option value="张三">张三</option>
                    <option value="李四">李四</option>
                  </select>
                  <button className="btn btn-primary ml-4" onClick={handleSearch}>
                    查询
                  </button>
                </div>
              </div>
            </div>
          </div>


          {showList && (
            <div className="card mt-1">
              <div className="card-body d-flex align-items-center flex-wrap filter-toolbar">

                <select
                  className="form-select form-select-sm"
                  value={filterField}
                  onChange={(e) => setFilterField(e.target.value)}
                  style={{ width: "150px" }}
                >
                  <option value="">选择字段</option>
                  {fieldOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <select
                  className="form-select form-select-sm"
                  value={isDateField ? "=" : filterOperator}
                  onChange={(e) => setFilterOperator(e.target.value)}
                  style={{ width: "100px" }}
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
                    className="form-control form-control-sm"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    style={{ width: "160px" }}
                  />
                ) : (
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    style={{ width: "160px" }}
                    placeholder="请输入条件"
                  />
                )}

                <button className="btn btn-sm btn-outline-primary" onClick={handleCustomFilter}>
                  从结果筛选
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => {
                    setFilterField("");
                    setFilterOperator("=");
                    setFilterValue("");
                    setMyList(searchResult); // 还原为上次搜索结果
                  }}
                >
                  清除筛选
                </button>
              </div>
            </div>
          )}

          {/* 查询结果卡片 */}
          {showList ? (
            <>
              <div className="card mt-1">
                <div className="card-body">
                  <div
                    className="table-responsive"
                    style={{ maxHeight: "300px", overflowY: "auto" }}
                  >
                    <table className="table table-striped table-bordered compact-table">
                      <thead className="table-light">
                        <tr>
                          <th></th>
                          <th style={{ whiteSpace: "nowrap" }}>被保险人</th>
                          <th style={{ whiteSpace: "nowrap" }}>身份证号码</th>
                          <th style={{ whiteSpace: "nowrap" }}>车牌号</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myList.map((item, index) => (
                          <tr
                            key={item.id}
                            onClick={() => {
                              const updatedItem = myList.find((i) => i.id === item.id);
                              if (updatedItem) {
                                setSelectedDetail(updatedItem);
                              }
                            }}
                          >
                            <td style={{ whiteSpace: "nowrap" }}>{index + 1}</td>
                            <td style={{ whiteSpace: "nowrap" }}>{item.insuredName}</td>
                            <td style={{ whiteSpace: "nowrap" }}>{item.insuredIdNumber}</td>
                            <td style={{ whiteSpace: "nowrap" }}>{item.licensePlate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p>点击查询按钮</p>
          )}

        </div>

        {/* 右侧部分 */}


        <div className="col-md-8">
          <div className="container">
            <div className="row">

              <div className="card">
                <div className="card-body">
                  <div className="d-flex flex-wrap align-items-center compact-checkbox-group">
                    <div className="form-check me-3">
                      <input
                        className={`form-check-input ${selectedDetail?.commercialPolicyNumber && !selectedDetail.commercialPolicyNumber.startsWith("QL") ? "highlight-green" : ""}`}
                        type="checkbox"
                        id="issued"
                        checked={filters.issued}
                        onChange={() => handleFilterChange("issued")}
                      />
                      <label className={`form-check-label ${selectedDetail?.commercialPolicyNumber && !selectedDetail.commercialPolicyNumber.startsWith("QL") ? "label-green" : ""}`} htmlFor="issued">
                        已出单
                      </label>
                    </div>
                    <div className="form-check me-3">
                      <input
                        className={`form-check-input ${selectedDetail?.commercialPolicyNumber && selectedDetail.commercialPolicyNumber.startsWith("QL") ? "highlight-yellow" : ""}`}
                        type="checkbox"
                        id="notIssued"
                        checked={filters.notIssued}
                        onChange={() => handleFilterChange("notIssued")}
                      />
                      <label className={`form-check-label ${selectedDetail?.commercialPolicyNumber && selectedDetail.commercialPolicyNumber.startsWith("QL") ? "label-yellow" : ""}`} htmlFor="notIssued">
                        未出单
                      </label>
                    </div>
                    <div className="form-check me-3">
                      <input
                        className={`form-check-input ${(selectedDetail?.receivedPremium ?? 0) > 0 ? "highlight-green" : ""
                          }`}
                        type="checkbox"
                        id="received"
                        checked={filters.received}
                        onChange={() => handleFilterChange("received")}
                      />
                      <label className={`form-check-label ${(selectedDetail?.receivedPremium ?? 0) > 0 ? "label-green" : ""
                        }`} htmlFor="received">
                        已收款
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className={`form-check-input ${(selectedDetail?.receivedPremium ?? 0) == 0 ? "highlight-yellow" : ""
                          }`}
                        type="checkbox"
                        id="notReceived"
                        checked={filters.notReceived}
                        onChange={() => handleFilterChange("notReceived")}
                      />
                      <label className={`form-check-label ${(selectedDetail?.receivedPremium ?? 0) == 0 ? "label-yellow" : ""
                        }`} htmlFor="notEffective">
                        未收款
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {selectedDetail && (
                <table className="table table-bordered table-hover custom-table">
                  <tbody>
                    {Object.entries(selectedDetail).map(([key, value], index) => {
                      const displayKey = fieldNameMap[key] || key;

                      return (
                        index % 2 === 0 && (
                          <tr key={index}>
                            <th className="text-primary">{displayKey}</th>
                            <td>
                              {value instanceof Date
                                ? value.toLocaleDateString()
                                : String(value)}
                            </td>
                            {/* 渲染下一个字段（若有） */}
                            {Object.entries(selectedDetail)[index + 1] ? (
                              <>
                                <th className="text-primary">
                                  {fieldNameMap[Object.entries(selectedDetail)[index + 1][0]] ||
                                    Object.entries(selectedDetail)[index + 1][0]}
                                </th>
                                <td>
                                  {Object.entries(selectedDetail)[index + 1][1] instanceof Date
                                    ? new Date(
                                      Object.entries(selectedDetail)[index + 1][1] as string
                                    ).toLocaleDateString()
                                    : String(Object.entries(selectedDetail)[index + 1][1])}
                                </td>
                              </>
                            ) : (
                              <>
                                <th></th>
                                <td></td>
                              </>
                            )}
                          </tr>
                        )
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* 按钮区 */}
              {selectedDetail && (
                <table className="table table-bordered table-sm mt-2" style={{ fontSize: "12px", width: "100%" }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "4px 8px" }}>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => {
                            console.log(selectedDetail); // 确认选中了某个对象
                            console.log("编辑按钮点击了"); // 确认按钮绑定成功
                            if (selectedDetail) {
                              setEditData({ ...selectedDetail });
                              setIsEditing(true);
                            }
                          }}
                        >
                          编辑
                        </button>
                      </td>
                      <td style={{ padding: "4px 8px" }}>
                        <button className="btn btn-sm btn-outline-secondary" disabled>
                          续保查询
                        </button>
                      </td>
                      <td style={{ padding: "4px 8px" }}>
                        <button className="btn btn-sm btn-outline-secondary" disabled>
                          打印
                        </button>
                      </td>
                      <td style={{ padding: "4px 8px" }}>
                        <button className="btn btn-sm btn-outline-secondary" disabled>
                          图片
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 编辑弹窗部分 */}
      {isEditing && editData && (
        <div className="custom-modal-overlay">
          <div className="custom-modal">
            <table className="table table-sm edit-table">
              <tbody>
                {Object.entries(editData).map(([key1, value1], index) => {
                  if (index % 2 !== 0) return null; // 只处理偶数行，跳过奇数

                  const key2 = Object.entries(editData)[index + 1]?.[0];
                  const value2 = Object.entries(editData)[index + 1]?.[1];

                  const renderInput = (key: string, value: any) => {

                    if (key === "id") {
                      return (
                        <input
                          type="text"
                          className="form-control form-control-sm edit-input"
                          value={value}
                          disabled
                        />
                      );
                    }

                    if (value instanceof Date) {
                      return (
                        <input
                          type="date"
                          className="form-control form-control-sm edit-input"
                          value={new Date(value).toISOString().split("T")[0]}
                          onChange={(e) => {
                            const date = new Date(e.target.value);
                            setEditData((prev) => prev ? { ...prev, [key]: date } : prev);
                          }}
                        />
                      );
                    } else if (typeof value === "number") {
                      return (
                        <input
                          type="number"
                          className="form-control form-control-sm edit-input"
                          value={value}
                          onChange={(e) =>
                            setEditData((prev) => prev ? { ...prev, [key]: Number(e.target.value) } : prev)
                          }
                        />
                      );
                    } else {
                      return (
                        <input
                          type="text"
                          className="form-control form-control-sm edit-input"
                          value={value}
                          onChange={(e) =>
                            setEditData((prev) => prev ? { ...prev, [key]: e.target.value } : prev)
                          }
                        />
                      );
                    }
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

            <div className="d-flex justify-content-end mt-2">
              <button className="btn btn-sm btn-secondary me-2" onClick={() => setIsEditing(false)}>
                取消
              </button>
              <button className="btn btn-sm btn-primary" onClick={handleSave}>
                保存更改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsuranceCustomers;