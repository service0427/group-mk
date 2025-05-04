import React from 'react';
import { Container } from '@/components/container';
import { KeenIcon } from '@/components/keenicons';

interface GuideCardProps {
  title: string;
  description: string;
  icon?: string;
  variant?: 'info' | 'warning' | 'success' | 'danger';
  onClose?: () => void;
}

const GuideCard: React.FC<GuideCardProps> = ({
  title,
  description,
  icon = 'abstract-26',
  variant = 'info',
  onClose,
}) => {
  // 색상 스키마 설정
  const variantStyles = {
    info: {
      background: 'bg-blue-50/90 dark:bg-blue-900/30',
      border: 'border-blue-200 dark:border-blue-800',
      titleColor: 'text-blue-800 dark:text-blue-200',
      textColor: 'text-blue-700 dark:text-blue-300',
      iconColor: 'text-blue-500 dark:text-blue-400',
      badge: 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200',
    },
    warning: {
      background: 'bg-amber-50/90 dark:bg-amber-900/30',
      border: 'border-amber-200 dark:border-amber-800',
      titleColor: 'text-amber-800 dark:text-amber-200',
      textColor: 'text-amber-700 dark:text-amber-300',
      iconColor: 'text-amber-500 dark:text-amber-400',
      badge: 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200',
    },
    success: {
      background: 'bg-green-50/90 dark:bg-green-900/30',
      border: 'border-green-200 dark:border-green-800',
      titleColor: 'text-green-800 dark:text-green-200',
      textColor: 'text-green-700 dark:text-green-300',
      iconColor: 'text-green-500 dark:text-green-400',
      badge: 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200',
    },
    danger: {
      background: 'bg-red-50/90 dark:bg-red-900/30',
      border: 'border-red-200 dark:border-red-800',
      titleColor: 'text-red-800 dark:text-red-200',
      textColor: 'text-red-700 dark:text-red-300',
      iconColor: 'text-red-500 dark:text-red-400',
      badge: 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className={`w-full ${styles.background} border-b ${styles.border}`}>
      <Container fullWidth>
        <div className="py-4 px-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <KeenIcon icon={icon} className={`text-xl ${styles.iconColor}`} />
              <div>
                <div className={`font-medium ${styles.titleColor}`}>{title}</div>
                <div className={`text-sm ${styles.textColor}`}>{description}</div>
              </div>
            </div>
            
            {onClose && (
              <button 
                onClick={onClose}
                className={`p-1 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-700/50 ${styles.iconColor}`}
                aria-label="닫기"
              >
                <KeenIcon icon="cross" className="text-lg" />
              </button>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default GuideCard;