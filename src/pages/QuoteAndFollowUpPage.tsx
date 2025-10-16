// src/pages/QuoteAndFollowUpPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
    Button,
    DatePicker,
    Select,
    Space,
    Table,
    Typography,
    Divider,
    message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs, { Dayjs } from "dayjs";
import styles from "./QuoteAndFollowUpPage.module.css";

import {
    fetchStats,
    buildMMDDList,
    pivotWithZeroFill,
    inclusiveDays,
    MAX_DAYS,
    type PivotRow,
    type ReportResponseList,
} from "../api/quoteAndFollowUp";

// ✅ 复用你在其他页面使用过的组件
import { AgentSelectInput, SimpleUser } from "../utils/insuranceFormUtils";

const { RangePicker } = DatePicker;
const { Text } = Typography;

type QueryType = "报价" | "回访";

type Props = {
    /** 全量业务员列表（至少包含 displayName） */
    userList: Array<{ displayName: string;[k: string]: any }>;
};

/** 计算“上个 21 号”：
 * - 若今天 >= 21 号：取“本月 21 号”
 * - 若今天 < 21 号：取“上月 21 号”
 */
function getPrev21(today = dayjs()) {
    const d = today.date();
    return d >= 21 ? today.date(21).startOf("day") : today.subtract(1, "month").date(21).startOf("day");
}

const today = dayjs().startOf("day");
const defaultStart = getPrev21(today);
const defaultEnd = today;

/** 列宽：业务员单独宽度，其他（合计+日期）统一宽度 */
const AGENT_W = 90;
const COL_W = 60;

const QuoteAndFollowUpPage: React.FC<Props> = ({ userList }) => {
    const [type, setType] = useState<QueryType>("报价");

    // —— 业务员输入：由 AgentSelectInput 承担“输入+模糊+下拉选择” —— //
    const [agentInput, setAgentInput] = useState<string>("");

    const [range, setRange] = useState<[Dayjs, Dayjs]>([defaultStart, defaultEnd]);
    const [loading, setLoading] = useState(false);

    // 展示数据
    const [mmddCols, setMmddCols] = useState<string[]>(
        buildMMDDList(defaultStart.format("YYYY-MM-DD"), defaultEnd.format("YYYY-MM-DD"))
    );
    const [data, setData] = useState<PivotRow[]>([]);

    // 列：业务员 -> 合计 -> 日期
    const columns: ColumnsType<PivotRow> = useMemo(() => {
        const agentCol: ColumnsType<PivotRow> = [
            { title: "业务员", dataIndex: "agent", width: AGENT_W, ellipsis: true, fixed: "left" },
        ];
        const totalCol: ColumnsType<PivotRow> = [
            { title: "合计", dataIndex: "total", align: "right", width: COL_W },
        ];
        const dateCols: ColumnsType<PivotRow> = mmddCols.map((k) => ({
            title: k,
            dataIndex: k,
            align: "right",
            width: COL_W,
            render: (v: number) => (v ?? 0),
        }));
        return [...agentCol, ...totalCol, ...dateCols];
    }, [mmddCols]);

    // 横向滚动宽度：业务员 1 列 + 合计 1 列 + 日期 N 列
    const minScrollX = AGENT_W + (1 + mmddCols.length) * COL_W;

    const simpleUsers = useMemo<SimpleUser[]>(() => {
        return (userList || []).map((u, idx) => {
            const display =
                u.displayName || u.name || u.username || u.realName || ""; // 确保有可展示的名字

            const id =
                u.id ?? u.userId ?? u.username ?? u.email ?? `${display || "unknown"}-${idx}`;

            return {
                id: String(id),
                displayName: String(display),
            } as SimpleUser;
        });
    }, [userList]);

    // 查询
    const handleSearch = async () => {
        const [startD, endD] = range || [];
        if (!startD || !endD) {
            message.warning("请选择起始与结束日期");
            return;
        }
        const start = startD.format("YYYY-MM-DD");
        const end = endD.format("YYYY-MM-DD");

        // 180 天限制
        const days = inclusiveDays(start, end);
        if (days > MAX_DAYS) {
            message.error(`查询跨度最多 ${MAX_DAYS} 天，当前选择了 ${days} 天`);
            return;
        }

        // —— 业务员校验：不输入可查；输入了必须与列表精确匹配（忽略首尾空格） —— //
        const norm = (s: string) => (s || "").trim();
        const agentTrimmed = norm(agentInput);
        if (agentTrimmed) {
            const ok = (simpleUsers || []).some((u) => norm(u.displayName) === agentTrimmed);
            if (!ok) {
                message.error("请从下拉列表中选择有效的业务员");
                return;
            }
        }

        try {
            setLoading(true);

            // 1) 列头（MM-DD）
            const cols = buildMMDDList(start, end);
            setMmddCols(cols);

            // 2) 请求（不输入则不传 agent，表示全员）
            const resp: ReportResponseList = await fetchStats({
                start,
                end,
                agent: agentTrimmed || undefined,
                type,
            });

            // 3) 透视 + 补 0
            const table = pivotWithZeroFill(resp, cols);
            setData(table);
        } catch (e: any) {
            console.error(e);
            message.error(e?.message || "查询失败");
        } finally {
            setLoading(false);
        }
    };

    // 进入页面：默认“上个21号 → 今天”，直接拉一次真实数据（业务员留空）
    useEffect(() => {
        handleSearch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className={styles.container}>
            <Space className={styles.controls} size="middle">
                <span className={styles.field}>
                    <Text className={styles.label} type="secondary">
                        业务员：
                    </Text>
                    <div className={styles.agentPicker}>
                        <AgentSelectInput
                            value={agentInput}
                            userList={simpleUsers}
                            onPick={(picked, typed) => {
                                if (picked) {
                                    setAgentInput(picked.displayName);
                                } else {
                                    setAgentInput(typed || "");
                                }
                            }}
                        />
                    </div>
                </span>

                <span className={styles.field}>
                    <Text type="secondary">类型：</Text>
                    <Select<QueryType>
                        value={type}
                        onChange={setType}
                        className={styles.typeSelect}
                        options={[
                            { value: "报价", label: "报价" },
                            { value: "回访", label: "回访" },
                        ]}
                    />
                </span>

                <span className={styles.field}>
                    <Text type="secondary">日期范围（≤180 天）：</Text>
                    <RangePicker
                        value={range}
                        onChange={(v) => setRange(v as [Dayjs, Dayjs])}
                        allowClear={false}
                        inputReadOnly
                    />
                </span>

                <Button type="primary" onClick={handleSearch} loading={loading}>
                    查询
                </Button>
            </Space>

            <Divider className={styles.divider} />

            <div className={styles.tableWrap}>
                <Table<PivotRow>
                    size="small"
                    rowKey={(r) => r.agent}
                    loading={loading}
                    columns={columns}
                    dataSource={data}
                    scroll={{ x: minScrollX, y: 560 }}
                    pagination={false}
                    bordered
                    sticky
                />
            </div>

            <div className={styles.info}>
                <Text type="secondary">
                    当前列数：{mmddCols.length} 天；类型：{type}；{agentInput ? `业务员：${agentInput}` : "业务员：全部"}（日期显示为 MM-DD）
                </Text>
            </div>
        </div>
    );
};

export default QuoteAndFollowUpPage;
