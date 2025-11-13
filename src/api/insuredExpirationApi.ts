import api from "./api"; // 假设你的 axios 实例就叫 api

export type PagedResp<T = any> = {
    items: T[];
    total: number;
    page: number; // 1-based
    size: number;
  };
  
  // 统一归一化：后端若直接返回数组，转为 {items,total,page,size}
  function normalize<T>(data: any, page: number, size: number): PagedResp<T> {
    if (Array.isArray(data)) {
      const items = data.slice((page - 1) * size, page * size);
      return { items, total: data.length, page, size };
    }
    const items = data?.items ?? [];
    const total = Number.isFinite(data?.total) ? data.total : items.length;
    return { items, total, page: data?.page ?? page, size: data?.size ?? size };
  }
  
  // 获取“已保即将到期”列表（支持分页；兼容老数组返回）
  export function fetchInsuredExpirationList(
    displayName: string,
    days: number,
    page = 1,
    size = 100
  ): Promise<PagedResp> {
    return api
      .get("/insured-expiration/expirations", {
        params: { displayName, days, page, size },
      })
      .then((res) => normalize(res.data, page, size));
  }

// 所有参数都放 body 里
export function updateInsuredExpirationDay(displayName: string, days: number) {
    return api.post('/insured-expiration/update-day', { displayName, days })
        .then(res => res.data);
}

export async function fetchInsuredExpirationAllByDays(days: number) {
  const resp = await fetch(`/api/insured-expiration/export-all?days=${days}`, {
    credentials: "include",
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json() as Promise<any[]>; // 后端返回的 DTO 列表
}

// 新增：从“已保即将到期”的一行创建“希望客户”
export async function createPotentialFromInsured(payload: any) {
  const resp = await fetch("/api/insured-expiration/create-potential", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
     // 如果是 409（重复记录）
     if (resp.status === 409) {
      throw new Error("当前车辆同一天起保日期已经存在，请勿重复新增");
    }
    const msg = await resp.text().catch(() => "");
    throw new Error(msg || `HTTP ${resp.status}`);
  }
  return resp.json().catch(() => ({}));
}