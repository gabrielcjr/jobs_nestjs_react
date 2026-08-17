import React from 'react';
import { Code2, X } from 'lucide-react';

interface TechStackPillsProps {
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  availableTags?: { name: string; count: number }[];
}

const DEFAULT_POPULAR_TAGS = [
  'TypeScript',
  'React',
  'Go',
  'Python',
  'PostgreSQL',
  'AWS',
  'Kubernetes',
  'Docker',
  'Next.js',
  'Rust',
  'Node.js',
  'GraphQL',
  'Kafka',
  'LLM',
  'Tailwind CSS',
];

export const TechStackPills: React.FC<TechStackPillsProps> = ({
  selectedTags,
  onToggleTag,
  availableTags = [],
}) => {
  // Use dynamically available top tags or fallback to popular defaults
  const displayTags =
    availableTags.length > 0
      ? availableTags.slice(0, 16).map((t) => t.name)
      : DEFAULT_POPULAR_TAGS;

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none text-xs">
      <div className="flex items-center gap-1 text-slate-400 text-[11px] font-mono shrink-0 pl-0.5 pr-1">
        <Code2 className="h-3.5 w-3.5 text-brand-400" />
        <span>Tech:</span>
      </div>

      <div className="flex items-center gap-1.5 flex-nowrap min-w-max">
        {displayTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);

          return (
            <button
              key={tag}
              onClick={() => onToggleTag(tag)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all ${
                isSelected
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/60 shadow-sm shadow-brand-500/20'
                  : 'bg-dark-850 hover:bg-dark-800 text-slate-400 hover:text-slate-200 border border-dark-750'
              }`}
            >
              <span>{tag}</span>
              {isSelected && <X className="h-3 w-3 text-brand-300 ml-0.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
