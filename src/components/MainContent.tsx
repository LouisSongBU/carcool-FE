import React from 'react';
import styles from './MainContent.module.css';
import InsuranceDetails from '../pages/InsuranceDetails';
import PotentialCustomer from '../pages/PotentialCustomerDetails';
import InsuranceCompanyCommission from '../pages/InsuranceCompanyCommission.tsx';
import WageSettlement from '../pages/WageSettlement.tsx';
import InsuredExpirationPage from '../pages/InsuredExpirationPage.tsx';
import PotentialExpirationPage from '../pages/PotentialExpirationPage.tsx';
import InsuredBirthdayPage from '../pages/InsuredBirthdayPage.tsx';

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
        return <InsuranceCompanyCommission />;
      case '工资结算':
        return <WageSettlement userList={userList}/>;
      case '已保客户保险到期':
        return <InsuredExpirationPage/>;
      case '希望客户保险到期':
        return <PotentialExpirationPage/>;
      case '已保客户生日提醒':
        return <InsuredBirthdayPage/>;
      default:
        return <div>页面未找到</div>;
    }
  };

  return <div className={styles.mainContent}>{renderPage()}</div>;
};

export default MainContent;