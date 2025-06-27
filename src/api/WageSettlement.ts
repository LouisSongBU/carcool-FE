// commissionApi.ts
import api from "./api";
import type { CommissionSummary, CommissionDetail } from "../pages/WageSettlement";

export async function getCommissionData(params: {
  startDate?: string;
  endDate?: string;
  salesAgent?: string;
  paidStatus?: number;    // 0=未收款, 1=已收款
  settleStatus?: number;  // 0=未结提成, 1=已结提成
}) {
  const res = await api.get<{
    summary: CommissionSummary[];
    details: CommissionDetail[];
  }>("/commission/summary", { params });
  return res.data;
}

// 批量结算
export async function settleCommission(detailIds: string[], amounts: number[]) {
  const res = await api.post("/commission/settle", {
    detailIds,
    settleAmount: amounts,
  });
  return res.data;
}

export const batchPay = (params: { id: number; intermediaryInvoiceNo: number }[]): Promise<PayResult[]> =>
  api.post('/commission/batchPay', params).then(res => res.data);


export interface PayResult {
  id: number;
  intermediaryInvoiceNo: number;
  payStatus: string;
}