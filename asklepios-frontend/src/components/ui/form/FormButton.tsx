import React from 'react'
import { cn } from '../../../lib/utils/cn'

const FormButton = ({label,classname,type}:{type:"submit"|"reset" | undefined,label:string,classname:string}) => {
  return (
    
    <button type={type}  className={cn("p-2 rounded-lg  px-4 mb-4",classname)}>
        {label}
    </button>
  )
}

export default FormButton