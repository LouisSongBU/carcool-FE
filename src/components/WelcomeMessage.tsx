import React from "react";
import styles from './WelcomeMessage.module.css';

type WelcomeMessageProps = { username: string; };

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ username }) => (
  <div className={styles.welcomeMessage}>
    <span role="img" aria-label="hi">👋</span>
    欢迎您，<span style={{ fontWeight: 700 }}>{username}</span>
  </div>
);

export default WelcomeMessage;