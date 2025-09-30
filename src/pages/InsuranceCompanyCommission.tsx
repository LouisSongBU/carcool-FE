import React, { useEffect, useState } from "react";
import { Button, Form, Table, Modal, Row, Col } from "react-bootstrap";
import styles from './InsuranceCompanyCommission.module.css';
import { getCompanyList, addCompany, updateCompany, deleteCompany } from "../api/InsuranceCompanyCommission.ts";
import { exportXlsx, XlsxColumn } from "../utils/exportXlsx";

type InsuranceCompany = {
  id?: number;
  insuranceCompany: string;
  commercialCommission: number;
  compulsoryCommission: number;
  commercialServiceFee: number;
  compulsoryServiceFee: number;
  validStartDate: string;
  validEndDate: string;
};

type QueryParams = {
  insuranceCompany?: string;
  validDate?: string;
};

const emptyForm: InsuranceCompany = {
  insuranceCompany: "",
  commercialCommission: 0,
  compulsoryCommission: 0,
  commercialServiceFee: 0,
  compulsoryServiceFee: 0,
  validStartDate: "",
  validEndDate: "",
};

const exportColumns: XlsxColumn<InsuranceCompany>[] = [
  { title: "保险公司", key: "insuranceCompany" },
  { title: "商业佣金", key: "commercialCommission" },
  { title: "交强佣金", key: "compulsoryCommission" },
  { title: "商业手续费", key: "commercialServiceFee" },
  { title: "交强手续费", key: "compulsoryServiceFee" },
  { title: "有效期起", key: "validStartDate" },
  { title: "有效期止", key: "validEndDate" },
];

const InsuranceCompanyCommissionPage: React.FC = () => {
  const [list, setList] = useState<InsuranceCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState<QueryParams>({});
  const [editForm, setEditForm] = useState<InsuranceCompany | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 查询接口（可自行替换为 axios）
  const fetchList = async (params: QueryParams = {}) => {
    setLoading(true);
    try {
      const res = await getCompanyList(params);
      setList(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!list || list.length === 0) {
      alert("当前没有可导出的数据哦～");
      return;
    }
    exportXlsx<InsuranceCompany>(list, exportColumns, {
      filename: "保险公司提成"
    });
  };

  useEffect(() => {
    fetchList();
  }, []);

  // 查询按钮
  const handleSearch = () => {
    fetchList(query);
  };

  // 清除按钮
  const handleClear = () => {
    setQuery({});
    fetchList();
  };

  // 打开编辑/新增弹窗
  const openModal = (form?: InsuranceCompany) => {
    setEditForm(form ? { ...form } : { ...emptyForm });
    setModalVisible(true);
  };

  // 保存（新增或编辑）
  const handleSave = async () => {
    if (!editForm) return;
    let res;
    if (editForm.id) {
      res = await updateCompany(editForm.id, editForm);
    } else {
      res = await addCompany(editForm);
    }
    if (res.data.success) {
      setModalVisible(false);
      setEditForm(null); // 新增
      fetchList(query);
    } else {
      alert(res.data.message || "保存失败");
    }
  };

  // 删除
  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (!window.confirm("确认删除吗？")) return;
    await deleteCompany(id);
    fetchList(query);
  };

  return (
    <div className={styles.container}>
      <div className={styles.queryArea}>
        <Form as={Row} className="mb-0">
          <Col md={3}>
            <Form.Control
              placeholder="保险公司（支持模糊）"
              value={query.insuranceCompany || ""}
              onChange={e => setQuery(q => ({ ...q, insuranceCompany: e.target.value }))}
            />
          </Col>
          <Col md={3}>
            <Form.Control
              type="date"
              placeholder="生效日期"
              value={query.validDate || ""}
              onChange={e => setQuery(q => ({ ...q, validDate: e.target.value }))}
            />
          </Col>
          <Col md="auto">
            <Button variant="primary" size="sm" onClick={handleSearch} className={styles.operateBtn}>
              查询
            </Button>
            <Button variant="secondary" size="sm" onClick={handleClear} className={styles.operateBtn}>
              返回
            </Button>
            <Button variant="success" size="sm" onClick={() => openModal()} className={styles.operateBtn}>
              新增
            </Button>
            <Button
              variant="info"
              size="sm"
              onClick={handleDownloadCSV}
              className={styles.operateBtn}
            >
              导出
            </Button>
          </Col>
        </Form>
      </div>

      {/* 表格区 */}
      <div style={{ maxHeight: 600, overflow: "auto" }}>
        <Table bordered hover size="sm" className={styles.table}>
          <thead>
            <tr>
              <th>保险公司</th>
              <th>商业佣金</th>
              <th>交强佣金</th>
              <th>商业手续费</th>
              <th>交强手续费</th>
              <th>有效期起</th>
              <th>有效期止</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center">
                  {loading ? "加载中..." : "暂无数据"}
                </td>
              </tr>
            ) : (
              list.map(row => (
                <tr key={row.id}>
                  <td>{row.insuranceCompany}</td>
                  <td>{row.commercialCommission}</td>
                  <td>{row.compulsoryCommission}</td>
                  <td>{row.commercialServiceFee}</td>
                  <td>{row.compulsoryServiceFee}</td>
                  <td>{row.validStartDate}</td>
                  <td>{row.validEndDate}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline-primary"
                      className="me-1"
                      onClick={() => openModal(row)}
                    >
                      编辑
                    </Button>
                    <Button
                      size="sm"
                      variant="outline-danger"
                      onClick={() => handleDelete(row.id)}
                    >
                      删除
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      {/* 新增/编辑弹窗 */}
      <Modal show={modalVisible} onHide={() => { setModalVisible(false); setEditForm(null); }}>
        <Modal.Header closeButton>
          <Modal.Title>{editForm?.id ? "编辑" : "新增"}保险公司提成</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>保险公司</Form.Label>
              <Form.Control
                value={editForm?.insuranceCompany || ""}
                onChange={e =>
                  setEditForm(f => f && { ...f, insuranceCompany: e.target.value })
                }
                required
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>商业佣金</Form.Label>
              <Form.Control
                type="number"
                value={editForm?.commercialCommission ?? 0}
                onChange={e =>
                  setEditForm(f => f && { ...f, commercialCommission: +e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>交强佣金</Form.Label>
              <Form.Control
                type="number"
                value={editForm?.compulsoryCommission ?? 0}
                onChange={e =>
                  setEditForm(f => f && { ...f, compulsoryCommission: +e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>商业手续费</Form.Label>
              <Form.Control
                type="number"
                value={editForm?.commercialServiceFee ?? 0}
                onChange={e =>
                  setEditForm(f => f && { ...f, commercialServiceFee: +e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>交强手续费</Form.Label>
              <Form.Control
                type="number"
                value={editForm?.compulsoryServiceFee ?? 0}
                onChange={e =>
                  setEditForm(f => f && { ...f, compulsoryServiceFee: +e.target.value })
                }
              />
            </Form.Group>
            <Row>
              <Col>
                <Form.Group className="mb-2">
                  <Form.Label>有效期起</Form.Label>
                  <Form.Control
                    type="date"
                    value={editForm?.validStartDate || ""}
                    onChange={e =>
                      setEditForm(f => f && { ...f, validStartDate: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-2">
                  <Form.Label>有效期止</Form.Label>
                  <Form.Control
                    type="date"
                    value={editForm?.validEndDate || ""}
                    onChange={e =>
                      setEditForm(f => f && { ...f, validEndDate: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setModalVisible(false)}>
            取消
          </Button>
          <Button variant="primary" onClick={handleSave}>
            保存
          </Button>
        </Modal.Footer>
      </Modal>
    </div>

  );
};

export default InsuranceCompanyCommissionPage;
