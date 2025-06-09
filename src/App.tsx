import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import WelcomeMessage from './components/WelcomeMessage';
import ScrollingInfoBar from './components/ScrollingInfoBar';
import MainContent from './components/MainContent';
import styles from './App.module.css';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const pageTitles: Record<string, string> = {
  '车险客户': '车险客户信息',
  '客户统计': '客户统计',
  '业务管理': '业务管理',
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('车险客户');
  const username = '张三';
  const mainTitle = pageTitles[currentPage] || '系统主页';

  return (
    <div className={styles.pageContainer}>
      <Sidebar onMenuClick={setCurrentPage} />
      <div className={styles.contentArea}>
        <div className={styles.topBar}>
          <div className={styles.mainTitle}>{mainTitle}</div>
          <div className={styles.topBarWelcome}>
            <WelcomeMessage username={username} />
          </div>
          <div className={styles.topBarInfo}>
            <ScrollingInfoBar />
          </div>
        </div>
        <MainContent currentPage={currentPage} />
      </div>
    </div>
  );
};

export default App;