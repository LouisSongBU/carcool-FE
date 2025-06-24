// api/insuranceCompanyApi.ts
import api from "./api";

export const getCompanyList = (params: any) => {
    return api.get("/insurance-company", { params });
  };
  
  export const addCompany = (data: any) => {
    return api.post("/insurance-company", data);
  };
  
  export const updateCompany = (id: number, data: any) => {
    return api.put(`/insurance-company/${id}`, data);
  };
  
  export const deleteCompany = (id: number) => {
    return api.delete(`/insurance-company/${id}`);
  };
  
