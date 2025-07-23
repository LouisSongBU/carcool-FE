import React, { useState } from "react";
import { login } from "./api/UserApi";

type LoginPageProps = {
    onLogin: (username: string) => void;
};

export default function LoginPage({ onLogin }: LoginPageProps) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // 这里是访问后端的代码
        const res = await login({ username, password });
        const data = res.data;

        setLoading(false);

        if (data.success) {
            sessionStorage.setItem("userInfo", JSON.stringify(data.user)); // 保存用户信息
            // 可以加一个登录时间戳
            sessionStorage.setItem("loginTime", String(Date.now()));
            window.location.reload(); 
            onLogin(data.user); // 登录成功
        } else {
            alert(data.message || "用户名或密码错误");
        }
    };

    // ... 省略import和props
    return (
        <div
            style={{
                minHeight: "100vh",
                minWidth: "100vw",
                background: "linear-gradient(120deg, #f0f4fa 0%, #e1e8f9 100%)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <div
                className="shadow-lg bg-white rounded-4"
                style={{
                    width: 720,
                    maxWidth: "98vw",
                    minHeight: 380,
                    display: "flex",
                    flexDirection: "row",
                }}
            >
                {/* 左侧LOGO区 */}
                <div
                    style={{
                        width: 260,
                        background: "linear-gradient(135deg,#4682ea,#82b1ff 85%)",
                        color: "#fff",
                        borderRadius: "16px 0 0 16px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🚗</div>
                    <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
                        车险管理系统
                    </div>
                    <div style={{ fontSize: 14, opacity: 0.8 }}>Insurance Management</div>
                </div>
                {/* 右侧表单区 */}
                <div
                    style={{
                        flex: 1,
                        padding: "48px 38px 36px 38px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                    }}
                >
                    <form onSubmit={handleSubmit}>
                        <h3 className="mb-4" style={{ fontWeight: 600 }}>
                            用户登录
                        </h3>
                        <div className="mb-3">
                            <label className="form-label">用户名</label>
                            <input
                                type="text"
                                className="form-control"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                autoFocus
                                required
                                placeholder="请输入用户名"
                            />
                        </div>
                        <div className="mb-4">
                            <label className="form-label">密码</label>
                            <input
                                type="password"
                                className="form-control"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                placeholder="请输入密码"
                            />
                        </div>
                        <button
                            type="submit"
                            className="btn btn-primary w-100"
                            style={{ fontWeight: 600 }}
                            disabled={loading}
                        >
                            {loading ? "登录中..." : "登录"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );

}
