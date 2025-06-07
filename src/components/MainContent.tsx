import React from 'react';
import styles from './MainContent.module.css';
import InsuranceCustomers from '../pages/InsuranceCustomers';

type MainContentProps = {
  currentPage: string;
};

const MainContent: React.FC<MainContentProps> = ({ currentPage }) => {
  const renderPage = () => {
    switch (currentPage) {
      case '车险客户':
        return <InsuranceCustomers />;
      case '客户统计':
        return <div>客户统计页面</div>;
      case '业务管理':
        return <div>业务管理页面</div>;
      default:
        return <div>页面未找到</div>;
    }
  };

  return <div className={styles['main-content']}>{renderPage()}</div>;
};

export default MainContent;