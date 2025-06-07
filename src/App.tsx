import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import WelcomeMessage from './components/WelcomeMessage';
import ScrollingInfoBar from './components/ScrollingInfoBar';
import MainContent from './components/MainContent';
import styles from './App.module.css';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('车险客户');
  const username = '张三';

  return (
    <div className={styles['page-container']}>
      <Sidebar onMenuClick={setCurrentPage} />
      <div className={styles['content-area']}>
        <WelcomeMessage username={username} />
        <ScrollingInfoBar />
        <MainContent currentPage={currentPage} />
      </div>
    </div>
  );
};

export default App;
