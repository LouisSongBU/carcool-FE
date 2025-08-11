import React, { useMemo, useState } from "react";
import { Row, Col, DatePicker, Select, Button, message, Spin } from "antd";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import ReactECharts from "echarts-for-react";

import { BarChart, CustomChart } from "echarts/charts";
import {
    TooltipComponent,
    GridComponent,
    TitleComponent,
    DatasetComponent,
    TransformComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import * as echarts from "echarts/core";
import { graphic } from "echarts/core";

import styles from "./RankingStats.module.css";
import {
    fetchRankingStats,
    type RankingItem,
    type RankingQuery,
} from "../api/ranking";

echarts.use([
    BarChart,
    CustomChart,
    TooltipComponent,
    GridComponent,
    TitleComponent,
    DatasetComponent,
    TransformComponent,
    CanvasRenderer,
]);

const getLast21st = () => {
    const today = dayjs();
    return today.date() >= 21 ? today.date(21) : today.subtract(1, "month").date(21);
};

type Hint = { title: string; icon: string; desc: string } | null;

const FancyRankingStats: React.FC = () => {
    const [dateFrom, setDateFrom] = useState<Dayjs>(getLast21st());
    const [dateTo, setDateTo] = useState<Dayjs>(dayjs());
    const [paidStatus, setPaidStatus] = useState<"ALL" | "PAID" | "UNPAID">("ALL");
    const [rankType, setRankType] = useState<"TOTAL" | "COMMERCIAL">("TOTAL");
    const [loading, setLoading] = useState(false);

    // 仅接收后端的“前10 + 本人(第11位，可重复)”与元信息
    const [rows, setRows] = useState<RankingItem[]>([]);
    const [selfRank, setSelfRank] = useState<number | null>(null);
    const [totalCount, setTotalCount] = useState<number>(0);

    async function handleRefresh() {
        if (!dateFrom || !dateTo) {
            message.error("请选择完整的起始日期和结束日期！");
            return;
        }
        setLoading(true);
        try {
            const userInfo = JSON.parse(sessionStorage.getItem("userInfo") || "{}");
            const params: RankingQuery = {
                dateFrom: dateFrom.format("YYYY-MM-DD"),
                dateTo: dateTo.format("YYYY-MM-DD"),
                paidStatus,
                rankType,
                displayName: userInfo?.displayName || "",
            };

            const data: any = await fetchRankingStats(params);
            // 期望结构：{ rankingList, selfRank, totalCount }
            setRows(Array.isArray(data?.rankingList) ? data.rankingList : Array.isArray(data) ? data : []);
            setSelfRank(
                typeof data?.selfRank === "number" && Number.isFinite(data.selfRank) ? data.selfRank : null
            );
            setTotalCount(
                typeof data?.totalCount === "number" && Number.isFinite(data.totalCount) ? data.totalCount : 0
            );
        } catch {
            message.error("排行榜数据加载失败");
        } finally {
            setLoading(false);
        }
    }

    React.useEffect(() => {
        handleRefresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { option, finalRowsCount, hint } = useMemo(() => {
        if (!Array.isArray(rows) || rows.length === 0) {
            return {
                finalRowsCount: 0,
                option: { xAxis: {}, yAxis: {}, series: [] },
                hint: null as Hint,
            };
        }

        // 指标选择（TOTAL 或 COMMERCIAL）
        const toNum = (v: number | string | undefined) => Number(v || 0);
        const metric = (r: RankingItem) => toNum(r.totalPremium);

        // 名称直接使用后端给的 name（包含“（本人）”与可能的重复）
        const rankIcons = ["🥇", "🥈", "🥉"];
        const names = rows.map((r, i) => {
            // 本人行（最后一行），用 selfRank 代替固定的 i+1
            if (i === rows.length - 1 && selfRank) {
                return `${selfRank}. ${r.name}`;
            }
            if (i < 3) return `${rankIcons[i]} ${i + 1}. ${r.name}`;
            return `${i + 1}. ${r.name}`;
        });

        // 提示文案，仅用 selfRank / totalCount（后端已给）
        let hint: Hint = null;
        if (selfRank && totalCount > 0) {
            if (selfRank <= 3) {
                hint = { title: "总业绩前三名", icon: "🏆", desc: "名列三甲！太优秀了，继续保持冲击第一！" };
            } else if (selfRank >= 6 && selfRank <= 10) {
                hint = { title: "第 6–10 名", icon: "💪", desc: "再加把劲，就能挤进前五！胜利近在眼前！" };
            } else if (selfRank > totalCount - 3) {
                hint = { title: "倒数三名", icon: "😅", desc: "目前处在末尾，要不要来一波逆袭？" };
            } else if (selfRank > 10) {
                hint = { title: "第 10 名开外", icon: "🚀", desc: "排名还在十名之外，加油，向前冲！" };
            } else {
                hint = { title: "前五在望", icon: "✨", desc: "状态不错，向前三名发起冲刺！" };
            }
        }

        const values = rows.map(metric);
        const max = Math.max(...values, 1);

        // custom 系列数据：这里只需值，是否本人不再由前端判定
        const customData = rows.map((r) => [metric(r), 0]); // 第二位占位，无语义

        // 背景整条（100% 灰底 + 圆角）
        const renderBackground = (params: any, api: any) => {
            const coordSys = params.coordSys;
            const yIdx = params.dataIndex;
            const yCenter = api.coord([0, yIdx])[1];
            const barH = Math.min(24, api.size([0, 1])[1] * 0.7);
            return {
                type: "rect",
                shape: {
                    x: coordSys.x,
                    y: yCenter - barH / 2,
                    width: coordSys.width,
                    height: barH,
                    r: 6,
                },
                style: { fill: "rgba(0,0,0,0.04)" },
                silent: true,
                z: 1,
            };
        };

        // 真实柱子（固定最大宽度的全局渐变）
        const renderBar = (params: any, api: any) => {
            const coordSys = params.coordSys;
            const value = Math.max(0, api.value(0));
            const yIdx = params.dataIndex;

            const x0 = api.coord([0, yIdx])[0];
            const x1 = api.coord([value, yIdx])[0];
            const yCenter = api.coord([0, yIdx])[1];
            const barW = Math.max(1, x1 - x0);
            const barH = Math.min(24, api.size([0, 1])[1] * 0.7);

            const grad = new graphic.LinearGradient(
                coordSys.x,
                0,
                coordSys.x + coordSys.width,
                0,
                [
                    { offset: 0, color: "#3A8DFF" },
                    { offset: 1, color: "#FF4D4F" },
                ],
                true // 全局像素坐标，固定 100% 渐变
            );

            return {
                type: "rect",
                shape: { x: x0, y: yCenter - barH / 2, width: barW, height: barH, r: 6 },
                style: { fill: grad },
                z: 3,
            };
        };

        const option = {
            animation: true,
            grid: { left: 32, right: 80, top: 16, bottom: 16, containLabel: true }, // 整体稍向左靠
            tooltip: {
                trigger: "axis",
                axisPointer: { type: "shadow" },
                valueFormatter: (v: any) => (typeof v === "number" ? v.toLocaleString() : v),
            },
            xAxis: {
                type: "value",
                axisLine: { show: false },
                splitLine: { show: true },
                max,
            },
            yAxis: {
                type: "category",
                data: names,
                inverse: true,
                axisTick: { show: false },
                axisLine: { show: false },
                axisLabel: { fontSize: 16, align: "right", margin: 4 },
            },
            series: [
                { type: "custom", renderItem: renderBackground, data: values, silent: true, z: 1 },
                { type: "custom", renderItem: renderBar, data: customData, z: 3, clip: true },
                {
                    // 透明标签层：负责右侧数字与 tooltip
                    type: "bar",
                    data: values,
                    barWidth: 20,
                    barGap: "-100%",
                    itemStyle: { color: "rgba(0,0,0,0)", borderRadius: [6, 6, 6, 6] },
                    label: {
                        show: true,
                        position: "right",
                        formatter: (p: any) => p.value?.toLocaleString?.() ?? p.value,
                    },
                    emphasis: { focus: "series" },
                },
            ],
        };

        return { option, finalRowsCount: rows.length, hint };
    }, [rows, rankType, selfRank, totalCount]);

    return (
        <div className={styles.container}>
            <div className={styles.toolbar}>
                <Row gutter={16} align="middle" wrap>
                    <Col className={styles.control}>
                        起始日期：
                        <DatePicker value={dateFrom} onChange={setDateFrom} className={styles.pickerSm} />
                    </Col>
                    <Col className={styles.control}>
                        结束日期：
                        <DatePicker value={dateTo} onChange={setDateTo} className={styles.pickerSm} />
                    </Col>
                    <Col className={styles.selectSm}>
                        收款状态：
                        <Select
                            value={paidStatus}
                            onChange={(v) => setPaidStatus(v)}
                            options={[
                                { label: "全部", value: "ALL" },
                                { label: "已收款", value: "PAID" },
                                { label: "未收款", value: "UNPAID" },
                            ]}
                        />
                    </Col>
                    <Col className={styles.selectMd}>
                        排行榜：
                        <Select
                            value={rankType}
                            onChange={(v) => setRankType(v)}
                            className={styles.selectMd}
                            options={[
                                { label: "商业+交强总额", value: "TOTAL" },
                                { label: "商业总额", value: "COMMERCIAL" },
                            ]}
                        />
                    </Col>
                    <Col>
                        <Button type="primary" onClick={handleRefresh} loading={loading}>
                            刷新图表
                        </Button>
                    </Col>
                </Row>
            </div>

            <div className={styles.chartWrap}>
                {/* 提示条（只依赖后端给的 selfRank / totalCount） */}
                {hint && (
                    <div className={styles.hintBox}>
                        <div className={styles.hintTitle}>
                            <span className={styles.hintIcon}>{hint.icon}</span>
                            {hint.title}
                        </div>
                        <div className={styles.hintDesc}>{hint.desc}</div>
                    </div>
                )}

                <Spin spinning={loading}>
                    <ReactECharts
                        option={option}
                        style={{ width: "100%", height: Math.max(460, finalRowsCount * 48) }}
                        notMerge
                        lazyUpdate
                    />
                </Spin>
            </div>
        </div>
    );
};

export default FancyRankingStats;
