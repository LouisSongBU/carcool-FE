import api from "./api";

export const getTodayOrders = async () => {
  const res = await api.get("/scrolling/orders/today");
  return res.data;
};