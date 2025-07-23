import api from './api';

// post /login（常用于登录校验）
export const login = (params: { username: string; password: string }) => {
    return api.post('/login', params);
};
// POST /user（创建新用户）
export const createUser = (user: Record<string, any>) => {
    return api.post('/user', user);
};

// GET /user/all（获取全部用户，路径以实际后端为准）
export const getAllUsers = () => {
    return api.get('/user/all');
};

// 更新用户
export const editUser = (id: number, data: Partial<any>) => {
    return api.put(`/user/${id}`, data);
};

export const resetUserPassword = (id: number, password: string) => {
    api.post(`/user/${id}/reset-password`, { password });
}
