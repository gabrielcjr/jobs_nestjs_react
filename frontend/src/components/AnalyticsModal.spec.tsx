import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import React from 'react';
import { AnalyticsModal } from './AnalyticsModal';
import * as useAnalyticsModule from '../hooks/useAnalytics';

vi.mock('../hooks/useAnalytics', () => ({
  useMarketOverview: vi.fn(),
  useSalaryByRole: vi.fn(),
  useTechDemand: vi.fn(),
}));

describe('AnalyticsModal Component', () => {
  const mockOverview = {
    totalActiveJobs: 250,
    totalCompanies: 40,
    salaryDisclosedCount: 180,
    salaryDisclosedPercent: 72,
    remoteJobsCount: 190,
    remotePercent: 76,
    latamEligibleCount: 65,
  };

  const mockSalaryRoles = [
    {
      roleCategory: 'BACKEND',
      roleLabel: 'Backend Engineering',
      jobCount: 90,
      avgMinSalary: 140000,
      avgMaxSalary: 190000,
    },
    {
      roleCategory: 'FRONTEND',
      roleLabel: 'Frontend Engineering',
      jobCount: 60,
      avgMinSalary: 130000,
      avgMaxSalary: 175000,
    },
  ];

  const mockTechDemand = [
    { tag: 'TypeScript', jobCount: 120, avgMaxSalary: 185000 },
    { tag: 'Go', jobCount: 85, avgMaxSalary: 195000 },
  ];

  beforeEach(() => {
    vi.mocked(useAnalyticsModule.useMarketOverview).mockReturnValue({
      data: mockOverview,
      isLoading: false,
    } as any);

    vi.mocked(useAnalyticsModule.useSalaryByRole).mockReturnValue({
      data: mockSalaryRoles,
      isLoading: false,
    } as any);

    vi.mocked(useAnalyticsModule.useTechDemand).mockReturnValue({
      data: mockTechDemand,
      isLoading: false,
    } as any);
  });

  it('should not render anything when isOpen is false', () => {
    const { container } = render(
      <AnalyticsModal isOpen={false} onClose={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render KPI overview cards, salary benchmarks, and tech rankings when isOpen is true', () => {
    render(<AnalyticsModal isOpen={true} onClose={vi.fn()} />);

    expect(
      screen.getByText('Software Engineering Market Intelligence'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('analytics-kpi-grid')).toBeInTheDocument();
    expect(screen.getByText('250')).toBeInTheDocument(); // Live roles
    expect(screen.getByText('76%')).toBeInTheDocument(); // Remote ratio
    expect(screen.getByText('Backend Engineering')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Go')).toBeInTheDocument();
  });

  it('should call onClose when clicking the close button', () => {
    const handleClose = vi.fn();
    render(<AnalyticsModal isOpen={true} onClose={handleClose} />);

    const closeBtn = screen.getByTestId('close-analytics-modal');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
