import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ className = '', size = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8', 
    lg: 'h-12 w-12'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`${sizeClasses[size]} bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg flex items-center justify-center`}>
        <span className="text-white font-bold text-sm">B</span>
      </div>
      {showText && (
        <span className={`font-bold text-blue-700 ${textSizes[size]}`}>
          BRITSAI
        </span>
      )}
    </div>
  );
}