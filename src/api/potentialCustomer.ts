import api from "./api";
import type { PotentialCustomer } from '../pages/PotentialCustomerDetails.tsx';

// 工具函数，保证输入格式为 "YYYY-MM-DD"，拼接时间段
function toDateTimeRange(date: string, type: 'start' | 'end') {
  if (!date) return '';
  return type === 'start'
    ? `${date}T00:00:00`
    : `${date}T23:59:59`;
}

// 按记录日期查询
export function fetchByRecordDate(
  recordTimeStart: string,
  recordTimeEnd: string,
  salesAgent?: string   // ✅ 新增参数
) {
  const recordTimeStartFull = toDateTimeRange(recordTimeStart, 'start');
  const recordTimeEndFull = toDateTimeRange(recordTimeEnd, 'end');
  return api.get('/potential-customers/byRecordTime', {
    params: { 
      recordTimeStart: recordTimeStartFull, 
      recordTimeEnd: recordTimeEndFull,
      salesAgent   // ✅ 只有普通用户才传，调用时控制
    }
  });
}

// 综合查询
export function fetchComprehensive(query: {
  recordTimeStart: string,
  recordTimeEnd: string,
  policyStartDateStart: string,
  policyStartDateEnd: string,
  salesAgent?: string   // ✅ 新增参数
}) {
  const params = {
    ...query,
    recordTimeStart: toDateTimeRange(query.recordTimeStart, 'start'),
    recordTimeEnd: toDateTimeRange(query.recordTimeEnd, 'end'),
    salesAgent: query.salesAgent   // ✅ 带给后端
  };
  return api.get('/potential-customers/byRecordTimeAndPolicyStartDate', { params });
}


export function updatePotentialCustomer(customer: PotentialCustomer) {
  return api.post("/potential-customers/update", customer);
}

export function addPotentialCustomer(customer: PotentialCustomer) {
  return api.post("/potential-customers/add", customer);
}

// 新增回访
export async function addFollowUpPotential(data: {
  potentialCustomerId: number;
  content: string;
  date: string;         // yyyy-mm-dd
  index?: number;       // 可选，回访序号，如果要后端生成可不传
}) {
  // 假设你的后端接口是 /api/follow_up_potential
  // 返回值示例：{ id, potentialCustomerId, content, date, index }
  const res = await api.post("/potential-customers/follow_up_potential/add", data);
  return { data: res.data }; // 保证用 data 字段
}

// 更新回访内容
export async function updateFollowUpPotential(data: { potentialCustomerId: number; index: number; content: string }) {
  // 如果后端 API 设计是 body 传这俩字段
  const res = await api.post('/potential-customers/follow_up_potential/update', {
    potentialCustomerId: data.potentialCustomerId,
    index: data.index,
    content: data.content,
  });
  return { data: res.data };
}

export async function fetchFollowUpPotentialList(potentialCustomerId: number) {
  // 假设后端接口是 GET /api/follow_up_potential/list?potentialCustomerId=xxx
  // 用你的实际api地址和参数
  return api.get(`/potential-customers/follow_up_potential/list`, { params: { potentialCustomerId } });
}

