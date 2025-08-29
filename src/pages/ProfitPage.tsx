import React, { useEffect, useMemo, useState } from "react";
import {
  Card, Button, Typography, Space, Divider,
  Modal, Input, InputNumber, message, Spin
} from "antd";
import {
  LeftOutlined, RightOutlined, PlusOutlined,
  EditOutlined, DeleteOutlined
} from "@ant-design/icons";
import type { ProfitItem, PeriodSummary } from "../api/profitApi";
import {
  fetchPeriodSummary, addExpenseOrIncome, updateExpenseOrIncome, deleteExpenseOrIncome,
  fetchTemplates, addTemplate, updateTemplate, deleteTemplate, importTemplateToFixed
} from "../api/profitApi";
import styles from "./ProfitPage.module.css";

const { Title, Text } = Typography;
type PanelType = "INCOME" | "FIXED" | "TEMP";

const shiftPeriod = (periodId: string, deltaMonths: number): string => {
  const [y, m] = periodId.split("-").map(Number);
  const date = new Date(y, m - 1 + deltaMonths, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const ProfitPage: React.FC = () => {
  const now = new Date();
  const [periodId, setPeriodId] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,"0")}`);
  const [loading, setLoading] = useState(false);

  const [systemInsuranceProfit, setSystemInsuranceProfit] = useState(0);
  const [incomeItems, setIncomeItems] = useState<ProfitItem[]>([]);
  const [fixedItems, setFixedItems] = useState<ProfitItem[]>([]);
  const [tempItems, setTempItems] = useState<ProfitItem[]>([]);

  // 模板
  const [templateItems, setTemplateItems] = useState<ProfitItem[]>([]);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState("");
  const [tempAmount, setTempAmount] = useState<number | null>(null);

  // 条目新增/编辑
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<PanelType>("INCOME");
  const [editingItem, setEditingItem] = useState<ProfitItem | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formAmount, setFormAmount] = useState<number | null>(null);

  /** ========== 数据获取 ========== */
  const fetchData = () => {
    setLoading(true);
    fetchPeriodSummary(periodId)
      .then((res: PeriodSummary) => {
        setSystemInsuranceProfit(res.systemInsuranceProfit || 0);
        setIncomeItems(res.incomeItems || []);
        setFixedItems(res.fixedExpenseItems || []);
        setTempItems(res.tempExpenseItems || []);
      })
      .catch(() => message.error("获取账期数据失败"))
      .finally(() => setLoading(false));
  };
  useEffect(() => { fetchData(); }, [periodId]);

  const fetchTemplateData = () => {
    fetchTemplates()
      .then(setTemplateItems)
      .catch(() => message.error("获取模板失败"));
  };

  /** ========== 小计 ========== */
  const subtotalIncome = useMemo(() => systemInsuranceProfit + incomeItems.reduce((s, i) => s + (i.amount || 0), 0), [systemInsuranceProfit, incomeItems]);
  const subtotalFixed = useMemo(() => fixedItems.reduce((s, i) => s + (i.amount || 0), 0), [fixedItems]);
  const subtotalTemp = useMemo(() => tempItems.reduce((s, i) => s + (i.amount || 0), 0), [tempItems]);
  const netProfit = useMemo(() => subtotalIncome - subtotalFixed - subtotalTemp, [subtotalIncome, subtotalFixed, subtotalTemp]);

  /** ========== 条目操作 ========== */
  const openAdd = (type: PanelType) => { setEditingType(type); setEditingItem(null); setFormTitle(""); setFormAmount(null); setModalOpen(true); };
  const openEdit = (type: PanelType, item: ProfitItem) => { setEditingType(type); setEditingItem(item); setFormTitle(item.title); setFormAmount(item.amount); setModalOpen(true); };

  const saveItem = async () => {
    if (!formTitle.trim() || formAmount === null) { message.warning("请输入完整信息"); return; }
    setLoading(true);
    try {
      if (editingItem) {
        await updateExpenseOrIncome(editingItem.id, editingType, { ...editingItem, title: formTitle, amount: formAmount, type: editingType });
      } else {
        await addExpenseOrIncome({ id: "", title: formTitle, amount: formAmount, type: editingType }, periodId);
      }
      fetchData();
      setModalOpen(false);
    } catch { message.error("保存失败"); }
    finally { setLoading(false); }
  };
  const removeItem = async (id: string, type: string) => {
    setLoading(true);
    try { await deleteExpenseOrIncome(id, type); fetchData(); }
    catch { message.error("删除失败"); }
    finally { setLoading(false); }
  };

  /** ========== 模板操作 ========== */
  const openEditTemplate = (item: ProfitItem) => { 
    setEditingTemplateId(item.id); 
    setTempTitle(item.title); 
    setTempAmount(item.amount); 
  };

  const saveTemplateItem = async (id: string) => {
    if (!tempTitle.trim() || tempAmount === null) { message.warning("请输入完整信息"); return; }
    setLoading(true);
    try {
      if (id === "new") {
        await addTemplate({ id: "", title: tempTitle, amount: tempAmount });
      } else {
        await updateTemplate(id, { id, title: tempTitle, amount: tempAmount });
      }
      setEditingTemplateId(null); 
      fetchTemplateData();
    } catch { message.error("保存模板失败"); } finally { setLoading(false); }
  };

  const removeTemplateItem = async (id: string) => { 
    setLoading(true); 
    try { await deleteTemplate(id); fetchTemplateData(); } 
    catch { message.error("删除模板失败"); } 
    finally { setLoading(false); } 
  };

  const handleImportTemplate = async () => { 
    setLoading(true); 
    try { await importTemplateToFixed(periodId); fetchData(); } 
    catch { message.error("引入模板失败"); } 
    finally { setLoading(false); } 
  };

  return (
    <Spin spinning={loading} tip="加载中...">
      <div className={styles.pageWrap}>
        {/* 顶部条：账期切换 */}
        <div className={styles.topBar}>
          <Space>
            <Button icon={<LeftOutlined />} onClick={() => setPeriodId(shiftPeriod(periodId, -1))} />
            <Title level={4}>{periodId}</Title>
            <Button icon={<RightOutlined />} onClick={() => setPeriodId(shiftPeriod(periodId, 1))} />
          </Space>
        </div>

        {/* 三卡横排 */}
        <div className={styles.cardsWrap}>
          {/* 收入 */}
          <div>
            <Card title="收入" className={styles.glassCard}
              extra={<Button type="primary" ghost icon={<PlusOutlined />} onClick={() => openAdd("INCOME")}>新增</Button>}>
              <div className={styles.cardBodyScrollable}>
                <div className={styles.itemRow}><div className={styles.itemLeft}><Text strong>车险利润（系统计算）</Text></div>
                  <div className={styles.itemRight}><span className={styles.amount}>{systemInsuranceProfit.toFixed(2)}</span></div></div>
                {incomeItems.map(item => (
                  <div className={styles.itemRow} key={item.id}>
                    <div className={styles.itemLeft}><span className={styles.ellipsis}>{item.title}</span></div>
                    <div className={styles.itemRight}>
                      <span className={styles.amount}>{item.amount.toFixed(2)}</span>
                      <div className={styles.actions}>
                        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit("INCOME", item)} />
                        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeItem(item.id, "INCOME")} />
                      </div>
                    </div>
                  </div>
                ))}
              </div><Divider />
            </Card>
            <div className={styles.subtotal}><Text strong>小计：{subtotalIncome.toFixed(2)}</Text></div>
          </div>

          {/* 固定支出 */}
          <div>
            <Card title="固定支出" className={styles.glassCardOrange}
              extra={<Space className={styles.cardHeaderButtons}>
                <Button onClick={() => { setTemplateModalOpen(true); fetchTemplateData(); }}>编辑模板</Button>
                <Button onClick={handleImportTemplate} disabled={fixedItems.length > 0}>引入模板</Button>
                <Button type="primary" ghost icon={<PlusOutlined />} onClick={() => openAdd("FIXED")}>新增</Button>
              </Space>}>
              <div className={styles.cardBodyScrollable}>
                {fixedItems.map(item => (
                  <div className={styles.itemRow} key={item.id}>
                    <div className={styles.itemLeft}><span className={styles.ellipsis}>{item.title}</span></div>
                    <div className={styles.itemRight}>
                      <span className={styles.amount}>{item.amount.toFixed(2)}</span>
                      <div className={styles.actions}>
                        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit("FIXED", item)} />
                        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeItem(item.id, "FIXED")} />
                      </div>
                    </div>
                  </div>
                ))}
              </div><Divider />
            </Card>
            <div className={styles.subtotal}><Text strong>小计：{subtotalFixed.toFixed(2)}</Text></div>
          </div>

          {/* 临时支出 */}
          <div>
            <Card title="当月临时支出" className={styles.glassCardPink}
              extra={<Button type="primary" ghost icon={<PlusOutlined />} onClick={() => openAdd("TEMP")}>新增</Button>}>
              <div className={styles.cardBodyScrollable}>
                {tempItems.map(item => (
                  <div className={styles.itemRow} key={item.id}>
                    <div className={styles.itemLeft}><span className={styles.ellipsis}>{item.title}</span></div>
                    <div className={styles.itemRight}>
                      <span className={styles.amount}>{item.amount.toFixed(2)}</span>
                      <div className={styles.actions}>
                        <Button size="small" icon={<EditOutlined />} onClick={() => openEdit("TEMP", item)} />
                        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeItem(item.id, "TEMP")} />
                      </div>
                    </div>
                  </div>
                ))}
              </div><Divider />
            </Card>
            <div className={styles.subtotal}><Text strong>小计：{subtotalTemp.toFixed(2)}</Text></div>
          </div>
        </div>

        <Divider style={{ margin: "8px 0", borderColor: "#ccc" }} />
        <Title level={3} style={{ margin: 0 }}>当月纯利润：{netProfit.toFixed(2)}</Title>

        {/* 新增/编辑条目 */}
        <Modal title={editingItem ? "编辑条目" : "新增条目"} open={modalOpen} onOk={saveItem}
          onCancel={() => setModalOpen(false)} okText="保存" cancelText="取消" destroyOnClose>
          <div className={styles.formRow}><div className={styles.formLabel}>名称</div>
            <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} /></div>
          <div className={styles.formRow}><div className={styles.formLabel}>金额</div>
            <InputNumber className={styles.fullWidth} value={formAmount as number | null}
              onChange={(v) => setFormAmount(v as number | null)} controls={false} precision={2} min={0} /></div>
        </Modal>

        {/* 模板管理弹窗 */}
        <Modal title="编辑固定支出模板" open={templateModalOpen}
          onCancel={() => setTemplateModalOpen(false)} footer={null} destroyOnClose>
          <div className={styles.cardBodyScrollable}>
            {templateItems.map(item => {
              const isEditing = editingTemplateId === item.id;
              return (
                <div className={`${styles.itemRow} ${isEditing ? styles.editing : ""}`} key={item.id}>
                  <div className={styles.itemLeft}>
                    {isEditing ? (
                      <Input value={tempTitle} onChange={(e) => setTempTitle(e.target.value)} placeholder="名称" />
                    ) : (<span className={styles.ellipsis}>{item.title}</span>)}
                  </div>
                  <div className={styles.itemRight}>
                    {isEditing ? (
                      <InputNumber value={tempAmount as number | null} onChange={(v) => setTempAmount(v as number | null)}
                        precision={2} min={0} controls={false} style={{ marginRight: 8, width: 100 }} />
                    ) : (<span className={styles.amount}>{item.amount.toFixed(2)}</span>)}
                    <div className={styles.actions}>
                      {isEditing ? (
                        <>
                          <Button size="small" type="primary" onClick={() => saveTemplateItem(item.id)} style={{ marginRight: 4 }}>保存</Button>
                          <Button size="small" onClick={() => setEditingTemplateId(null)}>取消</Button>
                        </>
                      ) : (
                        <>
                          <Button size="small" icon={<EditOutlined />} onClick={() => openEditTemplate(item)} />
                          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removeTemplateItem(item.id)} />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 新增模板条目模式 */}
            {editingTemplateId === "new" && (
              <div className={`${styles.itemRow} ${styles.editing}`}>
                <div className={styles.itemLeft}>
                  <Input value={tempTitle} onChange={(e) => setTempTitle(e.target.value)} placeholder="名称" />
                </div>
                <div className={styles.itemRight}>
                  <InputNumber value={tempAmount as number | null}
                    onChange={(v) => setTempAmount(v as number | null)}
                    precision={2} min={0} controls={false} style={{ marginRight: 8, width: 100 }} />
                  <div className={styles.actions}>
                    <Button size="small" type="primary" onClick={() => saveTemplateItem("new")} style={{ marginRight: 4 }}>保存</Button>
                    <Button size="small" onClick={() => setEditingTemplateId(null)}>取消</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <Divider />
          <Button type="dashed" block icon={<PlusOutlined />}
            onClick={() => { setEditingTemplateId("new"); setTempTitle(""); setTempAmount(0); }}>
            新增模板条目
          </Button>
        </Modal>
      </div>
    </Spin>
  );
};

export default ProfitPage;
