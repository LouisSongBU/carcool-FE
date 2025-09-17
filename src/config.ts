let API_BASE_URL: string;

if (import.meta.env.DEV) {
  // 开发环境 → 用相对路径，让 Vite proxy 转发
  API_BASE_URL = "/api";
} else {
  // 生产环境 → 用 env-config.js 或默认值
  API_BASE_URL =
    (window as any)?._env_?.API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:8080";
}

export default { API_BASE_URL };
