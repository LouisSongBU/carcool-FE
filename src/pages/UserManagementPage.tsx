import React, { useEffect, useState, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import { Table, Button } from "react-bootstrap";
import styles from './UserManagement.module.css';
import { getAllDepartments } from "../api/DepartmentApi";
import { editUser, resetUserPassword, addUser } from "../api/UserApi";
import { UserItem } from "../App";
import { toast } from "react-toastify";

type DepartmentItem = { id: number; deptCode: string; deptName: string; };
type UserManagementPageProps = {
  userList: UserItem[];
  onUpdate: () => void;
};

// 通用下拉Portal组件
const DROPDOWN_MAX_HEIGHT = 240;

const ManagerDropdownPortal = ({
  show,
  pos,
  options,
  onSelect,
  onNoManager
}: {
  show: boolean;
  pos: { left: number; top: number; width: number; up: boolean };
  options: UserItem[];
  onSelect: (item: UserItem) => void;
  onNoManager: () => void;
}) => {
  const dropdownRef = useRef<HTMLUListElement>(null);
  const [actualHeight, setActualHeight] = useState(DROPDOWN_MAX_HEIGHT);

  useEffect(() => {
    if (show && pos.up && dropdownRef.current) {
      setActualHeight(dropdownRef.current.offsetHeight);
    }
  }, [show, pos.up, options.length]);

  if (!show) return null;
  const style: React.CSSProperties = pos.up
  ? {
      position: "fixed",
      left: pos.left + "px",
      top: (pos.top - actualHeight - 4) + "px",
      width: pos.width + "px",
      maxHeight: DROPDOWN_MAX_HEIGHT + "px",
      overflowY: "auto",
      zIndex: 9999,
    }
  : {
      position: "fixed",
      left: pos.left + "px",
      top: pos.top + "px",
      width: pos.width + "px",
      maxHeight: DROPDOWN_MAX_HEIGHT + "px",
      overflowY: "auto",
      zIndex: 9999,
    };
  return ReactDOM.createPortal(
    <ul ref={dropdownRef} className={styles.agentDropdown} style={style}>
      {options.length === 0 ? (
        <li className={styles.noMatch}>无匹配</li>
      ) : options.map(a =>
        <li key={a.id} onMouseDown={e => {
          e.preventDefault();
          onSelect(a);
        }}>{a.displayName}</li>
      )}
      <li className={styles.divider}></li>
      <li className={styles.noManager} onMouseDown={onNoManager}>无主管</li>
    </ul>,
    document.body
  );
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
  const managerInputRef = useRef<HTMLInputElement>(null);
  const [managerDropdownPos, setManagerDropdownPos] = useState<{ left: number; top: number; width: number; up: boolean }>({
    left: 0,
    top: 0,
    width: 160,
    up: false
  });

  // 重置密码相关
  const [resetUser, setResetUser] = useState<UserItem | null>(null);
  const [resetPwdVisible, setResetPwdVisible] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetPwdError, setResetPwdError] = useState("");

  // 新增相关
  const [addingUser, setAddingUser] = useState(false);
  const [addForm, setAddForm] = useState<Partial<UserItem>>({});
  const [addManagerInput, setAddManagerInput] = useState("");
  const [addManagerDropdown, setAddManagerDropdown] = useState(false);
  const [addError, setAddError] = useState("");
  const addManagerInputRef = useRef<HTMLInputElement>(null);
  const [addManagerDropdownPos, setAddManagerDropdownPos] = useState<{ left: number; top: number; width: number; up: boolean }>({
    left: 0,
    top: 0,
    width: 160,
    up: false
  });
  

  const dropdownRef = useRef<HTMLUListElement>(null);
const [actualHeight, setActualHeight] = useState(DROPDOWN_MAX_HEIGHT);


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

  // 编辑主管筛选
  const filteredManagers = useMemo(() => (
    managerInput && managerInput !== "无主管"
      ? userList.filter(u => u.id !== editingUserId && u.displayName.includes(managerInput))
      : []
  ), [managerInput, userList, editingUserId]);

  // 编辑层级码匹配部门
  const matchedDept = useMemo(() => {
    if (!editForm.hierarchyCode || editForm.hierarchyCode.length < 4) return null;
    const prefix = editForm.hierarchyCode.slice(0, 4);
    return departmentList.find(dep => dep.deptCode === prefix) || null;
  }, [editForm.hierarchyCode, departmentList]);

  // 新增主管筛选
  const filteredAddManagers = addManagerInput && addManagerInput !== "无主管"
    ? userList.filter(u => u.displayName.includes(addManagerInput))
    : [];

  // 新增层级码匹配部门
  let matchedAddDept: DepartmentItem | null = null;
  if (addForm.hierarchyCode && addForm.hierarchyCode.length >= 4) {
    const prefix = addForm.hierarchyCode.slice(0, 4);
    matchedAddDept = departmentList.find(dep => dep.deptCode === prefix) || null;
  }

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
      toast.success("密码重置成功！");
    } catch {
      setResetPwdError("重置失败，请重试");
      toast.error("密码重置失败！");
    }
  };

  // --- 新增用户逻辑 ---
  const handleSaveAdd = async () => {
    let validManager = null;
    if (addManagerInput && addManagerInput !== "无主管") {
      validManager = userList.find(u => u.displayName === addManagerInput);
      if (!validManager) {
        setAddError("请选择下拉列表中存在的主管或无主管！");
        return;
      }
    }
    const deptId = matchedAddDept ? matchedAddDept.id : undefined;
    try {
      await addUser({
        username: addForm.username?.trim(),
        displayName: addForm.displayName?.trim(),
        managerId: addManagerInput === "无主管" || !addManagerInput ? null : validManager?.id,
        hierarchyCode: addForm.hierarchyCode?.trim(),
        departmentId: deptId,
      });
      setAddingUser(false);
      setAddForm({});
      setAddManagerInput("");
      setAddError("");
      await onUpdate();
      toast.success("新增用户成功！");
    } catch {
      setAddError("新增失败，请稍后再试");
      toast.error("新增用户失败！");
    }
  };

  const handleCancelAdd = () => {
    setAddingUser(false);
    setAddForm({});
    setAddManagerInput("");
    setAddError("");
  };

  // 下拉显示定位处理
  const showManagerDropdown = () => {
    setManagerDropdown(true);
    setTimeout(() => {
      const input = managerInputRef.current;
      if (input) {
        const rect = input.getBoundingClientRect();
        const winHeight = window.innerHeight;
        const spaceBelow = winHeight - rect.bottom;
        const spaceAbove = rect.top;
        const up = spaceBelow < DROPDOWN_MAX_HEIGHT && spaceAbove > DROPDOWN_MAX_HEIGHT;
        setManagerDropdownPos({
          left: rect.left,
          top: up ? rect.top : rect.bottom + 4,  // 注意top在向上时是input顶部
          width: rect.width,
          up
        });
      }
    }, 0);
  };
  
  const showAddManagerDropdown = () => {
    setAddManagerDropdown(true);
    setTimeout(() => {
      const input = addManagerInputRef.current;
      if (input) {
        const rect = input.getBoundingClientRect();
        const winHeight = window.innerHeight;
        const spaceBelow = winHeight - rect.bottom;
        const spaceAbove = rect.top;
        const up = spaceBelow < DROPDOWN_MAX_HEIGHT && spaceAbove > DROPDOWN_MAX_HEIGHT;
        setAddManagerDropdownPos({
          left: rect.left,
          top: up ? rect.top : rect.bottom + 4,
          width: rect.width,
          up
        });
      }
    }, 0);
  };
  

  // 渲染浮动编辑栏
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
            ref={managerInputRef}
            type="text"
            value={managerInput}
            placeholder="请输入主管姓名"
            autoComplete="off"
            onFocus={showManagerDropdown}
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
          {/* Portal下拉 */}
          <ManagerDropdownPortal
            show={managerDropdown}
            pos={managerDropdownPos}
            options={filteredManagers}
            onSelect={a => {
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
            }}
            onNoManager={() => {
              setManagerInput("无主管");
              setEditForm(f => ({ ...f, manager: null }));
              setManagerDropdown(false);
            }}
          />
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

  // 渲染新增行
  const renderAddRow = () => (
    <tr className={styles.editRowBg} key="addUserRow">
      <td>--</td>
      <td>
        <input
          value={addForm.username || ""}
          onChange={e => setAddForm(f => ({ ...f, username: e.target.value }))}
          placeholder="用户名"
        />
      </td>
      <td>
        <input
          value={addForm.displayName || ""}
          onChange={e => setAddForm(f => ({ ...f, displayName: e.target.value }))}
          placeholder="姓名"
        />
      </td>
      <td>
        <div style={{ position: "relative" }}>
          <input
            ref={addManagerInputRef}
            type="text"
            value={addManagerInput}
            placeholder="请输入主管姓名"
            autoComplete="off"
            onFocus={showAddManagerDropdown}
            onChange={e => {
              setAddManagerInput(e.target.value);
              setAddManagerDropdown(true);
              if (e.target.value === "无主管") {
                setAddForm(f => ({ ...f, manager: null }));
              }
            }}
            onBlur={() => setTimeout(() => setAddManagerDropdown(false), 120)}
            style={{ width: 110 }}
          />
          {/* Portal下拉 */}
          <ManagerDropdownPortal
            show={addManagerDropdown}
            pos={addManagerDropdownPos}
            options={filteredAddManagers}
            onSelect={a => {
              setAddManagerInput(a.displayName);
              setAddForm(f => ({
                ...f,
                manager: {
                  id: a.id,
                  username: a.username,
                  displayName: a.displayName,
                }
              }));
              setAddManagerDropdown(false);
            }}
            onNoManager={() => {
              setAddManagerInput("无主管");
              setAddForm(f => ({ ...f, manager: null }));
              setAddManagerDropdown(false);
            }}
          />
        </div>
      </td>
      <td>
        <input
          value={addForm.hierarchyCode || ""}
          onChange={e => setAddForm(f => ({ ...f, hierarchyCode: e.target.value }))}
          placeholder="层级码"
        />
      </td>
      <td>
        <input
          value={matchedAddDept ? matchedAddDept.deptName : ""}
          disabled
          placeholder="层级码前4位不匹配"
        />
      </td>
      <td colSpan={2}>
        {addError && <div className={styles.errorMsg}>{addError}</div>}
        <Button size="sm" variant="success" onClick={handleSaveAdd} style={{ marginRight: 4 }}>保存</Button>
        <Button size="sm" variant="outline-secondary" onClick={handleCancelAdd}>取消</Button>
      </td>
    </tr>
  );

  return (
    <div className={styles.container}>
      <div style={{ marginBottom: 5, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" size="sm" onClick={() => {
          setAddingUser(true);
          setAddForm({});
          setAddManagerInput("");
          setAddError("");
        }}>
          新增用户
        </Button>
      </div>
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
            {addingUser && renderAddRow()}
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
