import React from 'react';
import { RoleCategory } from '../types/jobs';
import { getRoleCategoryLabel } from '../utils/formatters';

interface RoleCategoryTabsProps {
  selectedRole?: RoleCategory | 'ALL';
  onSelectRole: (role: RoleCategory | 'ALL') => void;
  roleCounts?: Record<string, number>;
  totalCount?: number;
}

const ROLES: { id: RoleCategory | 'ALL'; label: string }[] = [
  { id: 'ALL', label: 'All Roles' },
  { id: 'FRONTEND', label: 'Frontend' },
  { id: 'BACKEND', label: 'Backend' },
  { id: 'FULLSTACK', label: 'Full Stack' },
  { id: 'DEVOPS_SRE_INFRA', label: 'DevOps & Infra' },
  { id: 'DATA_AI_ML', label: 'AI & Data' },
  { id: 'MOBILE', label: 'Mobile' },
  { id: 'SECURITY', label: 'Security' },
  { id: 'ENGINEERING_MANAGEMENT', label: 'Management' },
];

export const RoleCategoryTabs: React.FC<RoleCategoryTabsProps> = ({
  selectedRole = 'ALL',
  onSelectRole,
  roleCounts = {},
  totalCount = 0,
}) => {
  return (
    <div className="w-full overflow-x-auto pb-1 scrollbar-none">
      <div className="flex items-center gap-1.5 p-1 bg-dark-900/90 rounded-xl border border-dark-750 min-w-max">
        {ROLES.map((role) => {
          const isSelected = selectedRole === role.id;
          const count = role.id === 'ALL' ? totalCount : roleCounts[role.id] || 0;

          return (
            <button
              key={role.id}
              onClick={() => onSelectRole(role.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30 ring-1 ring-brand-400/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-dark-800'
              }`}
            >
              <span>{role.label}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                  isSelected
                    ? 'bg-brand-700/80 text-brand-100'
                    : 'bg-dark-800 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
