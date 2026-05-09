import React, { useState } from 'react'
import FormInput from '../../components/ui/form/FormInput';
import FormButton from '../../components/ui/form/FormButton';
import toast from 'react-hot-toast';
import { login } from '../../functions/auth/AuthMethods';

const Login = () => {
  const [email,setEmail] = useState<string|null>();
  const [password,setPassword]= useState<string | null>();
  const handlesubmit=(ev)=>{
    ev.preventDefault()
    login({email,password});
  }
  return (
    <center>
      <br /><br />
       <div className='bg-white w-[400px] rounded-md border-2 border-gray-200 shadow-md'>
         <div>
          <img src="/logo.png" className='w-[320px] h-[180px]' alt="" />
         </div>
         <form onSubmit={handlesubmit}>
          <FormInput label="Email" type="text" value={email} setValue={setEmail} placeholder="enter your email " error={null}
           />
          <FormInput label="Password" type="password" value={password} setValue={setPassword} placeholder="enter your password " error={null}
           />

        <br />
        <FormButton label='submit' type="submit" classname='bg-mint-500 text-white'/>
         </form>
        
       </div>
    </center>
  )
}

export default Login