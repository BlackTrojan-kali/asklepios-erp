import React from 'react'
import { cn } from '../../../lib/utils/cn'
import {Loader} from "lucide-react"
const FormButton = ({label,classname,type,loading}:{loading:boolean,type:"submit"|"reset" | undefined,label:string,classname:string}) => {
  return (
    
    <button type={type} disabled={loading}  className={cn("p-2 text-center rounded-lg disabled:bg-gray-400  px-4 mb-4 flex gap-2",classname)}>
      {loading && <Loader  className=' animate-spin'/>}
       {label}
    </button>
  )
}

export default FormButton