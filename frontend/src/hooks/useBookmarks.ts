import { useState, useEffect, useCallback } from 'react';

export type ApplicationStatus = 'SAVED' | 'APPLIED' | 'INTERVIEWING' | 'OFFER' | 'REJECTED';

export interface BookmarkItem {
  jobId: string;
  jobSlug: string;
  title: string;
  companyName: string;
  atsProvider: string;
  location?: string | null;
  workplaceType?: string | null;
  status: ApplicationStatus;
  savedAt: string; // ISO 8601 string
  notes?: string;
}

export interface BookmarkJobInput {
  id: string;
  slug: string;
  title: string;
  companyName: string;
  atsProvider: string;
  location?: string | null;
  workplaceType?: string | null;
}


const STORAGE_KEY_BOOKMARKS = 'devats:bookmarks:v1';
const STORAGE_KEY_VIEWED = 'devats:viewed_jobs:v1';
const EVENT_BOOKMARKS_CHANGED = 'devats-bookmarks-updated';

function loadStoredBookmarks(): Record<string, BookmarkItem> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function loadStoredViewedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VIEWED);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function useBookmarks() {
  const [bookmarksMap, setBookmarksMap] = useState<Record<string, BookmarkItem>>(() => loadStoredBookmarks());
  const [viewedIds, setViewedIds] = useState<Set<string>>(() => loadStoredViewedIds());

  const syncState = useCallback(() => {
    setBookmarksMap(loadStoredBookmarks());
    setViewedIds(loadStoredViewedIds());
  }, []);

  useEffect(() => {
    const handleStorage = () => syncState();
    window.addEventListener('storage', handleStorage);
    window.addEventListener(EVENT_BOOKMARKS_CHANGED, handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(EVENT_BOOKMARKS_CHANGED, handleStorage);
    };
  }, [syncState]);

  const persistBookmarks = (updated: Record<string, BookmarkItem>) => {
    setBookmarksMap(updated);
    try {
      localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(updated));
      window.dispatchEvent(new Event(EVENT_BOOKMARKS_CHANGED));
    } catch (e) {
      console.warn('Failed saving bookmarks to localStorage', e);
    }
  };

  const persistViewedIds = (updated: Set<string>) => {
    setViewedIds(updated);
    try {
      localStorage.setItem(STORAGE_KEY_VIEWED, JSON.stringify(Array.from(updated)));
      window.dispatchEvent(new Event(EVENT_BOOKMARKS_CHANGED));
    } catch (e) {
      console.warn('Failed saving viewed jobs to localStorage', e);
    }
  };

  const isBookmarked = useCallback(
    (jobId: string): boolean => {
      return Boolean(bookmarksMap[jobId]);
    },
    [bookmarksMap],
  );

  const getBookmark = useCallback(
    (jobId: string): BookmarkItem | undefined => {
      return bookmarksMap[jobId];
    },
    [bookmarksMap],
  );

  const toggleBookmark = useCallback(
    (job: BookmarkJobInput) => {
      const updated = { ...bookmarksMap };
      if (updated[job.id]) {
        delete updated[job.id];
      } else {
        updated[job.id] = {
          jobId: job.id,
          jobSlug: job.slug,
          title: job.title,
          companyName: job.companyName,
          atsProvider: job.atsProvider,
          location: job.location,
          workplaceType: job.workplaceType,
          status: 'SAVED',
          savedAt: new Date().toISOString(),
        };
      }
      persistBookmarks(updated);
    },
    [bookmarksMap],
  );

  const updateStatus = useCallback(
    (jobId: string, status: ApplicationStatus) => {
      if (!bookmarksMap[jobId]) return;
      const updated = {
        ...bookmarksMap,
        [jobId]: {
          ...bookmarksMap[jobId],
          status,
        },
      };
      persistBookmarks(updated);
    },
    [bookmarksMap],
  );

  const updateNotes = useCallback(
    (jobId: string, notes: string) => {
      if (!bookmarksMap[jobId]) return;
      const updated = {
        ...bookmarksMap,
        [jobId]: {
          ...bookmarksMap[jobId],
          notes,
        },
      };
      persistBookmarks(updated);
    },
    [bookmarksMap],
  );

  const isViewed = useCallback(
    (jobId: string): boolean => {
      return viewedIds.has(jobId);
    },
    [viewedIds],
  );

  const markAsViewed = useCallback(
    (jobId: string) => {
      if (!jobId || viewedIds.has(jobId)) return;
      const updated = new Set(viewedIds);
      updated.add(jobId);
      persistViewedIds(updated);
    },
    [viewedIds],
  );

  const clearAllBookmarks = useCallback(() => {
    persistBookmarks({});
  }, []);

  const bookmarks = Object.values(bookmarksMap);
  const bookmarkCount = bookmarks.length;

  return {
    bookmarks,
    bookmarkCount,
    bookmarksMap,
    isBookmarked,
    getBookmark,
    toggleBookmark,
    updateStatus,
    updateNotes,
    isViewed,
    markAsViewed,
    clearAllBookmarks,
  };
}
