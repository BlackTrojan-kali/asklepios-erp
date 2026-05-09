import axios from "axios"

const api = axios.create({
    baseURL: "http://localhost:8000/api",
    withCredentials:true,
    headers:{
        "Accept":"application/json",
        "Content-Type":"application/json"
    }
})

api.interceptors.request.use((config)=>{
    const token = localStorage.getItem("ACCESS_TOKEN");
    if (token){
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
})
export default api