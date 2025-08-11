// src/api/ranking.ts
import api from "./api"; // 这里就是你贴的 axios 实例

export type PaidStatus = "ALL" | "PAID" | "UNPAID";
export type RankType = "TOTAL" | "COMMERCIAL";

export interface RankingQuery {
  dateFrom: string;     // YYYY-MM-DD
  dateTo: string;       // YYYY-MM-DD
  paidStatus: PaidStatus;
  rankType: RankType;   // COMMERCIAL | TOTAL
  displayName?: string; // 本人（sales_agent）
}

export interface RankingItem {
  name: string;
  totalPremium: number;
}

export interface RankingResponse {
  rankingList: RankingItem[];
  selfRank: number | null;
  totalCount: number;
}

export async function fetchRankingStats(params: RankingQuery): Promise<RankingResponse> {
  const resp = await api.get<RankingResponse>("/ranking", {
    params: {
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      paidStatus: params.paidStatus,
      rankType: params.rankType,
      displayName: params.displayName ?? "",
    },
  });
  return resp.data;
}
