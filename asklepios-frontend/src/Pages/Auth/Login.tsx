import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { useAuth } from '../../contexts/AuthContext'; 
import FormInput from '../../components/ui/form/FormInput';
import FormButton from '../../components/ui/form/FormButton';
import toast from 'react-hot-toast';
import { login } from '../../functions/auth/AuthMethods';

const Login = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  const { token, setToken, setProfile } = useAuth(); 
  const navigate = useNavigate();
  

  useEffect(() => {
    if (token) {
      navigate('/', { replace: true }); 
    }
  }, [token, navigate]);


const handlesubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    try {
        setLoading(true);
        
        const data = await login({ email, password }); 
      
        if (data && data.token) {
            setToken(data.token);
            const userObj = typeof data.user === 'string' ? JSON.parse(data.user) : data.user;
            setProfile(userObj); 
            
        }
        
        setLoading(false);
    } catch (err) {
        console.log(err);
        setLoading(false);
    }
}
  return (
    <center>
      <br /><br />
       <div className='bg-white w-[400px] rounded-md border-2 border-gray-200 shadow-md'>
         <div>
          <img src="/logo.png" className='w-[320px] h-[180px]' alt="Asklepios Logo" />
         </div>
         
         <form onSubmit={handlesubmit} className="p-4">
          <FormInput 
            label="Email" 
            type="email"
            value={email} 
            setValue={setEmail} 
            placeholder="Entrez votre email" 
            error={null}
           />
          <br />
          <FormInput 
            label="Password" 
            type="password" 
            value={password} 
            setValue={setPassword} 
            placeholder="Entrez votre mot de passe" 
            error={null}
           />
        <br />
        
        <FormButton 
            label='Se connecter' 
            loading={loading} 
            type="submit" 
            classname='bg-mint-500  text-white w-full'
        />
         </form>
       </div>
    </center>
  )
}

export default Login;