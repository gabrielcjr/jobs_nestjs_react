import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompanyAvatar } from './CompanyAvatar';
import { TechStackPills } from './TechStackPills';
import { RoleCategoryTabs } from './RoleCategoryTabs';

describe('Frontend Component Integration Suite', () => {
  describe('CompanyAvatar', () => {
    it('should render initials and title for company', () => {
      render(<CompanyAvatar name="Stripe" size="md" />);
      expect(screen.getByText('ST')).toBeInTheDocument();
      expect(screen.getByTitle('Stripe')).toBeInTheDocument();
    });

    it('should generate two-letter initials for two-word companies', () => {
      render(<CompanyAvatar name="Sticker Mule" size="sm" />);
      expect(screen.getByText('SM')).toBeInTheDocument();
    });
  });

  describe('TechStackPills', () => {
    it('should render popular tags and call onToggleTag when clicked', () => {
      const onToggleMock = vi.fn();
      render(
        <TechStackPills
          selectedTags={['TypeScript']}
          onToggleTag={onToggleMock}
          availableTags={[
            { name: 'TypeScript', count: 120 },
            { name: 'Go', count: 85 },
            { name: 'React', count: 95 },
          ]}
        />
      );

      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      expect(screen.getByText('Go')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Go'));
      expect(onToggleMock).toHaveBeenCalledWith('Go');
    });
  });

  describe('RoleCategoryTabs', () => {
    it('should render role category tabs with counts', () => {
      const onSelectMock = vi.fn();
      render(
        <RoleCategoryTabs
          selectedRole="BACKEND"
          onSelectRole={onSelectMock}
          roleCounts={{ BACKEND: 42, FRONTEND: 18 }}
          totalCount={60}
        />
      );

      expect(screen.getByText('All Roles')).toBeInTheDocument();
      expect(screen.getByText('Backend')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Frontend'));
      expect(onSelectMock).toHaveBeenCalledWith('FRONTEND');
    });
  });
});
