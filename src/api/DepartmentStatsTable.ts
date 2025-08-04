import axios from "./api";

/** 部门接口 */
export interface Department {
  deptCode: string;
  deptName: string;
}

/** 业务员统计 */
export interface SalesmanStat {
  salesmanId: string;
  salesmanName: string;
  deptCode: string; // 归属部门，未分配为"OTHER"
  commercialPremium: number;
  compulsoryPremium: number;
  commercialCount: number;
  compulsoryCount: number;
  totalPolicyCount: number;
}

/** 获取全部部门列表 */
export async function fetchDepartments(): Promise<Department[]> {
  const res = await axios.get<Department[]>("/departments");
  return res.data;
}

/** 获取业务员统计数据 */
export interface SalesmanStatsParams {
    dateFrom?: string;
    dateTo?: string;
    paidStatus?: string; // 补充这一行！
  }
  
  export async function fetchSalesmanStats(params?: SalesmanStatsParams): Promise<SalesmanStat[]> {
    const res = await axios.get<SalesmanStat[]>("/salesman-stats", { params });
    return res.data;
  }
  
