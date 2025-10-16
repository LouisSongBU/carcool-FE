// config.ts  —— 仅这一行的“默认值”改掉
let API_BASE_URL: string;

if (import.meta.env.DEV) {
  API_BASE_URL = "/api";            // 开发：照旧走 Vite 代理
} else {
  API_BASE_URL =
    (window as any)?._env_?.API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "/api";                         // 生产：默认同源 /api（不再是 http://localhost:8080）
}

export default { API_BASE_URL };
