import { AtsDiscoveryService } from './ats-discovery.service';
import { AtsProvider } from '@prisma/client';

describe('AtsDiscoveryService', () => {
  let service: AtsDiscoveryService;

  beforeEach(() => {
    service = new AtsDiscoveryService();
  });

  describe('generateCandidateSlugs', () => {
    it('should generate expected candidate slug variations', () => {
      const candidates = service.generateCandidateSlugs('Acme Technologies Inc');

      expect(candidates).toContain('acme');
      expect(candidates.some((c) => c.startsWith('acme'))).toBe(true);
    });

    it('should prioritize explicit and known slugs when provided', () => {
      const candidates = service.generateCandidateSlugs('Sticker Mule', 'stickermule', 'stickermule-careers');

      expect(candidates[0]).toBe('stickermule-careers');
      expect(candidates[1]).toBe('stickermule');
    });

    it('should eliminate duplicate candidate slugs', () => {
      const candidates = service.generateCandidateSlugs('Zapier', 'zapier');
      const zapierOccurrences = candidates.filter((c) => c === 'zapier').length;
      expect(zapierOccurrences).toBe(1);
    });
  });

  describe('readCompanyCsv', () => {
    it('should parse company entries from global-hiring-companies.csv', () => {
      const rows = service.readCompanyCsv(1, 10);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0]).toHaveProperty('company');
      expect(rows[0]).toHaveProperty('slug');
      expect(rows[0].tier).toBeLessThanOrEqual(1);
    });
  });
});
