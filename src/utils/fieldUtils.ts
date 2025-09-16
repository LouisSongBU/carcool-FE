/**
* 过滤掉普通用户不应显示的字段
*/
export function getVisibleFields<T extends object>(
    data: T,
    isAdmin: boolean = true,
    hiddenFields: string[] = []
) {
    return Object.entries(data).filter(
        ([key]) => isAdmin || !hiddenFields.includes(key)
    );
}

export function groupEntriesInPairs(entries: [string, any][]) {
    return Array.from({ length: Math.ceil(entries.length / 2) }).map((_, rowIdx) => {
        const idx = rowIdx * 2;
        const pair: [[string, any], [string, any]?] = [entries[idx], entries[idx + 1]];
        return pair;
    });
}

export const insuranceDetailsNameMap: Record<string, string> = {
    applicantName: "投保人",
    commercialPolicyNumber: "商业保单号",
    applicantIdNumber: "投保人证件号",
    compulsoryPolicyNumber: "交强保单号",
    insuredName: "被保险人",
    signingDate: "签单日期",
    insuredIdNumber: "被保险人证件",
    vehicleDamageCoverage: "车损保额(万)",
    registrationOwner: "行驶证车主",
    vehicleDamagePremium: "车损保费",
    registrationOwnerId: "车主证件号",
    thirdPartyCoverage: "三者保额(万)",
    licensePlate: "车牌号",
    thirdPartyPremium: "三者保费",
    vehicleModel: "厂牌型号",
    outMedCoverage: "医保外保额(万)",
    firstRegistrationDate: "初登日期",
    outMedPremium: "医保外保费",
    engineNumber: "发动机号",
    driverCoverage: "司机保额(万)",
    vinNumber: "车架号",
    driverPremium: "司机保费",
    approvedSeats: "核定座位",
    passengerCoverage: "乘客保额(万)",
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
    compulsoryAdjustment: "交强加减点",
    comment:"备注"
    
};

export function getLocalDateFromInput(inputStr: string): Date | null {
    if (!inputStr) return null;
    const [y, m, d] = inputStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}

export const insuranceDetailFieldTypeMap: Record<string, "string" | "number" | "date" | "boolean" | "null"> = {
    id: "string",
    applicantName: "string",
    commercialPolicyNumber: "string",
    applicantIdNumber: "string",
    compulsoryPolicyNumber: "string",
    insuredName: "string",
    signingDate: "date",
    insuredIdNumber: "string",
    vehicleDamageCoverage: "number",
    registrationOwner: "string",
    vehicleDamagePremium: "number",
    registrationOwnerId: "string",
    thirdPartyCoverage: "number",
    licensePlate: "string",
    thirdPartyPremium: "number",
    vehicleModel: "string",
    outMedCoverage: "number",
    firstRegistrationDate: "date",
    outMedPremium: "number",
    engineNumber: "string",
    driverCoverage: "number",
    vinNumber: "string",
    driverPremium: "number",
    approvedSeats: "string",
    passengerCoverage: "number",
    approvedLoad: "string",
    passengerPremium: "number",
    deliveryAddress: "string",
    commercialPremium: "number",
    phone: "string",
    compulsoryPremium: "number",
    mobile: "string",
    driverAccidentPremium: "number",
    salesAgent: "string",
    vehicleTax: "number",
    salesManager: "string",
    receivablePremium: "number",
    inputDate: "date",
    receivedPremium: "number",
    intermediaryInvoiceNo: "number",
    policyStartDate: "date",
    hierarchyCode: "string",
    insuranceCompany: "string",
    issuingOffice: "string",
    isSettlement: "string",
    financeVerification: "string",
    commercialAdjustment: "number",
    compulsoryAdjustment: "number"
  };
  