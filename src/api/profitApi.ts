import api from "./api";

export interface ProfitItem {
  id: string; // 后端传 Long → 前端也用 string
  title: string;
  amount: number;
  type?: "FIXED" | "TEMP" | "INCOME";
}

export interface PeriodSummary {
  systemInsuranceProfit: number;
  incomeItems: ProfitItem[];
  fixedExpenseItems: ProfitItem[];
  tempExpenseItems: ProfitItem[];
}

/** 获取账期汇总 */
export const fetchPeriodSummary = async (periodId: string): Promise<PeriodSummary> => {
  const res = await api.get(`/profit/period/${periodId}`);
  return res.data;
};

/** 模板相关 */
export const fetchTemplates = async (): Promise<ProfitItem[]> => {
  const res = await api.get("/template");
  return res.data;
};
export const addTemplate = async (item: ProfitItem) => api.post("/template", item);
export const updateTemplate = async (id: string, item: ProfitItem) =>
  api.put(`/template/${id}`, item);
export const deleteTemplate = async (id: string) => api.delete(`/template/${id}`);
export const importTemplateToFixed = async (periodId: string) =>
  api.post(`/template/import?periodId=${periodId}`);

/** 收入/支出 CRUD（注意：都带 type 参数） */
export const addExpenseOrIncome = async (item: ProfitItem, periodId: string) =>
  api.post(`/profit/item?periodId=${periodId}`, item);

export const updateExpenseOrIncome = async (id: string, type: string, item: ProfitItem) =>
  api.put(`/profit/item/${id}?type=${type}`, item);

export const deleteExpenseOrIncome = async (id: string, type: string) =>
  api.delete(`/profit/item/${id}?type=${type}`);
