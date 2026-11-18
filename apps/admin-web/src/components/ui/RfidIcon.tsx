import React from 'react';

interface RfidIconProps {
  size?: number;
  className?: string;
  color?: string;
  strokeWidth?: number;
}

export const RfidIcon: React.FC<RfidIconProps> = ({
  size = 20,
  className = '',
  color = 'currentColor',
  strokeWidth = 2,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Smart Card Body */}
      <rect x="2" y="5" width="20" height="14" rx="2.5" />
      {/* Contactless Chip / Antenna Area */}
      <circle cx="7" cy="12" r="1.5" fill={color} />
      {/* Concentric RFID Broadcast Radio Waves */}
      <path d="M12 9a4 4 0 0 1 0 6" />
      <path d="M15 7a7 7 0 0 1 0 10" />
      <path d="M18 5a10 10 0 0 1 0 14" />
    </svg>
  );
};
