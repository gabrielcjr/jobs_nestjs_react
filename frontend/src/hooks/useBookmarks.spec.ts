import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useBookmarks } from './useBookmarks';

describe('useBookmarks', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockJob = {
    id: 'job-101',
    slug: 'acme-senior-engineer-job-101',
    title: 'Senior Distributed Systems Engineer',
    companyName: 'Acme Corp',
    atsProvider: 'GREENHOUSE',
    location: 'Remote, US',
    workplaceType: 'REMOTE',
  };

  it('should initialize with empty bookmarks and viewed set', () => {
    const { result } = renderHook(() => useBookmarks());

    expect(result.current.bookmarks).toEqual([]);
    expect(result.current.bookmarkCount).toBe(0);
    expect(result.current.isBookmarked('job-101')).toBe(false);
    expect(result.current.isViewed('job-101')).toBe(false);
  });

  it('should toggle bookmark on and off', () => {
    const { result } = renderHook(() => useBookmarks());

    // 1. Add bookmark
    act(() => {
      result.current.toggleBookmark(mockJob);
    });

    expect(result.current.bookmarkCount).toBe(1);
    expect(result.current.isBookmarked('job-101')).toBe(true);
    expect(result.current.getBookmark('job-101')?.status).toBe('SAVED');

    // 2. Remove bookmark
    act(() => {
      result.current.toggleBookmark(mockJob);
    });

    expect(result.current.bookmarkCount).toBe(0);
    expect(result.current.isBookmarked('job-101')).toBe(false);
  });

  it('should update application status in the pipeline', () => {
    const { result } = renderHook(() => useBookmarks());

    act(() => {
      result.current.toggleBookmark(mockJob);
    });

    act(() => {
      result.current.updateStatus('job-101', 'APPLIED');
    });

    expect(result.current.getBookmark('job-101')?.status).toBe('APPLIED');

    act(() => {
      result.current.updateStatus('job-101', 'INTERVIEWING');
    });

    expect(result.current.getBookmark('job-101')?.status).toBe('INTERVIEWING');
  });

  it('should track and persist viewed job offers', () => {
    const { result } = renderHook(() => useBookmarks());

    expect(result.current.isViewed('job-101')).toBe(false);

    act(() => {
      result.current.markAsViewed('job-101');
    });

    expect(result.current.isViewed('job-101')).toBe(true);
    expect(result.current.isViewed('job-999')).toBe(false);
  });

  it('should persist bookmarks and viewed across hook re-renders', () => {
    const { result: firstHook } = renderHook(() => useBookmarks());

    act(() => {
      firstHook.current.toggleBookmark(mockJob);
      firstHook.current.markAsViewed(mockJob.id);
    });

    // Re-instantiate hook (simulating page reload)
    const { result: secondHook } = renderHook(() => useBookmarks());

    expect(secondHook.current.bookmarkCount).toBe(1);
    expect(secondHook.current.isBookmarked('job-101')).toBe(true);
    expect(secondHook.current.isViewed('job-101')).toBe(true);
  });
});
