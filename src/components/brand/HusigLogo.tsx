import React from 'react';
import { Brain } from 'lucide-react';

interface HuSigLogoProps {
  size?: 'small' | 'default' | 'large';
  showText?: boolean;
  className?: string;
}

export const HuSigLogo: React.FC<HuSigLogoProps> = ({ 
  size = 'default', 
  showText = true,
  className = '' 
}) => {
  const sizeClasses = {
    small: {
      container: 'h-8',
      icon: 'w-6 h-6',
      iconContainer: 'w-6 h-6',
      text: 'text-lg'
    },
    default: {
      container: 'h-10',
      icon: 'w-7 h-7',
      iconContainer: 'w-8 h-8',
      text: 'text-xl'
    },
    large: {
      container: 'h-12',
      icon: 'w-8 h-8',
      iconContainer: 'w-10 h-10',
      text: 'text-2xl'
    }
  };

  const sizes = sizeClasses[size];

  return (
    <div className={`flex items-center space-x-2 ${sizes.container} ${className}`}>
      <div className={`flex items-center justify-center ${sizes.iconContainer} bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg`}>
        <Brain className={`${sizes.icon} text-white`} />
      </div>
      {showText && (
        <span className={`font-bold ${sizes.text} bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`}>
          HuSig
        </span>
      )}
    </div>
  );
};
