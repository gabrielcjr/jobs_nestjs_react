import { describe, it, expect } from 'vitest';
import {
  formatSalary,
  formatTimeAgo,
  isNewJob,
  getAtsBadgeStyles,
  getRoleCategoryLabel,
  getExperienceLevelLabel,
} from './formatters';

describe('Frontend Formatters & Presentation Helpers', () => {
  describe('formatSalary', () => {
    it('should format annual salary ranges in thousands', () => {
      expect(formatSalary(120000, 160000, 'USD')).toBe('$120k - $160k USD');
      expect(formatSalary(100000, 130000, 'EUR')).toBe('€100k - €130k EUR');
      expect(formatSalary(80000, 110000, 'GBP')).toBe('£80k - £110k GBP');
    });

    it('should format hourly rates', () => {
      expect(formatSalary(60, 90, 'USD')).toBe('$60 - $90 / hr');
    });

    it('should return salary summary text when provided directly', () => {
      expect(formatSalary(null, null, 'USD', '$150,000 - $180,000 + Equity')).toBe('$150,000 - $180,000 + Equity');
    });

    it('should return null when no salary data is present', () => {
      expect(formatSalary(null, null, 'USD', null)).toBeNull();
    });
  });

  describe('isNewJob', () => {
    it('should return true for jobs first seen within 48 hours', () => {
      const now = new Date().toISOString();
      expect(isNewJob(now)).toBe(true);

      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      expect(isNewJob(yesterday)).toBe(true);
    });

    it('should return false for jobs first seen older than 48 hours', () => {
      const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
      expect(isNewJob(threeDaysAgo)).toBe(false);
    });
  });

  describe('getAtsBadgeStyles', () => {
    it('should provide distinct styling for all 3 ATS platforms', () => {
      expect(getAtsBadgeStyles('GREENHOUSE').label).toBe('Greenhouse');
      expect(getAtsBadgeStyles('LEVER').label).toBe('Lever');
      expect(getAtsBadgeStyles('ASHBY').label).toBe('Ashby');
    });
  });

  describe('getRoleCategoryLabel & getExperienceLevelLabel', () => {
    it('should map enum keys to user-friendly titles', () => {
      expect(getRoleCategoryLabel('DEVOPS_SRE_INFRA')).toBe('DevOps & Infra');
      expect(getRoleCategoryLabel('DATA_AI_ML')).toBe('Data & AI / ML');
      expect(getExperienceLevelLabel('STAFF_PLUS')).toBe('Staff / Principal');
    });
  });
});
