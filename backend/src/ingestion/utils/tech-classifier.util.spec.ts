import {
  cleanCompanyName,
  inferRoleCategory,
  inferSeniority,
  inferWorkplaceType,
  extractTechTags,
  unescapeHtml,
  isItJob,
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
      const text = 'Senior Backend Engineer in Go/Python with Kafka, Redis, Docker, PostgreSQL, and AWS.';
      const tags = extractTechTags(text);

      expect(tags).toContain('Go');
      expect(tags).toContain('PostgreSQL');
      expect(tags).toContain('Python');
      expect(tags).toContain('Kafka');
      expect(tags).toContain('Redis');
      expect(tags).toContain('Docker');
      expect(tags).toContain('AWS');
    });

    it('should accurately detect Golang programming language variants', () => {
      expect(extractTechTags('Requirements: Golang backend development')).toContain('Go');
      expect(extractTechTags('Proficient in Go (Golang) and Docker')).toContain('Go');
      expect(extractTechTags('Experience with the Go programming language')).toContain('Go');
      expect(extractTechTags('Go backend engineer needed')).toContain('Go');
      expect(extractTechTags('We write code in Python, Go, and TypeScript')).toContain('Go');
    });

    it('should avoid false positives for common English usage of go', () => {
      const text = 'We are ready to go live and go to the market. Let it go. We go above and beyond.';
      const tags = extractTechTags(text);
      expect(tags).not.toContain('Go');
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

  describe('isItJob (IT Role Filtering)', () => {
    describe('Positive IT Roles', () => {
      it('should identify software engineering and development positions', () => {
        expect(isItJob('Software Engineer')).toBe(true);
        expect(isItJob('Senior Software Engineer, Payment Infrastructure')).toBe(true);
        expect(isItJob('Staff Software Engineer - Experimentation')).toBe(true);
        expect(isItJob('Principal Systems Architect')).toBe(true);
        expect(isItJob('Lead Backend Engineer')).toBe(true);
        expect(isItJob('Senior Fullstack Engineer')).toBe(true);
        expect(isItJob('Frontend Developer (React/TypeScript)')).toBe(true);
        expect(isItJob('Mobile Engineer (iOS/Android)')).toBe(true);
        expect(isItJob('Firmware Engineer')).toBe(true);
        expect(isItJob('Embedded Systems Engineer')).toBe(true);
        expect(isItJob('Salesforce Developer')).toBe(true);
        expect(isItJob('Member of Technical Staff')).toBe(true);
      });

      it('should identify DevOps, SRE, and Infrastructure positions', () => {
        expect(isItJob('DevOps Engineer (Kubernetes, AWS)')).toBe(true);
        expect(isItJob('Dev Ops II')).toBe(true);
        expect(isItJob('Site Reliability Engineer (SRE)')).toBe(true);
        expect(isItJob('Cloud Infrastructure Architect')).toBe(true);
        expect(isItJob('Platform Engineer')).toBe(true);
        expect(isItJob('Systems Administrator')).toBe(true);
        expect(isItJob('Database Administrator (DBA)')).toBe(true);
        expect(isItJob('Network Engineer')).toBe(true);
      });

      it('should identify Data, AI, and Machine Learning positions', () => {
        expect(isItJob('Machine Learning Engineer - LLMs')).toBe(true);
        expect(isItJob('Senior Data Engineer')).toBe(true);
        expect(isItJob('Data Scientist, Core Platform')).toBe(true);
        expect(isItJob('Analytics Engineer')).toBe(true);
        expect(isItJob('AI Engineer')).toBe(true);
        expect(isItJob('Computer Vision Researcher')).toBe(true);
      });

      it('should identify Cybersecurity positions', () => {
        expect(isItJob('Application Security Engineer')).toBe(true);
        expect(isItJob('SecOps Engineer I')).toBe(true);
        expect(isItJob('Infosec Analyst')).toBe(true);
        expect(isItJob('Penetration Tester')).toBe(true);
        expect(isItJob('SOC Analyst')).toBe(true);
      });

      it('should identify QA and Testing positions', () => {
        expect(isItJob('QA Engineer')).toBe(true);
        expect(isItJob('SDET - Test Automation')).toBe(true);
        expect(isItJob('Software Engineer in Test')).toBe(true);
        expect(isItJob('Quality Assurance Analyst')).toBe(true);
      });

      it('should identify IT Support, TechOps, and Engineering Leadership', () => {
        expect(isItJob('IT Support Specialist')).toBe(true);
        expect(isItJob('Senior Manager, IT')).toBe(true);
        expect(isItJob('Chief Technology Officer (CTO)')).toBe(true);
        expect(isItJob('VP of Engineering')).toBe(true);
        expect(isItJob('Director of Technology')).toBe(true);
        expect(isItJob('Engineering Manager - Platform')).toBe(true);
        expect(isItJob('Technical Program Manager (TPM)')).toBe(true);
        expect(isItJob('Solutions Architect')).toBe(true);
        expect(isItJob('Customer Reliability Engineer')).toBe(true);
      });

      it('should identify technical positions assisted by engineering department', () => {
        expect(isItJob('Specialist', 'Software Engineering')).toBe(true);
        expect(isItJob('Technical Director', 'Technology')).toBe(true);
      });
    });

    describe('Negative Non-IT Roles (Must be Excluded)', () => {
      it('should exclude Sales and Business Development positions, even with tech buzzwords', () => {
        expect(isItJob('Account Executive, AI Sales')).toBe(false);
        expect(isItJob('Account Executive, Commercial Hunter')).toBe(false);
        expect(isItJob('Enterprise Account Executive')).toBe(false);
        expect(isItJob('Business Development Representative (BDR)')).toBe(false);
        expect(isItJob('Sales Development Representative (SDR)')).toBe(false);
        expect(isItJob('Sales Manager, Cloud Platforms')).toBe(false);
        expect(isItJob('Commercial Hunter')).toBe(false);
        expect(isItJob('Partner Manager, SaaS')).toBe(false);
      });

      it('should exclude Marketing, PR, and Content positions', () => {
        expect(isItJob('Performance Marketing Manager, Paid Social')).toBe(false);
        expect(isItJob('Product Marketing Manager')).toBe(false);
        expect(isItJob('Content Marketing Specialist')).toBe(false);
        expect(isItJob('Brand Manager')).toBe(false);
        expect(isItJob('Events Manager')).toBe(false);
        expect(isItJob('Social Media Coordinator')).toBe(false);
        expect(isItJob('SEO Specialist')).toBe(false);
      });

      it('should exclude Recruiting, HR, and People positions', () => {
        expect(isItJob('Lead Technical Recruiter')).toBe(false);
        expect(isItJob('Senior Technical Recruiter - Physical AI')).toBe(false);
        expect(isItJob('Talent Acquisition Partner')).toBe(false);
        expect(isItJob('HR Business Partner (HRBP)')).toBe(false);
        expect(isItJob('People Operations Specialist')).toBe(false);
        expect(isItJob('Compensation & Benefits Manager')).toBe(false);
      });

      it('should exclude Legal, Compliance, Finance, and Accounting positions', () => {
        expect(isItJob('Commercial Counsel, EMEA')).toBe(false);
        expect(isItJob('Corporate Legal Counsel')).toBe(false);
        expect(isItJob('Paralegal')).toBe(false);
        expect(isItJob('Finance & Strategy Partner, Central Engineering')).toBe(false);
        expect(isItJob('Senior Accountant')).toBe(false);
        expect(isItJob('Financial Analyst')).toBe(false);
        expect(isItJob('Credit Operations Collections Analyst')).toBe(false);
        expect(isItJob('Tax Manager')).toBe(false);
        expect(isItJob('Payroll Specialist')).toBe(false);
      });

      it('should exclude Administrative, Facilities, and Service positions', () => {
        expect(isItJob('Executive Assistant to CTO')).toBe(false);
        expect(isItJob('Office Manager')).toBe(false);
        expect(isItJob('Workplace Coordinator')).toBe(false);
        expect(isItJob('Culinary Team Lead / Chef')).toBe(false);
        expect(isItJob('Customer Success Manager')).toBe(false);
        expect(isItJob('Customer Service Representative')).toBe(false);
      });

      it('should exclude traditional non-software engineering disciplines', () => {
        expect(isItJob('Civil Engineer')).toBe(false);
        expect(isItJob('Chemical Engineer')).toBe(false);
        expect(isItJob('HVAC Engineer')).toBe(false);
        expect(isItJob('Environmental Engineer')).toBe(false);
      });
    });
  });
});
