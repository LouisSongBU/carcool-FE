import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

type SidebarProps = {
  onMenuClick: (menu: string) => void;
};

const Sidebar: React.FC<SidebarProps> = ({ onMenuClick }) => {
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
      items: ["管理用户", "更改设置"],
    },
  ];

  const iconMap: Record<string, string> = {
    "车险客户": "bi-car-front-fill",
    "希望客户": "bi-people-fill",
    "提成维护": "bi-bar-chart-line-fill",
    "工资结算": "bi-currency-dollar",
    "管理用户": "bi-person-circle",
    "更改设置": "bi-gear-fill",
  };

  return (
    <div
      className="d-flex flex-column vh-100"
      style={{
        width: "280px",
        background: "#2c3e50", // 深色背景
        color: "white",
        boxShadow: "2px 0 8px rgba(0, 0, 0, 0.3)",
        padding: "15px",
        borderRight: "2px solid #34495e", // 右侧边框
      }}
    >
      <div className="accordion" id="sidebarAccordion">
        {sections.map((section, index) => (
          <div className="accordion-item border-0 bg-transparent" key={index}>
            {/* 大标题 */}
            <h2 className="accordion-header">
              <button
                className="accordion-button collapsed bg-transparent text-white d-flex align-items-center"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target={`#collapse-${index}`}
                aria-expanded="true"
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
              >
                <span className="me-auto">{section.title}</span>
              </button>
            </h2>

            {/* 子菜单 */}
            <div
              id={`collapse-${index}`}
              className="accordion-collapse collapse show"
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
                    <i className={`bi ${iconMap[item]} me-2`} style={{ fontSize: "18px" }}></i>
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
