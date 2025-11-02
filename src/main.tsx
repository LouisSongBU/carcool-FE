// index.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";

const tree = (
  <ConfigProvider locale={zhCN}>
    <App />
  </ConfigProvider>
);

createRoot(document.getElementById("root")!).render(
  import.meta.env.DEV ? tree : <StrictMode>{tree}</StrictMode>
);
