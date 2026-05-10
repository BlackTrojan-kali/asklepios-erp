import { Power } from 'lucide-react'
import React from 'react'
import { logout } from '../functions/auth/AuthMethods'

const Header = () => {
    const handleLogout = ()=>{
        logout()
    }
  return (
    <div className='w-full bg-white  py-4 px-8 shadow-md flex justify-between'>Header
    <div className='gap-2'>
        
        <button onClick={handleLogout} className='text-red-500 bg-red-500/8 cursor-pointer p-2 rounded-md'>
            <Power />
        </button>
    </div>
    </div>
  )
}

export default Header