import React, {  useEffect, type ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router';

const AuthMiddleware = ({children}:{children:ReactNode}) => {
    const {token} = useAuth()
  console.log("hello")
     const navigate = useNavigate();
      useEffect(() => {
        if (!token) {
          navigate('/auth/login', { replace: true }); 
        }
      }, [token, navigate]);
    return  children
}

export default AuthMiddleware