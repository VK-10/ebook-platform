import axios from "axios";
import { BASE_URL } from "./apiPaths";

const axiosInstance = axios.create({
    baseURL : BASE_URL,
    timeout : 80000,
    headers: {
        "Content-Type" : "application/json",
        Accept : "application/json",
    },
});

//request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    const isAuthRoute =
      config.url?.includes("/api/auth/login") ||
      config.url?.includes("/api/auth/register");

    if (token && !isAuthRoute) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


//response interceptor
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            if (error.response.status === 500) {
                console.error("Server error. Please try again later");
            }
        }else if (error.code === "ECONNABORTED") {
            console.error("Request timeout. PLease try again.");
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
