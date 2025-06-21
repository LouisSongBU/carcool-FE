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