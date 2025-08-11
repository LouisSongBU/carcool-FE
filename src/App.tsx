import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import WelcomeMessage from './components/WelcomeMessage';
import ScrollingInfoBar from './components/ScrollingInfoBar';
import MainContent from './components/MainContent';
import LoginPage from './LoginPage'; // 新加
import styles from './App.module.css';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import { getAllUsers } from './api/UserApi';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const pageTitles: Record<string, string> = {
  '车险客户': '车险客户信息',
  '希望客户': '希望客户信息',
  '提成维护': '提成维护',
  '工资结算': '工资结算',
  '已保客户保险到期': '到期提醒',
  '希望客户保险到期': '到期提醒',
  '已保客户生日提醒': '到期提醒',
  '希望客户生日提醒': '到期提醒',
  '已保客户年检到期': '到期提醒',
  '管理用户': '管理用户',
  '部门统计': '部门统计',
  '排名统计': '排名统计',
};

export type UserItem = {
  id: number;
  username: string;
  displayName: string;
  hierarchyCode?: string;
  departmentId?: number;
  manager?: {
    id: number;
    username: string;
    displayName: string;
  } | null;
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('车险客户');
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 新加登录状态
  const [userInfo, setUserInfo] = useState<any>(null); // 存用户信息对象
  const mainTitle = pageTitles[currentPage] || '系统主页';

  const [insuranceCompanies, setInsuranceCompanies] = useState<any[]>([]);
  const [userList, setUserList] = useState<UserItem[]>([]);

  const reloadUserList = async () => {
    try {
      const res = await getAllUsers();
      // 兼容返回值既可能是 AxiosResponse 也可能是数组
      let users: any[] = [];
      if (Array.isArray(res)) {
        users = res;
      } else if (Array.isArray(res.data)) {
        users = res.data;
      } else {
        // 其它异常结构
        users = [];
      }
      const onlyNeeded: UserItem[] = users.map((user: any) => ({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        hierarchyCode: user.hierarchyCode,
        departmentId: user.departmentId,
        manager: user.manager
          ? {
            id: user.manager.id,
            username: user.manager.username,
            displayName: user.manager.displayName,
          }
          : null,
      }));
      setUserList(onlyNeeded);
    } catch (e) {
      console.error("获取用户列表失败", e);
      setUserList([]);
    }
  };


  // 登录后加载保险公司和用户数据
  useEffect(() => {
    const userStr = sessionStorage.getItem("userInfo");
    if (userStr) {
      setUserInfo(JSON.parse(userStr));
      setIsLoggedIn(true);
    }

    if (isLoggedIn) {
      fetch("http://localhost:8080/api/insurance-company")
        .then(res => res.json())
        .then(data => setInsuranceCompanies(data));

      reloadUserList();
    }
  }, [isLoggedIn]);


  // 登录成功回调
  const handleLogin = (user: any) => {
    setUserInfo(user);
    setIsLoggedIn(true);
    sessionStorage.setItem("userInfo", JSON.stringify(user));
  };

  // 1. 没登录就只渲染 LoginPage，登录后渲染主页面
  if (!isLoggedIn) {
    return (
      <>
        <LoginPage onLogin={handleLogin} />
        <ToastContainer position="top-center" />
      </>
    );
  }

  // 2. 已登录：渲染你的原有内容
  return (
    <>
      <div className={styles.pageContainer}>
        <Sidebar onMenuClick={setCurrentPage} />
        <div className={styles.contentArea}>
          <div className={styles.topBar}>
            <div className={styles.mainTitle}>{mainTitle}</div>
            <div className={styles.topBarWelcome}>
              <WelcomeMessage username={userInfo.displayName} />
            </div>
            <div className={styles.topBarInfo}>
              <ScrollingInfoBar />
            </div>
          </div>
          <MainContent
            currentPage={currentPage}
            insuranceCompanies={insuranceCompanies}
            userList={userList}
            reloadUserList={reloadUserList}
          />
        </div>
      </div>
      <ToastContainer position="top-center" />
    </>
  );
};

export default App;
