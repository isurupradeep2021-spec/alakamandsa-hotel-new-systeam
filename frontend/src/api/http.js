import axios from "axios";

const http = axios.create({
    baseURL: "http://localhost:8088/api",
});

http.interceptors.request.use((config) => {
    const url = config.url || "";
    const isAuthRequest = url.includes("/auth/login") || url.includes("/auth/register");
    if (isAuthRequest) return config;

    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export default http;
