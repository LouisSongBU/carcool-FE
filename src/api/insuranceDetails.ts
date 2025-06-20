import axios from "axios";
import type { InsuranceDetail } from "../pages/InsuranceDetails";

// 查询所有
export function fetchInsuranceDetails(params: Record<string, any>) {
    return axios.get("http://localhost:8080/api/insurance-details/list", { params });
  }

// 查询详情
export function fetchInsuranceDetailById(id: number | string) {
  return axios.get(`http://localhost:8080/api/insurance-details/${id}`);
}

// 新增
export function addInsuranceDetail(detail: InsuranceDetail) {
  return axios.post("http://localhost:8080/api/insurance-details/add", detail);
}

// 更新
export function updateInsuranceDetail(detail: InsuranceDetail) {
  return axios.post("http://localhost:8080/api/insurance-details/update", detail);
}

// 删除
export function deleteInsuranceDetail(id: number | string) {
  return axios.delete(`http://localhost:8080/api/insurance-details/delete/${id}`);
}