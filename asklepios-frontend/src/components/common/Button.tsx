import React, { forwardRef, useState } from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "danger"
    | "success"
    | "warning"
    | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  tooltip?: string;
  tooltipPosition?: "top" | "bottom" | "left" | "right";
  tooltipDelay?: number; // Delay before showing tooltip in ms (default 300ms)
  icon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      tooltip,
      tooltipPosition = "top",
      tooltipDelay = 900,
      icon,
      className = "",
      disabled,
      title,
      ...props
    },
    ref,
  ) => {
    const [isHovered, setIsHovered] = useState(false);
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIsHovered(true);
      }, tooltipDelay);
    };

    const handleMouseLeave = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsHovered(false);
    };

    // Variant classes
    const variantClasses = {
      primary:
        "bg-[#00a896] hover:bg-[#008f7e] text-white shadow-sm focus:ring-[#00a896]",
      secondary:
        "bg-purple-600 hover:bg-purple-700 text-white shadow-sm focus:ring-purple-500",
      outline:
        "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:ring-gray-300",
      danger:
        "bg-red-600 hover:bg-red-700 text-white shadow-sm focus:ring-red-500",
      success:
        "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm focus:ring-emerald-500",
      warning:
        "bg-amber-500 hover:bg-amber-600 text-white shadow-sm focus:ring-amber-400",
      ghost:
        "bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-300",
    };

    // Size classes
    const sizeClasses = {
      sm: "px-2.5 py-1.5 text-xs rounded-md gap-1.5",
      md: "px-4 py-2 text-sm rounded-lg gap-2",
      lg: "px-5 py-2.5 text-base rounded-xl gap-2.5",
      icon: "p-2 text-sm rounded-lg justify-center items-center",
    };

    // Tooltip position classes
    const tooltipPosClasses = {
      top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
      bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
      left: "right-full top-1/2 -translate-y-1/2 mr-2",
      right: "left-full top-1/2 -translate-y-1/2 ml-2",
    };

    // Tooltip arrow position classes
    const arrowPosClasses = {
      top: "top-full left-1/2 -translate-x-1/2 border-t-slate-900 dark:border-t-slate-800 border-x-transparent border-b-transparent",
      bottom:
        "bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 dark:border-b-slate-800 border-x-transparent border-t-transparent",
      left: "left-full top-1/2 -translate-y-1/2 border-l-slate-900 dark:border-l-slate-800 border-y-transparent border-r-transparent",
      right:
        "right-full top-1/2 -translate-y-1/2 border-r-slate-900 dark:border-r-slate-800 border-y-transparent border-l-transparent",
    };

    const tooltipText = tooltip || title;

    return (
      <div
        className="relative inline-flex items-center"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          ref={ref}
          disabled={disabled || isLoading}
          aria-label={
            tooltipText || (typeof children === "string" ? children : undefined)
          }
          className={`inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none ${
            variantClasses[variant]
          } ${sizeClasses[size]} ${className}`}
          {...props}
        >
          {isLoading ? (
            <Loader2
              size={size === "sm" ? 14 : size === "lg" ? 20 : 18}
              className="animate-spin"
            />
          ) : (
            icon
          )}
          {children}
        </button>

        {/* Custom Animated Styled Tooltip */}
        {tooltipText && isHovered && !disabled && (
          <div
            className={`absolute z-50 pointer-events-none whitespace-nowrap px-2.5 py-1 text-xs font-medium text-white bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-md shadow-xl border border-slate-700/50 transition-all duration-200 animate-in fade-in zoom-in-95 ${
              tooltipPosClasses[tooltipPosition]
            }`}
          >
            {tooltipText}
            {/* Arrow */}
            <div
              className={`absolute w-0 h-0 border-4 ${arrowPosClasses[tooltipPosition]}`}
            />
          </div>
        )}
      </div>
    );
  },
);

Button.displayName = "Button";
