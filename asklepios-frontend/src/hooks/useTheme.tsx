import { useContext } from "react";
import { themeContext } from "../contexts/ThemeContext";

export const useTheme = ()=>{
    const context = useContext(themeContext)
    return context
}
