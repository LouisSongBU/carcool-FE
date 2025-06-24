import React from 'react';
import styles from './MainContent.module.css';
import InsuranceDetails from '../pages/InsuranceDetails';
import PotentialCustomer from '../pages/PotentialCustomerDetails';
import InsuranceCompanyCommissionPage from '../pages/InsuranceCompanyCommissionPage';

type MainContentProps = {
  currentPage: string;
  insuranceCompanies: any[];
  userList: any[];
};

const MainContent: React.FC<MainContentProps> = ({
  currentPage,
  insuranceCompanies,
  userList
}) => {
  const renderPage = () => {
    switch (currentPage) {
      case '车险客户':
        return <InsuranceDetails insuranceCompanies={insuranceCompanies} userList={userList} />;
      case '希望客户':
        return <PotentialCustomer insuranceCompanies={insuranceCompanies} userList={userList} />;
      case '提成维护':
        return <InsuranceCompanyCommissionPage />;
      default:
        return <div>页面未找到</div>;
    }
  };

  return <div className={styles.mainContent}>{renderPage()}</div>;
};

export default MainContent;