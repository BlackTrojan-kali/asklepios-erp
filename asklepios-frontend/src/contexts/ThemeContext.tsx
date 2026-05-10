import { createContext, ReactNode, useContext, useState } from 'react';

export const themeContext = createContext({})

export const ThemeContextProvider = ({children}:{children:ReactNode})=>{
    const [theme,setTheme] = useState<string|null>("light")
    
    useState(()=>{
        if(localStorage.getItem("theme")){
            setTheme(localStorage.getItem("theme"));
        }
    },[])
    const switchTheme = ()=>{
        if (theme == "light"){
            localStorage.setItem("theme","dark")
            setTheme("dark");
        }else{
            localStorage.setItem("theme","light")
            setTheme("light")
        }
    };

  return(
    <themeContext.Provider value={{switchTheme,theme}}>
        {children}
    </themeContext.Provider>
  )
}