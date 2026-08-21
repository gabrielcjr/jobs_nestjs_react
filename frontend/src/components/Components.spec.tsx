import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompanyAvatar } from './CompanyAvatar';
import { TechStackPills } from './TechStackPills';
import { RoleCategoryTabs } from './RoleCategoryTabs';
import { JobCard } from './JobCard';


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

    it('should render Saved Jobs tab and handle click', () => {
      const onToggleSavedMock = vi.fn();
      render(
        <RoleCategoryTabs
          selectedRole="ALL"
          onSelectRole={() => {}}
          savedCount={3}
          showSavedOnly={false}
          onToggleSavedOnly={onToggleSavedMock}
        />
      );

      const savedTab = screen.getByTestId('filter-saved-jobs');
      expect(savedTab).toBeInTheDocument();
      expect(screen.getByTestId('saved-count-badge')).toHaveTextContent('3');

      fireEvent.click(savedTab);
      expect(onToggleSavedMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('JobCard with Bookmarks and Viewed Indicator', () => {
    const mockJob: any = {
      id: 'job-1',
      externalJobId: 'ext-1',
      title: 'Senior Fullstack Engineer',
      company: { name: 'Acme Labs', slug: 'acme' },
      atsProvider: 'GREENHOUSE',
      location: 'Remote, US',
      workplaceType: 'REMOTE',
      experienceLevel: 'SENIOR',
      tags: ['React', 'Node.js'],
      minSalary: 140000,
      maxSalary: 180000,
      currency: 'USD',
    };

    it('should render viewed eye badge when isViewed is true', () => {
      render(
        <JobCard
          job={mockJob}
          isSelected={false}
          onSelect={() => {}}
          isViewed={true}
          isBookmarked={false}
        />
      );

      expect(screen.getByTestId('viewed-badge-job-1')).toBeInTheDocument();
      expect(screen.getByText('Viewed')).toBeInTheDocument();
    });

    it('should toggle bookmark when bookmark button is clicked without selecting card', () => {
      const onSelectMock = vi.fn();
      const onToggleMock = vi.fn();

      render(
        <JobCard
          job={mockJob}
          isSelected={false}
          onSelect={onSelectMock}
          isBookmarked={false}
          onToggleBookmark={onToggleMock}
        />
      );

      const bookmarkBtn = screen.getByTestId('bookmark-btn-job-1');
      expect(bookmarkBtn).toBeInTheDocument();

      fireEvent.click(bookmarkBtn);
      expect(onToggleMock).toHaveBeenCalledTimes(1);
      expect(onSelectMock).not.toHaveBeenCalled();
    });
  });
});

