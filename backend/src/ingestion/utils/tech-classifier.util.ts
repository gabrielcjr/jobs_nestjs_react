import { ExperienceLevel, RoleCategory, WorkplaceType } from '@prisma/client';

export const TECH_DICTIONARY: { name: string; pattern: RegExp }[] = [
  // Languages
  { name: 'TypeScript', pattern: /\b(typescript|ts)\b/i },
  { name: 'JavaScript', pattern: /\b(javascript|es6|es202\d)\b/i },
  { name: 'Python', pattern: /\bpython\b/i },
  {
    name: 'Go',
    pattern: /\b(golang|go\s*(lang|language|programming|developer|engineer|backend|microservices)|go\s*\(\s*golang\s*\)|golang\s*\(\s*go\s*\)|go\s*\(?1\.\d+)\b|\b(rust|python|typescript|javascript|java|c\+\+|cpp|c#|node|nodejs|grpc|kubernetes|k8s|docker|postgresql|postgres|sql|aws|gcp|backend|fullstack)\s*[\/,|&]\s*go\b|\bgo\s*[\/,|&]\s*(rust|python|typescript|javascript|java|c\+\+|cpp|c#|node|nodejs|grpc|kubernetes|k8s|docker|postgresql|postgres|sql|aws|gcp|backend|fullstack)\b|\b(python|rust|typescript|javascript|java|c\+\+|cpp|c#|node|ruby|scala),\s*go\b|\bgo,\s*(python|rust|typescript|javascript|java|c\+\+|cpp|c#|node|ruby|scala)\b/i,
  },
  { name: 'Java', pattern: /\bjava\b(?!script)/i },
  { name: 'C++', pattern: /\b(c\+\+|cpp)\b/i },
  { name: 'C#', pattern: /\b(c#|\.net core|\.net)\b/i },
  { name: 'Ruby', pattern: /\b(ruby|rails)\b/i },
  { name: 'PHP', pattern: /\b(php|laravel)\b/i },
  { name: 'Swift', pattern: /\bswift\b/i },
  { name: 'Kotlin', pattern: /\bkotlin\b/i },
  { name: 'Elixir', pattern: /\b(elixir|phoenix)\b/i },
  { name: 'Scala', pattern: /\bscala\b/i },

  // Frontend Frameworks & Libraries
  { name: 'React', pattern: /\breact(\.js)?\b/i },
  { name: 'Next.js', pattern: /\bnext(\.js)?\b/i },
  { name: 'Vue', pattern: /\bvue(\.js)?\b/i },
  { name: 'Nuxt', pattern: /\bnuxt(\.js)?\b/i },
  { name: 'Angular', pattern: /\bangular\b/i },
  { name: 'Svelte', pattern: /\b(svelte|sveltekit)\b/i },
  { name: 'Tailwind CSS', pattern: /\btailwind(\s?css)?\b/i },
  { name: 'Redux', pattern: /\bredux\b/i },

  // Backend Frameworks & Systems
  { name: 'Node.js', pattern: /\bnode(\.js)?\b/i },
  { name: 'NestJS', pattern: /\bnest(\.js|js)?\b/i },
  { name: 'FastAPI', pattern: /\bfastapi\b/i },
  { name: 'Django', pattern: /\bdjango\b/i },
  { name: 'Flask', pattern: /\bflask\b/i },
  { name: 'Spring Boot', pattern: /\bspring(\s?boot)?\b/i },
  { name: 'Express', pattern: /\bexpress(\.js)?\b/i },
  { name: 'GraphQL', pattern: /\bgraphql\b/i },
  { name: 'gRPC', pattern: /\bgrpc\b/i },

  // Databases & Messaging
  { name: 'PostgreSQL', pattern: /\b(postgresql|postgres|psql)\b/i },
  { name: 'MySQL', pattern: /\bmysql\b/i },
  { name: 'MongoDB', pattern: /\bmongo(db)?\b/i },
  { name: 'Redis', pattern: /\bredis\b/i },
  { name: 'Elasticsearch', pattern: /\b(elasticsearch|elastic search|opensearch)\b/i },
  { name: 'Kafka', pattern: /\b(kafka|apache kafka)\b/i },
  { name: 'RabbitMQ', pattern: /\brabbitmq\b/i },
  { name: 'Prisma', pattern: /\bprisma\b/i },
  { name: 'Cassandra', pattern: /\bcassandra\b/i },

  // Cloud, DevOps & Infrastructure
  { name: 'AWS', pattern: /\b(aws|amazon web services)\b/i },
  { name: 'GCP', pattern: /\b(gcp|google cloud)\b/i },
  { name: 'Azure', pattern: /\bazure\b/i },
  { name: 'Docker', pattern: /\bdocker\b/i },
  { name: 'Kubernetes', pattern: /\b(kubernetes|k8s)\b/i },
  { name: 'Terraform', pattern: /\bterraform\b/i },
  { name: 'CI/CD', pattern: /\b(ci\/cd|github actions|gitlab ci|jenkins)\b/i },
  { name: 'Linux', pattern: /\blinux\b/i },

  // AI, ML & Data
  { name: 'PyTorch', pattern: /\bpytorch\b/i },
  { name: 'TensorFlow', pattern: /\btensorflow\b/i },
  { name: 'LLM', pattern: /\b(llm|llms|large language model|openai|anthropic|langchain)\b/i },
  { name: 'Snowflake', pattern: /\bsnowflake\b/i },
  { name: 'Spark', pattern: /\b(apache spark|spark)\b/i },
];

export function extractTechTags(text: string): string[] {
  if (!text) return [];
  const matches = new Set<string>();
  for (const tech of TECH_DICTIONARY) {
    if (tech.pattern.test(text)) {
      matches.add(tech.name);
    }
  }
  return Array.from(matches);
}

export function inferSeniority(title: string): ExperienceLevel {
  const t = title.toLowerCase();
  if (/\b(intern|internship|co-op|apprentice)\b/i.test(t)) return ExperienceLevel.INTERN;
  if (/\b(junior|jr|entry|associate|graduate)\b/i.test(t)) return ExperienceLevel.JUNIOR;
  if (/\b(principal|distinguished|fellow|staff|architect)\b/i.test(t)) return ExperienceLevel.STAFF_PLUS;
  if (/\b(tech lead|team lead|lead|head of|manager|director|vp)\b/i.test(t)) return ExperienceLevel.LEAD;
  if (/\b(senior|sr|iii|iv|v)\b/i.test(t)) return ExperienceLevel.SENIOR;
  if (/\b(mid|ii)\b/i.test(t)) return ExperienceLevel.MID;
  return ExperienceLevel.UNSPECIFIED;
}

export function inferRoleCategory(title: string): RoleCategory {
  const t = title.toLowerCase();
  if (/\b(engineering manager|director of engineering|vp of engineering|cto|head of engineering)\b/i.test(t)) {
    return RoleCategory.ENGINEERING_MANAGEMENT;
  }
  if (/\b(security|infosec|appsec|soc|penetration)\b/i.test(t)) return RoleCategory.SECURITY;
  if (/\b(data engineer|data scientist|machine learning|ml|ai engineer|nlp|computer vision)\b/i.test(t)) return RoleCategory.DATA_AI_ML;
  if (/\b(devops|sre|site reliability|infrastructure|platform|cloud engineer)\b/i.test(t)) return RoleCategory.DEVOPS_SRE_INFRA;
  if (/\b(mobile|ios|android|react native|flutter)\b/i.test(t)) return RoleCategory.MOBILE;
  if (/\b(frontend|front-end|ui|react|vue|web developer)\b/i.test(t)) return RoleCategory.FRONTEND;
  if (/\b(backend|back-end|api|distributed|golang|rust|java developer)\b/i.test(t)) return RoleCategory.BACKEND;
  if (/\b(fullstack|full-stack|full stack)\b/i.test(t)) return RoleCategory.FULLSTACK;
  return RoleCategory.OTHER;
}

/**
 * Strict exclusion patterns for non-IT / non-development roles.
 * Matches roles that must NOT be treated as IT positions, even if they contain
 * incidental tech buzzwords or are located within tech companies.
 */
export const NON_IT_ROLE_PATTERNS: RegExp[] = [
  // 1. Sales, Business Development, Commercial & Account Management
  /\b(account executive|account rep(resentative)?|sales rep(resentative)?|sales manager|sales director|sales lead|sales associate|sales development|sdr|bdr|inside sales|commercial sales|enterprise sales|field sales|quota|closing specialist|business development rep(resentative)?|business development manager|partnerships? manager|partner manager|merchant success|commercial hunter|commercial grower|sales consultant|sales specialist|client executive)\b/i,

  // 2. Marketing, PR, Communications, SEO & Brand
  /\b(marketing manager|marketing specialist|marketing director|marketing lead|marketing coordinator|marketing associate|product marketing|performance marketing|digital marketing|brand marketing|growth marketing|content marketing|content creator|copywriter|copy editor|social media|seo specialist|public relations|\bpr\b|brand manager|communications manager|event planner|events manager|field marketing|demand gen(eration)?|campaign manager)\b/i,

  // 3. Recruiting, Talent Acquisition & Human Resources
  /\b(recruiter|recruiting|talent acquisition|sourcer|talent partner|human resources|\bhr\b|hrbp|people partner|people operations|employee relations|compensation & benefits|benefits manager|people experience|talent coordinator)\b/i,

  // 4. Legal, Compliance, Regulatory & Governance
  /\b(legal counsel|commercial counsel|corporate counsel|general counsel|counsel|attorney|lawyer|paralegal|compliance officer|regulatory counsel|contracts manager|privacy officer|policy manager)\b/i,

  // 5. Finance, Accounting, Tax, Underwriting & Collections
  /\b(accountant|accounting|financial analyst|controller|bookkeeper|billing specialist|payroll|treasury|underwriter|underwriting|collections analyst|collections rep(resentative)?|credit risk|credit operations|finance & strategy partner|strategic finance lead|tax manager|tax analyst)\b/i,

  // 6. Administrative, Office, Workplace & Facilities
  /\b(executive assistant|administrative assistant|office manager|receptionist|workplace coordinator|facilities|janitor|custodian|security guard|culinary|chef|cook|barista|kitchen|warehouse associate|logistics coordinator|driver)\b/i,

  // 7. Non-technical Customer Operations / Support / Retail
  /\b(customer service|customer success manager|client success manager|community manager|guest services|store manager|retail associate|call center rep(resentative)?)\b/i,

  // 8. Traditional non-software engineering disciplines
  /\b(civil engineer|chemical engineer|structural engineer|hvac|acoustic engineer|environmental engineer|sanitation engineer|petroleum engineer|biomedical engineer|geotechnical engineer)\b/i,
];

/**
 * Positive patterns for IT, Software Development, Data, Security, Infrastructure & Technical roles.
 */
export const IT_ROLE_PATTERNS: RegExp[] = [
  // Software Engineering & Development
  /\b(software|developer|programmer|coder)\b/i,
  /\b(frontend|front-end|backend|back-end|fullstack|full-stack|full stack)\b/i,
  /\b(web developer|webmaster|ui engineer|ux engineer|ui\/ux engineer)\b/i,
  /\b(mobile engineer|mobile developer|ios developer|ios engineer|android developer|android engineer|react native|flutter)\b/i,
  /\b(firmware|embedded systems|embedded software|embedded engineer|kernel developer|systems engineer|systems programmer|graphics engineer|game developer|compiler engineer|hardware engineer|robotics engineer|perception engineer|simulation engineer)\b/i,

  // Architecture
  /\b(software architect|solutions architect|enterprise architect|technical architect|system architect|cloud architect|data architect|infrastructure architect|security architect)\b/i,

  // DevOps, SRE, Cloud & Infrastructure
  /\b(devops|dev ops|dev-ops|devsecops|sre|site reliability|cloud engineer|platform engineer|infrastructure engineer|systems administrator|sysadmin|network engineer|network administrator|database administrator|dba|database engineer|reliability engineer)\b/i,

  // Data, AI, Machine Learning & Analytics
  /\b(data engineer|data scientist|data analyst|analytics engineer|bi developer|bi engineer|business intelligence developer|machine learning|ml engineer|ai engineer|artificial intelligence|deep learning|computer vision|nlp engineer|llm engineer|prompt engineer|algorithm engineer|applied scientist|research scientist|research engineer|data operations)\b/i,

  // Cybersecurity & Information Security
  /\b(security engineer|infosec|appsec|application security|cybersecurity|cyber security|information security|soc analyst|penetration test(er|ing)?|pentest(er|ing)?|vulnerability|devsecops|iam engineer|cryptography|secops)\b/i,

  // Quality Assurance & Software Testing
  /\b(qa engineer|quality assurance|sdet|test automation|test engineer|software test|automation engineer|qa analyst|quality engineer)\b/i,

  // IT Support, Services, TechOps & Technical Customer Solutions
  /\b(it specialist|it support|it engineer|it technician|it administrator|it analyst|desktop support|helpdesk|help desk|service desk|techops|systems support|technical support engineer|customer reliability engineer|forward deployed engineer|solution engineer|sales engineer|pre-sales engineer|pre-sales solutions architect)\b/i,

  // Engineering & Technical Leadership / Management
  /\b(cto|chief technology officer|cio|chief information officer|ciso|chief information security officer)\b/i,
  /\b(engineering manager|director of engineering|vp of engineering|head of engineering|vp of technology|director of technology|head of technology|it manager|it director|head of it|dev manager)\b/i,
  /\b((manager|director|lead|head|vp)[,\s]+(engineering|it|technology|tech))\b/i,
  /\b((engineering|it|technology|tech)\s+(manager|director|lead|head|vp))\b/i,
  /\b(tech lead|technical lead|lead developer|lead software engineer)\b/i,
  /\b(technical program manager|technical product manager|tpm|scrum master|agile coach)\b/i,
  /\b(staff engineer|principal engineer|founding engineer|member of technical staff|distinguished engineer)\b/i,
];

/**
 * Checks if a job is directly related with IT, software engineering, or technical operations.
 *
 * @param title The job title
 * @param department Optional department name from ATS
 * @returns true if the job is directly related with IT; false otherwise
 */
export function isItJob(title: string, department?: string): boolean {
  if (!title) return false;
  const cleanTitle = title.trim();

  // 1. Check strict exclusions (non-IT roles)
  for (const pattern of NON_IT_ROLE_PATTERNS) {
    if (pattern.test(cleanTitle)) {
      return false;
    }
  }

  // 2. Check positive IT role matches
  for (const pattern of IT_ROLE_PATTERNS) {
    if (pattern.test(cleanTitle)) {
      return true;
    }
  }

  // 3. Fallback: Generic "engineer" or "engineering" title (e.g. "Engineer II", "Staff Engineer", "Chief Engineer")
  if (/\b(engineer|engineering|architect)\b/i.test(cleanTitle)) {
    return true;
  }

  // 4. Department-assisted fallback: if department strongly indicates IT/Engineering and title is a technical role
  if (department) {
    const dept = department.trim().toLowerCase();
    const isTechDept = /\b(engineering|software engineering|technology|information technology|it|dev eng|core infrastructure|platform engineering|r&d)\b/i.test(dept);
    if (isTechDept && /\b(specialist|analyst|technician|lead|director|manager|head)\b/i.test(cleanTitle)) {
      return true;
    }
  }

  return false;
}

export function inferWorkplaceType(locationStr: string = '', workplaceStr: string = ''): WorkplaceType {
  const combined = `${locationStr} ${workplaceStr}`.toLowerCase();
  if (/\bremote|virtual|work from home|wfh\b/i.test(combined)) return WorkplaceType.REMOTE;
  if (/\bhybrid\b/i.test(combined)) return WorkplaceType.HYBRID;
  if (/\bonsite|on-site|in-office\b/i.test(combined)) return WorkplaceType.ONSITE;
  return WorkplaceType.UNSPECIFIED;
}

/**
 * Fast deterministic classifier for Latin America USD Remote eligibility.
 */
export function isLatamUsdEligible(
  location: string = '',
  description: string = '',
  currency: string = 'USD',
  workplace: WorkplaceType = WorkplaceType.REMOTE,
): boolean {
  if (workplace === WorkplaceType.ONSITE || workplace === WorkplaceType.HYBRID) {
    return false;
  }

  if (currency && currency !== 'USD') {
    return false;
  }

  const loc = location.toLowerCase();
  const desc = description.toLowerCase();

  // Strict Exclusions (US, UK, Canada, EMEA specific remote)
  const isExcluded =
    /\b(usa|united states|u\.s\.|us only|usa only|us remote|remote - us|remote - usa|remote, us|remote, usa|san francisco|new york|seattle|austin|chicago|california|texas|washington)\b/i.test(loc) ||
    /\b(canada|toronto|vancouver|montreal|canada only)\b/i.test(loc) ||
    /\b(london|united kingdom|uk remote|remote - uk|remote, uk|uk only|germany|berlin|france|paris|netherlands|amsterdam|emea only)\b/i.test(loc) ||
    /must be located in the (us|united states|uk|canada)/i.test(desc) ||
    /us citizenship required/i.test(desc) ||
    /authorized to work in the us without sponsorship/i.test(desc) ||
    /right to work in the uk/i.test(desc);

  if (isExcluded) {
    return false;
  }

  // Positive Eligibility (LATAM, Americas, Worldwide, Global, or Latin American countries)
  const isIncluded =
    /\b(latam|latin america|south america|brazil|brasil|argentina|colombia|mexico|chile|uruguay|peru|costa rica|americas|worldwide|global|anywhere)\b/i.test(loc) ||
    /\b(latam|latin america|south america|brazil|argentina|colombia|mexico|worldwide remote|global remote|hire anywhere)\b/i.test(desc);

  return isIncluded;
}

// Regex to strip standard legal entity and corporate suffixes
export const LEGAL_SUFFIXES_REGEX = /\b(inc|llc|ltd|limited|corp|corporation|co|gmbh|bv|ab|sa|labs?|technologies|technology|software|group|holdings?)\b\.?/gi;

export function cleanCompanyName(rawName: string): string {
  if (!rawName) return '';
  let cleaned = rawName.replace(LEGAL_SUFFIXES_REGEX, '').trim();
  cleaned = cleaned.replace(/^[,\s\-_.]+|[,\s\-_.]+$/g, '').trim();
  return cleaned || rawName;
}

export function unescapeHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#96;/g, '`')
    .replace(/&euro;/g, '€')
    .replace(/&pound;/g, '£')
    .replace(/&nbsp;/g, ' ');
}
