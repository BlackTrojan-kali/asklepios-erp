import React from 'react'
import { cn } from '../../../lib/utils/cn'
import { Loader } from "lucide-react"

interface FormButtonProps {
    label: string;
    classname?: string;
    type?: "submit" | "reset" | "button";
    loading?: boolean;
    onClick?: () => void; 
}

const FormButton = ({ label, classname, type = "button", loading = false, onClick }: FormButtonProps) => {
  return (
    <button 
        type={type} 
        disabled={loading} 
        onClick={onClick}
        className={cn("p-2.5 text-center font-medium rounded-lg disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed px-4 flex items-center justify-center gap-2 transition-all", classname)}
    >
      {loading && <Loader size={18} className='animate-spin'/>}
      {label}
    </button>
  )
}

export default FormButton;