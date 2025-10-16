import api from "./api";
import type { InsuranceDetail } from "../pages/InsuranceDetails";

// 查询所有
  export function fetchInsuranceDetails(params: Record<string, any>) {
    return api.get("/insurance-details/list", { params });
  }

// 查询详情
export function fetchInsuranceDetailById(id: number | string) {
  return api.get(`/insurance-details/${id}`);
}

// 新增
export function addInsuranceDetail(detail: InsuranceDetail) {
  return api.post("/insurance-details/add", detail);
}

// 更新
export function updateInsuranceDetail(detail: InsuranceDetail) {
  return api.post("/insurance-details/update", detail);
}

// 删除
export function deleteInsuranceDetail(id: number | string) {
  return api.delete(`/insurance-details/delete/${id}`);
}

export async function confirmIssueInsuranceDetail(detail: InsuranceDetail) {
  const res = await api.post('/insurance-details/confirmIssue', detail);
  return res.data;
}

export function fetchInsuranceHistory(params: { licensePlate: string, engineNumber: string, limit?: number }) {
  return api.get('/insurance-details/history', {
    params: {
      licensePlate: params.licensePlate,
      engineNumber: params.engineNumber,
      limit: params.limit ?? 10
    }
  });
}

// 上传图片
export function uploadInsuranceImage({ detailId, file }: { detailId: string; file: File }) {
  const formData = new FormData();
  formData.append("detailId", detailId);
  formData.append("file", file);
  return api.post('/insurance-details/uploadImage', formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then(res => res.data);
}

// 获取所有图片
export function fetchInsuranceImages(detailId: string) {
  return api.get(`/insurance-details/images`, {
    params: { detailId }
  }).then(res => res.data);
}

// 删除图片
export function deleteInsuranceImage(imageId: string) {
  return api.delete(`/insurance-details/image/${imageId}`).then(res => res.data);
}

// 更新图片备注
export function updateInsuranceImageRemark(imageId: string, remark: string) {
  return api.post(`/insurance-details/image/${imageId}/remark`, { remark }).then(res => res.data);
}

// 上传身份证图片
export function uploadIdCardImage(file: File, insuredIdNumber: string, type: "face" | "back") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("insuredIdNumber", insuredIdNumber);
  formData.append("type", type);
  // 改为 /api/insurance-details/idcard-images/upload
  return api.post("/insurance-details/idcard-images/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
}

// 拉身份证图片
export function fetchIdCardImage(insuredIdNumber: string) {
  // 改为 /api/insurance-details/idcard-images
  return api.get(`/insurance-details/idcard-images?insuredIdNumber=${insuredIdNumber}`)
    .then(res => res.data);
}

// 查询日志
export function fetchInsuranceChangeLogs(detailId: string) {
  return api.get(`/insurance-details/change-log`, { params: { detailId } }).then(res => res.data);
}

export function saveInsuranceChangeLogs(logList: any[]) {
  return api.post(`/insurance-details/change-log`, logList).then(res => res.data);
}

// 只更新备注
export const updateInsuranceComment = (id: string, comment: string) =>
  api.post("/insurance-details/updateComment", { id, comment });


export function checkDuplicateLicensePlate(licensePlate: string, engineNumber: string, vinNumber: string) {
  return api.get("/insurance-details/checkDuplicate", {
    params: { licensePlate, engineNumber, vinNumber }
  });
}

export function searchInsuranceDetails(payload: {
  insuredName?: string;
  licensePlate?: string;
  signingDateStart?: string;
  signingDateEnd?: string;
  policyStartDateStart?: string;
  policyStartDateEnd?: string;
  policyNumber?: string;
  mobileOrPhone?: string;
  salesAgent?: string;
  customFilters?: CustomFilter[];
  page?: number;
  size?: number;   // 建议 1000
  sort?: string;   // 'id,desc'
}) {
  return api.post("/insurance-details/search", payload);
}

export type CustomFilter = {
  field: string;                          // 例如 "policyStartDate" / "licensePlate" / "receivedPremium"
  op: "=" | ">" | "<" | "like" | "not like";
  value: string;                          // 统一字符串；数值/日期由后端转换
};