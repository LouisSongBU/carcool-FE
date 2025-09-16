import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:8080/api", // 只写一遍！
  //baseURL: "http://123.121.15.40:50080/api", // 只写一遍！
  timeout: 10000,
  // 你也可以加headers等
});

export default instance;
