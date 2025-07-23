import api from './api';

// GET /department/all（获取全部用户，路径以实际后端为准）
export const getAllDepartments = () => {
    return api.get('/department/all');
};