// src/api.ts
import axios from "axios";
import config from "../config";

const api = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: 10000,
});

export default api;
