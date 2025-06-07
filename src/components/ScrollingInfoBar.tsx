import React, { useState, useEffect } from "react";

const ScrollingInfoBar: React.FC = () => {
  // 公告内容数组
  const announcements = [
    "公告1: 欢迎使用车险代理查询系统。",
    "公告2: 今日系统将进行例行维护。",
    "公告3: 请注意保单的截止时间。",
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // 每3秒切换一次公告
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % announcements.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [announcements.length]);

  return (
    <div
      className="alert alert-primary d-flex align-items-center justify-content-center"
      style={{
        height: "50px",
        marginBottom: "10px",
        fontSize: "16px",
        fontWeight: "bold",
        transition: "opacity 0.5s ease-in-out",
        textAlign: "center",
        color: "red", // 设置字体颜色为红色
        border: "1px solid #dee2e6", // 可选：增加边框
        borderRadius: "5px", // 圆角效果
      }}
    >
      {announcements[currentIndex]}
    </div>
  );
};

export default ScrollingInfoBar;