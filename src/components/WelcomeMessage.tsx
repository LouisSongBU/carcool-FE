import React from "react";

type WelcomeMessageProps = {
  username: string;
};

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ username }) => {
  return (
    <div
      className="text-center p-2 mb-1"
      style={{
        background: "linear-gradient(90deg, #ff6f61, #ff9a8b)",
        color: "white",
        borderRadius: "10px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
        fontSize: "20px",
        fontWeight: "bold",
      }}
    >
      欢迎您，<span style={{ textTransform: "capitalize" }}>{username}</span>！
    </div>
  );
};

export default WelcomeMessage;