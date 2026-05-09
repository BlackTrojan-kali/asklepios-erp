import React from 'react'

const FormInput = ({placeholder,error,label,type,value,setValue}:{setValue:()=>void,value:any,type:string,placeholder:string,error:string | null,label:string}) => {
  return (
    <div className='p-2  text-start'>
    <label htmlFor="" className='pl-2'>{label} :</label>
    <input placeholder={placeholder} value={value} type={type} onChange={(e)=>setValue(e.target.value)} className='w-full p-2 border-2 border-gray-200 rounded-md'/>
    <span className='text-red-500'>{error}</span>
    </div>
  )
}

export default FormInput