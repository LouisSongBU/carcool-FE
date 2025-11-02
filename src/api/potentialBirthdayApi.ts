import api from "./api"; // 假设你的 axios 实例就叫 api

export type PagedResp<T = any> = {
    items: T[];
    total: number;
    page: number;
    size: number;
  };
  
  function normalize<T>(data: any, page: number, size: number): PagedResp<T> {
    if (Array.isArray(data)) {
      const items = data.slice((page - 1) * size, page * size);
      return { items, total: data.length, page, size };
    }
    const items = data?.items ?? [];
    const total = Number.isFinite(data?.total) ? data.total : items.length;
    return { items, total, page: data?.page ?? page, size: data?.size ?? size };
  }
  
  // 获取“希望生日”列表（支持分页；兼容老数组返回）
  export function fetchPotentialBirthdayList(
    displayName: string,
    page = 1,
    size = 100
  ): Promise<PagedResp> {
    return api
      .get("/potential-birthday/expirations", {
        params: { displayName, page, size },
      })
      .then((res) => normalize(res.data, page, size));
  }

  export async function fetchPotentialBirthdayAll() {
    const resp = await fetch(`/api/potential-birthday/export-all`, {
      credentials: "include",
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json() as Promise<any[]>; // 后端返回的 DTO 列表
  }

