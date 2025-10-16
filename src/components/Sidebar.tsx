import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

type SidebarProps = {
  onMenuClick: (menu: string) => void;
};

// 定义类型
type MenuItem = { name: string; roles?: string[] };
type Section = { title: string; roles?: string[]; items: MenuItem[] };

const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");

// 兼容旧逻辑：hierarchyCode === "0" → superAdmin
const hierarchyCode = userInfo.hierarchyCode || "";
const isSuperAdmin = hierarchyCode === "0";
const userRole: string = isSuperAdmin ? "superAdmin" : (userInfo.role || "user");

const canAccess = (obj: { roles?: string[] }): boolean => {
  return !obj.roles || obj.roles.includes(userRole);
};

// 带 roles 的 sections 配置
const sections: Section[] = [
  {
    title: "承保信息",
    items: [
      { name: "车险客户" },
      { name: "希望客户" },
      { name: "报价回访统计" },
    ],
  },
  {
    title: "财务信息",
    items: [
      { name: "提成维护", roles: ["superAdmin"] }, // 只有超管能看
      { name: "工资结算" },                         // 所有人都能看
    ],
  },  
  {
    title: "管理界面",
    roles: ["superAdmin"],
    items: [{ name: "管理用户" }],
  },
  {
    title: "到期提醒",
    items: [
      { name: "已保客户保险到期" },
      { name: "希望客户保险到期" },
      { name: "已保客户生日提醒" },
      { name: "希望客户生日提醒" },
      { name: "已保客户年检到期" },
    ],
  },
  {
    title: "统计数据",
    items: [
      { name: "部门统计" },
      { name: "排名统计" },
      { name: "利润统计", roles: ["superAdmin"] }, // 只给超管
    ],
  },
];

const iconMap: Record<string, string> = {
  "车险客户": "bi-car-front-fill",
  "希望客户": "bi-people-fill",
  "提成维护": "bi-bar-chart-line-fill",
  "工资结算": "bi-currency-dollar",
  "管理用户": "bi-person-circle",
  "更改设置": "bi-gear-fill",
  "已保客户保险到期": "bi-calendar-x",
  "希望客户保险到期": "bi-calendar-x-fill",
  "已保客户生日提醒": "bi-cake2",
  "希望客户生日提醒": "bi-gift",
  "已保客户年检到期": "bi-alarm",
  "部门统计": "bi-diagram-3-fill",
  "排名统计": "bi-bar-chart-fill",
  "利润统计": "bi-cash-stack",
  "报价回访统计": "bi-clipboard-check",
};

const Sidebar: React.FC<SidebarProps> = ({ onMenuClick }) => {
  const [activeIndex, setActiveIndex] = React.useState(0);

  return (
    <div
      className="d-flex flex-column vh-100"
      style={{
        width: "160px",
        background: "#2c3e50",
        color: "white",
        boxShadow: "2px 0 8px rgba(0, 0, 0, 0.3)",
        padding: "5px",
        borderRight: "2px solid #34495e",
      }}
    >
      <div className="accordion" id="sidebarAccordion">
        {sections.filter(canAccess).map((section, index) => (
          <div className="accordion-item border-0 bg-transparent" key={index}>
            {/* 大标题 */}
            <h2 className="accordion-header">
              <button
                className={`accordion-button bg-transparent text-white d-flex align-items-center${
                  activeIndex === index ? "" : " collapsed"
                }`}
                type="button"
                aria-expanded={activeIndex === index}
                aria-controls={`collapse-${index}`}
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  background: "linear-gradient(90deg, #34495e, #2c3e50)",
                  color: "#ecf0f1",
                  border: "1px solid #34495e",
                  borderRadius: "5px",
                  marginBottom: "8px",
                  transition: "all 0.3s ease",
                }}
                onClick={() =>
                  setActiveIndex(activeIndex === index ? -1 : index)
                }
              >
                <span className="me-auto">{section.title}</span>
              </button>
            </h2>

            {/* 子菜单动画 */}
            <AnimatePresence initial={false}>
              {activeIndex === index && (
                <motion.div
                  key={index}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="accordion-body px-1 py-2">
                    {section.items.filter(canAccess).map((item, idx) => (
                      <button
                        key={idx}
                        className="btn btn-link text-decoration-none text-white w-100 text-start d-flex align-items-center"
                        style={{
                          fontSize: "16px",
                          padding: "5px 10px",
                          marginBottom: "5px",
                          background: "#34495e",
                          color: "#ecf0f1",
                          borderRadius: "5px",
                          transition: "all 0.3s ease",
                        }}
                        onClick={() => onMenuClick(item.name)}
                        onMouseOver={(e) => {
                          (e.target as HTMLButtonElement).style.background =
                            "#3c566d";
                        }}
                        onMouseOut={(e) => {
                          (e.target as HTMLButtonElement).style.background =
                            "#34495e";
                        }}
                      >
                        {/* 图标 */}
                        <i
                          className={`bi ${iconMap[item.name]} me-2`}
                          style={{ fontSize: "18px" }}
                        ></i>
                        {item.name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
