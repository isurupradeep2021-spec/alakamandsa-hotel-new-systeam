import axios from 'axios';

const http = axios.create({
  baseURL: 'http://localhost:8088/api'
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const requestPath = config.url ?? '';
  const isAuthRequest = requestPath.startsWith('/auth/');

  if (token && !isAuthRequest) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers?.Authorization) {
    delete config.headers.Authorization;
  }

  return config;
});

export default http;
