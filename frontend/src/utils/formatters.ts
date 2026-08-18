import { AtsProvider, ExperienceLevel, RoleCategory, WorkplaceType } from '../types/jobs';

export function formatSalary(
  minSalary?: number | null,
  maxSalary?: number | null,
  currency: string = 'USD',
  summary?: string | null
): string | null {
  if (summary) return summary;
  if (!minSalary && !maxSalary) return null;

  const symbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';

  if (minSalary && maxSalary) {
    if (minSalary >= 1000) {
      return `${symbol}${Math.round(minSalary / 1000)}k - ${symbol}${Math.round(maxSalary / 1000)}k ${currency}`;
    }
    return `${symbol}${minSalary} - ${symbol}${maxSalary} / hr`;
  }

  if (minSalary) {
    if (minSalary >= 1000) return `From ${symbol}${Math.round(minSalary / 1000)}k ${currency}`;
    return `From ${symbol}${minSalary}`;
  }

  if (maxSalary) {
    if (maxSalary >= 1000) return `Up to ${symbol}${Math.round(maxSalary / 1000)}k ${currency}`;
    return `Up to ${symbol}${maxSalary}`;
  }

  return null;
}

export function formatTimeAgo(dateString?: string | null): string {
  if (!dateString) return 'Recently';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1d ago';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function isNewJob(firstSeenAt?: string | null): boolean {
  if (!firstSeenAt) return false;
  const firstSeen = new Date(firstSeenAt);
  const now = new Date();
  const diffInHours = (now.getTime() - firstSeen.getTime()) / (1000 * 60 * 60);
  return diffInHours <= 48;
}

export function getAtsBadgeStyles(provider: AtsProvider): { bg: string; text: string; border: string; label: string } {
  switch (provider) {
    case 'GREENHOUSE':
      return {
        bg: 'bg-emerald-950/60',
        text: 'text-emerald-400',
        border: 'border-emerald-700/50',
        label: 'Greenhouse',
      };
    case 'LEVER':
      return {
        bg: 'bg-amber-950/60',
        text: 'text-amber-400',
        border: 'border-amber-700/50',
        label: 'Lever',
      };
    case 'ASHBY':
      return {
        bg: 'bg-purple-950/60',
        text: 'text-purple-400',
        border: 'border-purple-700/50',
        label: 'Ashby',
      };
    case 'SMARTRECRUITERS':
      return {
        bg: 'bg-blue-950/60',
        text: 'text-blue-400',
        border: 'border-blue-700/50',
        label: 'SmartRecruiters',
      };
    default:
      return {
        bg: 'bg-slate-800',
        text: 'text-slate-300',
        border: 'border-slate-700',
        label: provider,
      };
  }
}

export function getRoleCategoryLabel(role: RoleCategory): string {
  switch (role) {
    case 'FRONTEND':
      return 'Frontend';
    case 'BACKEND':
      return 'Backend';
    case 'FULLSTACK':
      return 'Full Stack';
    case 'DEVOPS_SRE_INFRA':
      return 'DevOps & Infra';
    case 'MOBILE':
      return 'Mobile';
    case 'DATA_AI_ML':
      return 'Data & AI / ML';
    case 'SECURITY':
      return 'Security';
    case 'ENGINEERING_MANAGEMENT':
      return 'Management';
    default:
      return 'Other';
  }
}

export function getExperienceLevelLabel(level: ExperienceLevel): string {
  switch (level) {
    case 'INTERN':
      return 'Internship';
    case 'JUNIOR':
      return 'Junior';
    case 'MID':
      return 'Mid-Level';
    case 'SENIOR':
      return 'Senior';
    case 'STAFF_PLUS':
      return 'Staff / Principal';
    case 'LEAD':
      return 'Lead / Architect';
    default:
      return 'Unspecified';
  }
}

export function getWorkplaceTypeLabel(type: WorkplaceType): string {
  switch (type) {
    case 'REMOTE':
      return 'Remote';
    case 'HYBRID':
      return 'Hybrid';
    case 'ONSITE':
      return 'On-site';
    default:
      return 'Flexible';
  }
}
