import React, { useEffect, useRef, useState } from "react";
import styles from "./ScrollingInfoBar.module.css";

const announcements = [
  "公告1：欢迎使用车险代理查询系统。告1：欢迎使用车险代理查询系统。告1：欢迎使用车险代理查询系统。告1：欢迎使用车险代理查询系统。告1：欢迎使用车险代理查询系统。",
  "公告2：系统今晚10点维护，请提前保存数据。",
  "公告3：请及时补全客户信息以免理赔受阻，谢谢合作。",
  "这是超长内容测试，这是超长内容测试，这是超长内容测试，这是超长内容测试，这是超长内容测试。"
];

const DURATION = 10000; // 每条显示10秒

const ScrollingInfoBar: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  // 切换内容
  useEffect(() => {
    if (paused) return; // 暂停时不切换
    timerRef.current = window.setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, DURATION);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, paused]);

  // 鼠标移入/移出
  const handleMouseEnter = () => setPaused(true);
  const handleMouseLeave = () => setPaused(false);

  return (
    <div
      className={styles.scrollingBarOuter}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={styles.scrollingBarInner}>
        <span>{announcements[currentIndex]}</span>
      </div>
    </div>
  );
};

export default ScrollingInfoBar;
