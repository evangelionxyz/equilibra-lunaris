import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circle' | 'rectangle';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangle',
  width,
  height,
}) => {
  const baseClass = 'animate-pulse bg-[#1F2937]/50 rounded';
  const variantClass = variant === 'circle' ? 'rounded-full' : variant === 'text' ? 'h-3 w-3/4' : '';
  
  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  return (
    <div 
      className={`${baseClass} ${variantClass} ${className}`} 
      style={style}
      aria-hidden="true"
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="p-5 rounded-xl border border-[#374151] bg-[#0B0E14] flex flex-col justify-between h-40">
    <div>
      <div className="flex justify-between items-start mb-3">
        <Skeleton width="60%" height={16} />
        <Skeleton width="20%" height={12} />
      </div>
      <div className="space-y-2">
        <Skeleton width="90%" height={10} />
        <Skeleton width="40%" height={10} />
      </div>
    </div>
    <div className="flex justify-between items-end gap-4 mt-2">
      <Skeleton width="70%" height={8} />
      <Skeleton variant="circle" width={32} height={32} />
    </div>
  </div>
);
