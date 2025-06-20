import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import WelcomeMessage from './components/WelcomeMessage';
import ScrollingInfoBar from './components/ScrollingInfoBar';
import MainContent from './components/MainContent';
import LoginPage from './LoginPage'; // 新加
import styles from './App.module.css';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const pageTitles: Record<string, string> = {
  '车险客户': '车险客户信息',
  '希望客户': '希望客户信息',
  '业务管理': '业务管理',
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('车险客户');
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 新加登录状态
  const [userInfo, setUserInfo] = useState<any>(null); // 存用户信息对象
  const mainTitle = pageTitles[currentPage] || '系统主页';

  const [insuranceCompanies, setInsuranceCompanies] = useState<any[]>([]);
  const [userList, setUserList] = useState<any[]>([]);

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

      fetch("http://localhost:8080/api/user")
        .then(res => res.json())
        .then(data => setUserList(data));
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
    return <LoginPage onLogin={handleLogin} />;
  }

  // 2. 已登录：渲染你的原有内容
  return (
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
        />
      </div>
    </div>
  );
};

export default App;
