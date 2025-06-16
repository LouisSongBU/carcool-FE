import React from 'react';
import styles from './MainContent.module.css';
import InsuranceCustomers from '../pages/InsuranceDetails';
import PotentialCustomer from '../pages/PotentialCustomerDetails';

type MainContentProps = {
  currentPage: string;
};

const MainContent: React.FC<MainContentProps> = ({ currentPage }) => {
  const renderPage = () => {
    switch (currentPage) {
      case '车险客户':
        return <InsuranceCustomers />;
      case '希望客户':
        return <PotentialCustomer />;
      case '业务管理':
        return <div>业务管理页面</div>;
      default:
        return <div>页面未找到</div>;
    }
  };

  return <div className={styles.mainContent}>{renderPage()}</div>;
};

export default MainContent;