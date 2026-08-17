import {
  cleanCompanyName,
  inferRoleCategory,
  inferSeniority,
  inferWorkplaceType,
  extractTechTags,
  unescapeHtml,
} from './tech-classifier.util';
import { RoleCategory, ExperienceLevel, WorkplaceType } from '@prisma/client';

describe('TechClassifier & Normalization Utilities', () => {
  describe('cleanCompanyName', () => {
    it('should strip corporate legal suffixes accurately', () => {
      expect(cleanCompanyName('Acme Corp')).toBe('Acme');
      expect(cleanCompanyName('OpenAI Inc.')).toBe('OpenAI');
      expect(cleanCompanyName('DeepMind Technologies Limited')).toBe('DeepMind');
      expect(cleanCompanyName('HashiCorp LLC')).toBe('HashiCorp');
      expect(cleanCompanyName('Vercel Labs')).toBe('Vercel');
    });

    it('should preserve valid company names without suffixes', () => {
      expect(cleanCompanyName('Stripe')).toBe('Stripe');
      expect(cleanCompanyName('Airbnb')).toBe('Airbnb');
      expect(cleanCompanyName('Figma')).toBe('Figma');
    });
  });

  describe('inferRoleCategory', () => {
    it('should classify backend roles', () => {
      expect(inferRoleCategory('Senior Backend Engineer')).toBe(RoleCategory.BACKEND);
      expect(inferRoleCategory('Go / Distributed Systems Developer')).toBe(RoleCategory.BACKEND);
    });

    it('should classify frontend roles', () => {
      expect(inferRoleCategory('Lead Frontend Engineer (React/TypeScript)')).toBe(RoleCategory.FRONTEND);
      expect(inferRoleCategory('Staff UI/UX Engineer')).toBe(RoleCategory.FRONTEND);
    });

    it('should classify fullstack roles', () => {
      expect(inferRoleCategory('Full Stack Engineer')).toBe(RoleCategory.FULLSTACK);
      expect(inferRoleCategory('Fullstack Developer')).toBe(RoleCategory.FULLSTACK);
    });

    it('should classify devops, SRE, and infrastructure roles', () => {
      expect(inferRoleCategory('DevOps Engineer (Kubernetes, AWS)')).toBe(RoleCategory.DEVOPS_SRE_INFRA);
      expect(inferRoleCategory('Site Reliability Engineer (SRE)')).toBe(RoleCategory.DEVOPS_SRE_INFRA);
      expect(inferRoleCategory('Cloud Infrastructure Architect')).toBe(RoleCategory.DEVOPS_SRE_INFRA);
    });

    it('should classify AI, ML, and Data roles', () => {
      expect(inferRoleCategory('Machine Learning Engineer - LLMs')).toBe(RoleCategory.DATA_AI_ML);
      expect(inferRoleCategory('Senior Data Engineer')).toBe(RoleCategory.DATA_AI_ML);
    });

    it('should classify security and management roles', () => {
      expect(inferRoleCategory('Application Security Engineer')).toBe(RoleCategory.SECURITY);
      expect(inferRoleCategory('Engineering Manager - Platform')).toBe(RoleCategory.ENGINEERING_MANAGEMENT);
    });
  });

  describe('inferSeniority', () => {
    it('should identify seniority levels accurately', () => {
      expect(inferSeniority('Software Engineering Intern')).toBe(ExperienceLevel.INTERN);
      expect(inferSeniority('Junior Python Developer')).toBe(ExperienceLevel.JUNIOR);
      expect(inferSeniority('Senior Full Stack Engineer')).toBe(ExperienceLevel.SENIOR);
      expect(inferSeniority('Staff Software Engineer')).toBe(ExperienceLevel.STAFF_PLUS);
      expect(inferSeniority('Principal Systems Architect')).toBe(ExperienceLevel.STAFF_PLUS);
      expect(inferSeniority('Engineering Lead')).toBe(ExperienceLevel.LEAD);
    });
  });

  describe('inferWorkplaceType', () => {
    it('should detect workplace policy', () => {
      expect(inferWorkplaceType('Remote', 'Worldwide')).toBe(WorkplaceType.REMOTE);
      expect(inferWorkplaceType('New York, NY', 'Hybrid')).toBe(WorkplaceType.HYBRID);
      expect(inferWorkplaceType('Austin, TX', 'Onsite')).toBe(WorkplaceType.ONSITE);
    });
  });

  describe('extractTechTags', () => {
    it('should extract tech stack keywords using word boundary matching', () => {
      const text = 'Senior Backend Engineer in Go and Python with Kafka, Redis, Docker, PostgreSQL, and AWS.';
      const tags = extractTechTags(text);

      expect(tags).toContain('Go');
      expect(tags).toContain('PostgreSQL');
      expect(tags).toContain('Python');
      expect(tags).toContain('Kafka');
      expect(tags).toContain('Redis');
      expect(tags).toContain('Docker');
      expect(tags).toContain('AWS');
    });

    it('should avoid false positives with substrings', () => {
      const text = 'Management and leadership in reactivating accounts';
      const tags = extractTechTags(text);
      expect(tags).not.toContain('React');
      expect(tags).not.toContain('Go');
    });
  });

  describe('unescapeHtml', () => {
    it('should decode named and numeric HTML entities', () => {
      expect(unescapeHtml('&lt;div&gt;Hello &amp; Welcome&lt;/div&gt;')).toBe('<div>Hello & Welcome</div>');
      expect(unescapeHtml('&#39;Senior Engineer&#39; &quot;Top Tier&quot;')).toBe("'Senior Engineer' \"Top Tier\"");
      expect(unescapeHtml('&euro;120k &pound;100k')).toBe('€120k £100k');
    });
  });
});
