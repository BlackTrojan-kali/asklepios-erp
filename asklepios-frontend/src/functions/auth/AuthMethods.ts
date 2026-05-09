import type { AxiosError } from "axios";
import api from "../../api/api"
import type { UserLoginDto } from "../../types/types"
import axios from "axios";
import toast from "react-hot-toast";

const login= async (payload: UserLoginDto) =>{
    try {
        const res = await  api.post("/auth/login",payload);
        if (res){
            localStorage.setItem("ACCESS_TOKEN",res?.data?.token)
            localStorage.setItem("current_user",res?.data?.user)
            toast.success("authenticated successfully")
        }
    } catch (error:unknown) {
        if(axios.isAxiosError(error)){
            toast.error(error?.response?.data);
        }
    }
}

export {login}