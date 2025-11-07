import React, { useEffect, useRef, useState } from "react";
import styles from "./ScrollingInfoBar.module.css";
import { getTodayOrders } from "../api/scrollingInfoBar";

type Order = {
  salesAgent: string;
  insuranceCompany: string;
  commercialPremium: number;
  compulsoryPremium: number;
};

const DURATION = 1000;      // 每条展示时间
const POLL_INTERVAL = 60000; // 轮询间隔

const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
const currentUser = userInfo.displayName || "";

const ScrollingInfoBar: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [announcements, setAnnouncements] = useState<string[]>(["加载中..."]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const add = (a: number, b: number) => Math.round((a + b) * 100) / 100;

  // 拉取订单数据
  const fetchOrders = async () => {
    try {
      const data: Order[] = await getTodayOrders();
      if (!data || data.length === 0) {
        setOrders([]);
        setAnnouncements([
          "保持积极的心态，每天都是新的开始！",
          "坚持不懈，总会迎来好消息！",
          "新的一天，保持好心情！",
        ]);
      } else {
        setOrders(data);
        const msgs = data.map(
          (d, idx) =>
            `${idx + 1}. ${d.salesAgent} ${d.insuranceCompany} 商业险(${d.commercialPremium}) 交强险(${d.compulsoryPremium})`
        );
        setAnnouncements(msgs);
      }
      setCurrentIndex(0);
    } catch (err) {
      console.error("获取出单信息失败:", err);
      setAnnouncements(["加载失败，请稍后再试"]);
    }
  };

  // 初始化 + 定时轮询
  useEffect(() => {
    fetchOrders();
    pollRef.current = setInterval(fetchOrders, POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // 自动切换
  useEffect(() => {
    if (announcements.length <= 1) return;
    timerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, DURATION);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, announcements]);

  return (
    <div
      className={styles.scrollingBarOuter}
      title={`总出单数: ${orders.length} | 商业险总额: ${orders.reduce((s, o) => add(s, o.commercialPremium), 0)} | 交强险总额: ${orders.reduce((s, o) => add(s, o.compulsoryPremium), 0)}
我 - 总出单数: ${orders.filter(o => o.salesAgent === currentUser).length} | 商业险总额: ${orders.filter(o => o.salesAgent === currentUser).reduce((s, o) => add(s, o.commercialPremium), 0)} | 交强险总额: ${orders.filter(o => o.salesAgent === currentUser).reduce((s, o) => add(s, o.compulsoryPremium), 0)}`}
    >
      <div className={styles.scrollingBarInner}>
        <span>{announcements[currentIndex]}</span>
      </div>
    </div>
  );

};

export default ScrollingInfoBar;
