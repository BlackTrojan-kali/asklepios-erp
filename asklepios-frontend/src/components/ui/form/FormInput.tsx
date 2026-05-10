import React from 'react'

interface FormInputProps {
    label: string;
    type: string;
    value: string;
    setValue: (value: string) => void; 
    placeholder: string;
    error?: string | null;
}

const FormInput = ({ placeholder, error, label, type, value, setValue }: FormInputProps) => {
  return (
    <div className='p-2 text-start'>
        <label className='pl-2 text-sm font-medium text-slate-700 dark:text-gray-300'>
            {label}
        </label>
        <input 
            placeholder={placeholder} 
            value={value} 
            type={type} 
            onChange={(e) => setValue(e.target.value)} 
            // Ajout du Dark Mode et d'un focus plus propre
            className='w-full p-2.5 mt-1 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-md outline-none focus:border-[#00a896] dark:focus:border-teal-500 text-slate-800 dark:text-gray-100 transition-colors'
        />
        {error && <span className='text-xs text-red-500 mt-1 pl-2 block'>{error}</span>}
    </div>
  )
}

export default FormInput;