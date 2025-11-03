import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'



// ✅ 引入 Bootstrap 样式
import 'bootstrap/dist/css/bootstrap.min.css'

// ✅ 引入 Bootstrap JS（包含 Popper.js，不需要单独引 jQuery/Popper）
// 注意：bootstrap.bundle.min.js 已经把 Popper 打包在里面了
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)