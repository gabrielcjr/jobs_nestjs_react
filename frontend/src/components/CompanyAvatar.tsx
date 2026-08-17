import React from 'react';
import { Building2 } from 'lucide-react';

interface CompanyAvatarProps {
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const COLOR_PALETTES = [
  { bg: 'from-indigo-600 to-violet-600', text: 'text-white' },
  { bg: 'from-blue-600 to-cyan-600', text: 'text-white' },
  { bg: 'from-emerald-600 to-teal-600', text: 'text-white' },
  { bg: 'from-rose-600 to-pink-600', text: 'text-white' },
  { bg: 'from-amber-600 to-orange-600', text: 'text-white' },
  { bg: 'from-purple-600 to-fuchsia-600', text: 'text-white' },
  { bg: 'from-teal-600 to-emerald-600', text: 'text-white' },
  { bg: 'from-sky-600 to-blue-600', text: 'text-white' },
];

function getPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % COLOR_PALETTES.length;
  return COLOR_PALETTES[idx];
}

function getInitials(name: string): string {
  if (!name) return 'CO';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export const CompanyAvatar: React.FC<CompanyAvatarProps> = ({
  name,
  className = '',
  size = 'md',
}) => {
  const palette = getPalette(name || '');
  const initials = getInitials(name || '');

  const sizeClasses = {
    sm: 'h-6 w-6 text-[10px] rounded-md',
    md: 'h-8 w-8 text-xs rounded-lg',
    lg: 'h-10 w-10 text-sm rounded-xl',
  }[size];

  return (
    <div
      className={`inline-flex items-center justify-center font-bold font-mono tracking-tight bg-gradient-to-tr ${palette.bg} ${palette.text} shadow-sm shrink-0 select-none ${sizeClasses} ${className}`}
      title={name}
    >
      {initials}
    </div>
  );
};
