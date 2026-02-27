import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'outline' | 'danger' | 'ghost' | 'white';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const styles = {
     primary: "bg-[#3B82F6] text-white hover:bg-[#2563EB] border border-transparent",
     success: "bg-[#16A34A] text-white hover:bg-[#15803D] border border-transparent",
     outline: "bg-[#1F2937] text-slate-300 border border-[#374151] hover:bg-[#374151] hover:text-white",
     danger: "bg-[#EF4444] text-white hover:bg-[#DC2626] border border-transparent",
     ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-[#1F2937] border border-transparent",
     white: "bg-white text-black hover:bg-slate-200 border border-transparent"
  };

  return (
    <button 
      {...props}
      className={`px-4 py-2 rounded-lg text-[12px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
};
