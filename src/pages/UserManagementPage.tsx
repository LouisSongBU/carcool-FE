import React, { useEffect, useState, useMemo } from "react";
import { Table, Button } from "react-bootstrap";
import styles from './UserManagement.module.css';
import { getAllDepartments } from "../api/DepartmentApi";
import { editUser, resetUserPassword } from "../api/UserApi";
import { UserItem } from "../App";
import { toast } from "react-toastify";

type DepartmentItem = { id: number; deptCode: string; deptName: string; };
type UserManagementPageProps = {
    userList: UserItem[];
    onUpdate: () => void;
  };

  const UserManagementPage: React.FC<UserManagementPageProps> = ({ userList, onUpdate }) => {
  const [departmentMap, setDepartmentMap] = useState<Record<number, string>>({});
  const [departmentList, setDepartmentList] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 编辑相关
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserItem>>({});
  const [managerInput, setManagerInput] = useState("");
  const [managerDropdown, setManagerDropdown] = useState(false);
  const [editError, setEditError] = useState("");

  // 重置密码相关
  const [resetUser, setResetUser] = useState<UserItem | null>(null);
  const [resetPwdVisible, setResetPwdVisible] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetPwdError, setResetPwdError] = useState("");

  useEffect(() => { loadDepartments(); }, []);
  const loadDepartments = async () => {
    setLoading(true);
    try {
      const depRes = await getAllDepartments();
      const departmentArr: DepartmentItem[] = depRes.data || depRes || [];
      setDepartmentList(departmentArr);
      const depMap: Record<number, string> = {};
      departmentArr.forEach(dep => { depMap[dep.id] = dep.deptName; });
      setDepartmentMap(depMap);
    } finally { setLoading(false); }
  };

  // 主管下拉自动扩展逻辑
  const filteredManagers = useMemo(() => (
    managerInput && managerInput !== "无主管"
      ? userList.filter(u => u.id !== editingUserId && u.displayName.includes(managerInput))
      : []
  ), [managerInput, userList, editingUserId]);

  // 层级码前4自动匹配部门
  const matchedDept = useMemo(() => {
    if (!editForm.hierarchyCode || editForm.hierarchyCode.length < 4) return null;
    const prefix = editForm.hierarchyCode.slice(0, 4);
    return departmentList.find(dep => dep.deptCode === prefix) || null;
  }, [editForm.hierarchyCode, departmentList]);

  // --- 编辑逻辑 ---
  const handleEdit = (user: UserItem) => {
    setEditingUserId(user.id);
    setEditForm({ ...user });
    setManagerInput(user.manager?.displayName || "");
    setEditError("");
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditForm({});
    setManagerInput("");
    setEditError("");
  };

  const handleSave = async () => {
    let validManager = null;
    if (managerInput && managerInput !== "无主管") {
      validManager = userList.find(u => u.displayName === managerInput && u.id !== editingUserId);
      if (!validManager) {
        setEditError("请选择下拉列表中存在的主管或无主管！");
        return;
      }
    }
    const deptId = matchedDept ? matchedDept.id : undefined;
    const managerId = managerInput === "无主管" || !managerInput
      ? null
      : validManager?.id;
    try {
      await editUser(editForm.id as number, {
        ...editForm,
        managerId,
        departmentId: deptId,
      });
      handleCancelEdit();
      await onUpdate(); // 这里必须 await，等待数据刷新完
      toast.success("编辑保存成功！");
    } catch {
      setEditError("保存失败，请稍后再试");
      toast.error("编辑保存失败！");
    }
  };
  

  // --- 重置密码逻辑 ---
  const handleResetPassword = (user: UserItem) => {
    setResetUser(user);
    setResetPwdVisible(true);
    setNewPassword("");
    setResetPwdError("");
  };

  const handleSubmitResetPwd = async () => {
    if (!newPassword) {
      setResetPwdError("请输入新密码！");
      return;
    }
    try {
      await resetUserPassword(resetUser!.id, newPassword);
      setResetPwdVisible(false);
      setResetUser(null);
      setNewPassword("");
      setResetPwdError("");
      // 密码重置后可以 toast 提示
      toast.success("密码重置成功！");
    } catch {
      setResetPwdError("重置失败，请重试");
      toast.error("密码重置失败！");
    }
  };

  // 渲染浮动编辑栏（只显示当前正在编辑的用户）
  const renderEditRow = (user: UserItem) => (
    <tr className={styles.editRowBg} key={"edit_" + user.id}>
      <td>{user.id}</td>
      <td>{user.username}</td>
      <td>
        <input value={editForm.displayName || ""}
          onChange={e => setEditForm(f => ({ ...f, displayName: e.target.value }))}
        />
      </td>
      <td>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={managerInput}
            placeholder="请输入主管姓名"
            autoComplete="off"
            onFocus={() => setManagerDropdown(true)}
            onChange={e => {
              setManagerInput(e.target.value);
              setManagerDropdown(true);
              if (e.target.value === "无主管") {
                setEditForm(f => ({ ...f, manager: null }));
              }
            }}
            onBlur={() => setTimeout(() => setManagerDropdown(false), 120)}
            style={{ width: 110 }}
          />
          {managerDropdown && (
            <ul className={styles.agentDropdown}>
              {managerInput && managerInput !== "无主管"
                ? (
                  filteredManagers.length === 0
                    ? <li className={styles.noMatch}>无匹配</li>
                    : filteredManagers.map(a =>
                      <li key={a.id} onMouseDown={e => {
                        e.preventDefault();
                        setManagerInput(a.displayName);
                        setEditForm(f => ({
                          ...f,
                          manager: {
                            id: a.id,
                            username: a.username,
                            displayName: a.displayName,
                          }
                        }));
                        setManagerDropdown(false);
                      }}>{a.displayName}</li>
                    )
                ) : null
              }
              <li className={styles.divider}></li>
              <li
                className={styles.noManager}
                onMouseDown={() => {
                  setManagerInput("无主管");
                  setEditForm(f => ({ ...f, manager: null }));
                  setManagerDropdown(false);
                }}
              >无主管</li>
            </ul>
          )}
        </div>
      </td>
      <td>
        <input value={editForm.hierarchyCode || ""}
          onChange={e => setEditForm(f => ({ ...f, hierarchyCode: e.target.value }))}
        />
      </td>
      <td>
        <input
          value={matchedDept ? matchedDept.deptName : ""}
          disabled
          placeholder="层级码前4位不匹配"
        />
      </td>
      <td colSpan={2}>
        {editError && <div className={styles.errorMsg}>{editError}</div>}
        <Button size="sm" variant="success" onClick={handleSave} style={{ marginRight: 4 }}>保存</Button>
        <Button size="sm" variant="outline-secondary" onClick={handleCancelEdit}>取消</Button>
      </td>
    </tr>
  );

  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <Table bordered hover size="sm" className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>用户名</th>
              <th>姓名</th>
              <th>主管</th>
              <th>层级码</th>
              <th>部门</th>
              <th>编辑</th>
              <th>重置密码</th>
            </tr>
          </thead>
          <tbody>
            {userList.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center">
                  {loading ? "加载中..." : "暂无数据"}
                </td>
              </tr>
            ) : (
              userList.flatMap(user => [
                editingUserId === user.id
                  ? renderEditRow(user)
                  : (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{user.displayName}</td>
                      <td>
                        {user.manager
                          ? user.manager.displayName
                          : (user.manager === null && "无主管") || ""}
                      </td>
                      <td>{user.hierarchyCode || ""}</td>
                      <td>{user.departmentId ? departmentMap[user.departmentId] || "" : ""}</td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          className={styles.operateBtn}
                          onClick={() => handleEdit(user)}
                        >编辑</Button>
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="outline-warning"
                          className={styles.operateBtn}
                          onClick={() => handleResetPassword(user)}
                        >重置密码</Button>
                      </td>
                    </tr>
                  )
              ])
            )}
          </tbody>
        </Table>
      </div>
      {/* 重置密码浮窗 */}
      {resetPwdVisible && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.header}>重置密码</div>
            <div style={{ margin: "10px 0 14px 0" }}>
              为 <b>{resetUser?.displayName}</b> 设定新密码：<br />
              <input
                type="text"
                value={newPassword}
                placeholder="请输入新密码"
                onChange={e => setNewPassword(e.target.value)}
                style={{ width: 180, marginTop: 8 }}
              />
            </div>
            {resetPwdError && <div className={styles.errorMsg}>{resetPwdError}</div>}
            <div className={styles.btnRow}>
              <button onClick={() => setResetPwdVisible(false)}>取消</button>
              <button onClick={handleSubmitResetPwd}>确定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
