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
