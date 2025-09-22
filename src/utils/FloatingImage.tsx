import React from "react";
import { Rnd } from "react-rnd";

interface FloatingImageProps {
  src: string;
  onClose: () => void;
}

const FloatingImage: React.FC<FloatingImageProps> = ({ src, onClose }) => {
  return (
    <Rnd
      default={{
        x: 100,
        y: 100,
        width: 400,
        height: 300,
      }}
      bounds="window" // 限制在当前窗口范围内
      style={{
        border: "1px solid #ccc",
        background: "#fff",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        zIndex: 9999,
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      {/* 头部，支持关闭 */}
      <div
        style={{
          background: "#2d4ca4",
          color: "#fff",
          padding: "6px 10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "move",
        }}
      >
        <span>图片预览</span>
        <button
          onClick={onClose}
          style={{
            border: "none",
            background: "transparent",
            color: "#fff",
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          ×
        </button>
      </div>

      {/* 图片展示区 */}
      <div style={{ width: "100%", height: "100%", background: "#000" }}>
        <img
          src={src}
          alt="预览"
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            display: "block",
            margin: "auto",
          }}
        />
      </div>
    </Rnd>
  );
};

export default FloatingImage;
