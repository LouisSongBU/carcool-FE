import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import styles from "./ScrollingInfoBar.module.css";
import { getTodayOrders } from "../api/scrollingInfoBar";

type Order = {
  salesAgent: string;
  insuranceCompany: string;
  commercialPremium: number;
  compulsoryPremium: number;
};

const DURATION = 10000;
const POLL_INTERVAL = 60000;

const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
const currentUser = userInfo.displayName || "";

const ScrollingInfoBar: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [announcements, setAnnouncements] = useState<string[]>(["加载中..."]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(
    null
  );

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  useEffect(() => {
    fetchOrders();
    pollRef.current = setInterval(fetchOrders, POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (paused || announcements.length <= 1) return;
    timerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, DURATION);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, paused, announcements]);

  const totalCount = orders.length;
  const totalCommercial = orders.reduce(
    (sum, o) => sum + (o.commercialPremium || 0),
    0
  );
  const totalCompulsory = orders.reduce(
    (sum, o) => sum + (o.compulsoryPremium || 0),
    0
  );

  const myOrders = orders.filter((o) => o.salesAgent === currentUser);
  const myCount = myOrders.length;
  const myCommercial = myOrders.reduce(
    (sum, o) => sum + (o.commercialPremium || 0),
    0
  );
  const myCompulsory = myOrders.reduce(
    (sum, o) => sum + (o.compulsoryPremium || 0),
    0
  );

  return (
    <div
      className={styles.scrollingBarOuter}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        setTooltipPos(null);
      }}
      onMouseMove={(e) => {
        const tooltipWidth = 320;
        const tooltipHeight = 160;
        const offset = 15;
        const margin = 10;

        let x = e.clientX + offset;
        let y = e.clientY + offset;

        // 检查右边界
        if (e.clientX + tooltipWidth + margin > window.innerWidth) {
          x = e.clientX - tooltipWidth - offset;
        }

        // 检查下边界
        if (e.clientY + tooltipHeight + margin > window.innerHeight) {
          y = e.clientY - tooltipHeight - offset;
        }

        setTooltipPos({ x, y });
      }}
    >
      <div className={styles.scrollingBarInner}>
        <span>{announcements[currentIndex]}</span>
      </div>

      {tooltipPos &&
        ReactDOM.createPortal(
          <div
            className={styles.statsTooltip}
            style={{ top: tooltipPos.y, left: tooltipPos.x }}
          >
            <table>
              <tbody>
                <tr>
                  <td>📊 今日总单数</td>
                  <td>{totalCount}</td>
                </tr>
                <tr>
                  <td>商业险总额</td>
                  <td>¥{totalCommercial.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>交强险总额</td>
                  <td>¥{totalCompulsory.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>👤 我的出单数</td>
                  <td>{myCount}</td>
                </tr>
                <tr>
                  <td>我的商业险</td>
                  <td>¥{myCommercial.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>我的交强险</td>
                  <td>¥{myCompulsory.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>,
          document.body
        )}
    </div>
  );
};

export default ScrollingInfoBar;
