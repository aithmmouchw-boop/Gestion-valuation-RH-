import React from 'react';

interface UserInitialsProps {
  name: string;
  className?: string;
}

export const UserInitials: React.FC<UserInitialsProps> = ({ name, className = '' }) => {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('');

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-slate-800 font-black text-white ${className}`}
      aria-label={`Profil de ${name}`}
    >
      {initials || 'GP'}
    </div>
  );
};
