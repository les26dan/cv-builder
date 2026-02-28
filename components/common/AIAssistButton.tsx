import { SparklesIcon } from 'lucide-react';

interface AIAssistButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

// Generate test ID from label for testing purposes
const generateTestId = (label: string): string => {
  // Convert label to test ID format
  const normalized = label
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9-]/g, '');
  
  return `ai-assist-${normalized}`;
};

export const AIAssistButton = ({
  label,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false
}: AIAssistButtonProps) => {
  const baseClasses = 'flex items-center justify-center gap-2 rounded-md transition-colors font-medium';
  
  // Disabled styling standards from Product Spec
  const disabledClasses = {
    primary: 'bg-gray-200 text-gray-400 cursor-not-allowed',
    outline: 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
  };
  
  // Active styling
  const activeClasses = {
    primary: 'bg-primary-500 text-white hover:bg-primary-700 shadow-md',
    outline: 'border border-primary-500 text-primary-500 hover:bg-primary-50'
  };
  
  const sizeClasses = {
    sm: 'text-xs py-1 px-2',
    md: 'text-sm py-2 px-3',
    lg: 'text-base py-3 px-6'
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20
  };

  const variantClasses = disabled ? disabledClasses[variant] : activeClasses[variant];

  return (
    <button 
      className={`${baseClasses} ${variantClasses} ${sizeClasses[size]}`} 
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      data-testid={generateTestId(label)}
    >
      <SparklesIcon size={iconSizes[size]} />
      {label}
    </button>
  );
};