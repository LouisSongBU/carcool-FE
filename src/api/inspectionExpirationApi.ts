import api from "./api"; // 假设你的 axios 实例就叫 api

// api/inspectionExpirationApi.ts
export type PagedResp<T> = {
    items: T[];
    total: number;
    page: number; // 1-based
    size: number;
  };
  
  export function fetchInspectionExpirationList(
    displayName: string,
    days: number,
    page: number,
    size: number
  ) {
    return api
      .get<PagedResp<any>>("/inspection-expiration/expirations", {
        params: { displayName, days, page, size },
      })
      .then((res) => res.data);
  }
  

// 所有参数都放 body 里
export function updateInspectionExpirationDay(displayName: string, days: number) {
    return api.post('/inspection-expiration/update-day', { displayName, days })
        .then(res => res.data);
}

export async function fetchInspectionExpirationAll(days: number) {
  const resp = await fetch(`/api/inspection-expiration/export-all?days=${days}`, {
    credentials: "include",
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json() as Promise<any[]>; // 后端返回的 DTO 列表
}