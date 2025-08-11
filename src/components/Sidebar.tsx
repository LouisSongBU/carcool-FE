import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

type SidebarProps = {
  onMenuClick: (menu: string) => void;
};

const sections = [
  {
    title: "承保信息",
    items: ["车险客户", "希望客户"],
  },
  {
    title: "财务信息",
    items: ["提成维护", "工资结算"],
  },
  {
    title: "管理界面",
    items: ["管理用户"],
  },
  {
    title: "到期提醒",
    items: [
      "已保客户保险到期",
      "希望客户保险到期",
      "已保客户生日提醒",
      "希望客户生日提醒",
      "已保客户年检到期",
    ],
  },
  {
    title: "统计数据",
    items: ["部门统计","排名统计"],
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
};

const Sidebar: React.FC<SidebarProps> = ({ onMenuClick }) => {
  const [activeIndex, setActiveIndex] = React.useState(0);

  return (
    <div
      className="d-flex flex-column vh-100"
      style={{
        width: "280px",
        background: "#2c3e50",
        color: "white",
        boxShadow: "2px 0 8px rgba(0, 0, 0, 0.3)",
        padding: "15px",
        borderRight: "2px solid #34495e",
      }}
    >
      <div className="accordion" id="sidebarAccordion">
        {sections.map((section, index) => (
          <div className="accordion-item border-0 bg-transparent" key={index}>
            {/* 大标题 */}
            <h2 className="accordion-header">
              <button
                className={`accordion-button bg-transparent text-white d-flex align-items-center${activeIndex === index ? "" : " collapsed"}`}
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
                  <div className="accordion-body px-3 py-2">
                    {section.items.map((item, idx) => (
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
                        onClick={() => onMenuClick(item)}
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
                          className={`bi ${iconMap[item]} me-2`}
                          style={{ fontSize: "18px" }}
                        ></i>
                        {item}
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
