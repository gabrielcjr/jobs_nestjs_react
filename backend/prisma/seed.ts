import { PrismaClient, AtsProvider, WorkplaceType, ExperienceLevel, RoleCategory } from '@prisma/client';
import slugify from 'slugify';

const prisma = new PrismaClient();

const SEED_COMPANIES = [
  {
    name: 'Stripe',
    slug: 'stripe',
    atsProvider: AtsProvider.GREENHOUSE,
    websiteUrl: 'https://stripe.com',
    logoUrl: 'https://images.ctfassets.net/f60q1anpxzid/screenshot/stripe-logo.png',
  },
  {
    name: 'OpenAI',
    slug: 'openai',
    atsProvider: AtsProvider.ASHBY,
    websiteUrl: 'https://openai.com',
    logoUrl: 'https://openai.com/favicon.ico',
  },
  {
    name: 'Datadog',
    slug: 'datadog',
    atsProvider: AtsProvider.LEVER,
    websiteUrl: 'https://datadoghq.com',
    logoUrl: 'https://img.datadoghq.com/img/datadog-logo.png',
  },
  {
    name: 'Figma',
    slug: 'figma',
    atsProvider: AtsProvider.GREENHOUSE,
    websiteUrl: 'https://figma.com',
    logoUrl: 'https://static.figma.com/app/icon/1/favicon.svg',
  },
  {
    name: 'Linear',
    slug: 'linear',
    atsProvider: AtsProvider.ASHBY,
    websiteUrl: 'https://linear.app',
    logoUrl: 'https://linear.app/favicon.ico',
  },
  {
    name: 'Pleo',
    slug: 'pleo',
    atsProvider: AtsProvider.WORKABLE,
    websiteUrl: 'https://pleo.io',
    logoUrl: 'https://pleo.io/favicon.ico',
  },
  {
    name: 'Square / Block',
    slug: 'square',
    atsProvider: AtsProvider.SMARTRECRUITERS,
    websiteUrl: 'https://squareup.com',
    logoUrl: 'https://squareup.com/favicon.ico',
  },
  {
    name: 'Vercel',
    slug: 'vercel',
    atsProvider: AtsProvider.GREENHOUSE,
    websiteUrl: 'https://vercel.com',
    logoUrl: 'https://assets.vercel.com/image/upload/front/favicon/vercel/favicon.ico',
  },
];

const SEED_JOBS = [
  {
    companySlug: 'stripe',
    externalJobId: 'str-gh-001',
    title: 'Senior Software Engineer, Payment Infrastructure',
    department: 'Core Payments Engineering',
    location: 'San Francisco, CA / Seattle, WA',
    workplaceType: WorkplaceType.HYBRID,
    roleCategory: RoleCategory.BACKEND,
    experienceLevel: ExperienceLevel.SENIOR,
    tags: ['Go', 'Java', 'Ruby', 'PostgreSQL', 'Redis', 'Kafka', 'AWS', 'Kubernetes', 'CI/CD'],
    minSalary: 195000,
    maxSalary: 265000,
    currency: 'USD',
    salarySummary: '$195,000 - $265,000 USD + Equity',
    applyUrl: 'https://boards.greenhouse.io/stripe/jobs/str-gh-001',
    hoursAgo: 4,
    description: `
<h3>About the Role</h3>
<p>Stripe is looking for a <strong>Senior Software Engineer</strong> to join our Payment Infrastructure team. You will design, build, and scale distributed backend systems processing hundreds of billions of dollars annually for millions of businesses worldwide.</p>

<h3>What You Will Do:</h3>
<ul>
  <li>Architect high-throughput, low-latency transaction processing pipelines in <strong>Go</strong> and <strong>Java</strong>.</li>
  <li>Ensure 99.999% availability and strict data consistency using <strong>PostgreSQL</strong>, <strong>Redis</strong>, and <strong>Kafka</strong>.</li>
  <li>Deploy and operate mission-critical workloads on <strong>Kubernetes</strong> and <strong>AWS</strong>.</li>
  <li>Collaborate with risk, compliance, and product teams to deliver zero-downtime ledger services.</li>
</ul>

<h3>Requirements:</h3>
<ul>
  <li>5+ years of software engineering experience building distributed backend systems.</li>
  <li>Deep expertise in concurrent programming (Go, Java, or C++).</li>
  <li>Strong understanding of relational database internals, transactional semantics, and ACID guarantees.</li>
  <li>Experience with event-driven architectures and streaming data pipelines.</li>
</ul>
    `,
  },
  {
    companySlug: 'openai',
    externalJobId: 'oai-ashby-001',
    title: 'Staff Full-Stack Engineer, ChatGPT Interface & Systems',
    department: 'Applied AI Product Engineering',
    location: 'San Francisco, CA',
    workplaceType: WorkplaceType.ONSITE,
    roleCategory: RoleCategory.FULLSTACK,
    experienceLevel: ExperienceLevel.STAFF_PLUS,
    tags: ['TypeScript', 'React', 'Next.js', 'Python', 'FastAPI', 'LLM', 'PyTorch', 'Tailwind CSS', 'PostgreSQL'],
    minSalary: 280000,
    maxSalary: 420000,
    currency: 'USD',
    salarySummary: '$280,000 - $420,000 USD + Generous PPU Grant',
    applyUrl: 'https://jobs.ashbyhq.com/openai/oai-ashby-001',
    hoursAgo: 12,
    description: `
<h3>About OpenAI</h3>
<p>OpenAI’s mission is to ensure that artificial general intelligence benefits all of humanity. As a <strong>Staff Full-Stack Engineer</strong> on the ChatGPT team, you will shape how millions of people interact with multimodal AI every single day.</p>

<h3>Responsibilities:</h3>
<ul>
  <li>Lead frontend and full-stack architecture for ChatGPT consumer and enterprise web clients.</li>
  <li>Build real-time streaming interfaces leveraging <strong>React</strong>, <strong>Next.js</strong>, <strong>TypeScript</strong>, and Server-Sent Events (SSE).</li>
  <li>Develop high-performance orchestration backends in <strong>Python</strong> and <strong>FastAPI</strong> connecting to frontier model inference clusters.</li>
  <li>Pioneer innovative UI paradigms for interactive reasoning, canvas workspaces, and code generation.</li>
</ul>

<h3>Qualifications:</h3>
<ul>
  <li>8+ years of production experience across frontend and backend technologies.</li>
  <li>Mastery of modern JavaScript/TypeScript, React internals, and state management.</li>
  <li>Deep familiarity with LLM APIs, prompt orchestration, and vector retrieval.</li>
  <li>Proven track record of shipping iconic user experiences at massive scale.</li>
</ul>
    `,
  },
  {
    companySlug: 'figma',
    externalJobId: 'fig-gh-002',
    title: 'Frontend Platform Engineer, WebGL & Canvas',
    department: 'Editor Platform',
    location: 'New York, NY / Remote',
    workplaceType: WorkplaceType.HYBRID,
    roleCategory: RoleCategory.FRONTEND,
    experienceLevel: ExperienceLevel.SENIOR,
    tags: ['TypeScript', 'React', 'Rust', 'C++', 'GraphQL', 'Tailwind CSS'],
    minSalary: 180000,
    maxSalary: 245000,
    currency: 'USD',
    salarySummary: '$180,000 - $245,000 USD',
    applyUrl: 'https://boards.greenhouse.io/figma/jobs/fig-gh-002',
    hoursAgo: 18,
    description: `
<h3>About the Team</h3>
<p>The Figma Editor Platform team powers the real-time multiplayer rendering engine that runs right inside the browser. We combine web standards with native-level performance.</p>

<h3>What You Will Do:</h3>
<ul>
  <li>Optimize rendering performance and framerates for complex vector scenes with 10,000+ nodes.</li>
  <li>Write performant <strong>TypeScript</strong>, <strong>Rust</strong> (compiled to WebAssembly), and <strong>C++</strong>.</li>
  <li>Design clean API boundaries between the canvas rendering kernel and our <strong>React</strong> UI component library.</li>
</ul>

<h3>Requirements:</h3>
<ul>
  <li>Strong proficiency in TypeScript, modern DOM APIs, and WebGL / Canvas2D rendering.</li>
  <li>Understanding of memory management, garbage collection overhead, and frame budgeting.</li>
  <li>Passion for creating silky-smooth, deterministic UI interactions.</li>
</ul>
    `,
  },
  {
    companySlug: 'datadog',
    externalJobId: 'dd-lev-003',
    title: 'Site Reliability Engineer / Cloud Infrastructure Lead',
    department: 'Core Infrastructure',
    location: 'Remote - US / Canada',
    workplaceType: WorkplaceType.REMOTE,
    roleCategory: RoleCategory.DEVOPS_SRE_INFRA,
    experienceLevel: ExperienceLevel.LEAD,
    tags: ['Kubernetes', 'Docker', 'Terraform', 'AWS', 'GCP', 'Go', 'Python', 'Linux', 'CI/CD'],
    minSalary: 210000,
    maxSalary: 275000,
    currency: 'USD',
    salarySummary: '$210,000 - $275,000 USD + Equity',
    applyUrl: 'https://jobs.lever.co/datadog/dd-lev-003',
    hoursAgo: 26,
    description: `
<h3>Role Overview</h3>
<p>At Datadog, we process over 40 trillion events daily across dozens of cloud regions. As a <strong>Cloud Infrastructure Lead</strong>, you will build and maintain multi-cloud Kubernetes clusters running at world-class scale.</p>

<h3>Key Responsibilities:</h3>
<ul>
  <li>Manage massive Kubernetes deployments across <strong>AWS</strong>, <strong>GCP</strong>, and <strong>Azure</strong> with <strong>Terraform</strong> and GitOps.</li>
  <li>Build automated traffic shedding, self-healing node pools, and automated chaos engineering drills.</li>
  <li>Author custom Kubernetes controllers and operators in <strong>Go</strong>.</li>
  <li>Mentor junior SREs and drive blameless post-mortem culture across engineering.</li>
</ul>

<h3>Requirements:</h3>
<ul>
  <li>7+ years experience in systems, SRE, or DevOps roles.</li>
  <li>Expert level mastery of Linux kernel networking (eBPF, iptables), container runtimes, and k8s internals.</li>
  <li>Strong programming skills in Go or Python.</li>
</ul>
    `,
  },
  {
    companySlug: 'linear',
    externalJobId: 'lin-ash-004',
    title: 'Senior Product Engineer, Full-Stack Realtime',
    department: 'Product Engineering',
    location: 'Remote - Worldwide',
    workplaceType: WorkplaceType.REMOTE,
    roleCategory: RoleCategory.FULLSTACK,
    experienceLevel: ExperienceLevel.SENIOR,
    tags: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'GraphQL', 'Redis', 'Docker'],
    minSalary: 175000,
    maxSalary: 230000,
    currency: 'USD',
    salarySummary: '$175,000 - $230,000 USD (Location agnostic)',
    applyUrl: 'https://jobs.ashbyhq.com/linear/lin-ash-004',
    hoursAgo: 32,
    description: `
<h3>About Linear</h3>
<p>Linear is the issue tracking tool built for high-performance software teams. We obsess over speed, aesthetics, keyboard shortcuts, and craftsmanship.</p>

<h3>The Work:</h3>
<ul>
  <li>Build client-first local-database synchronization engine with optimistic updates and conflict resolution.</li>
  <li>Develop interactive frontend features with <strong>React</strong>, <strong>TypeScript</strong>, and tailored CSS micro-interactions.</li>
  <li>Optimize relational queries and schema migrations in <strong>PostgreSQL</strong> via <strong>Node.js</strong> backends.</li>
</ul>

<h3>What We Look For:</h3>
<ul>
  <li>Exceptional taste in product UI and interaction design.</li>
  <li>Strong fundamentals in TypeScript, reactive architectures, and data structures.</li>
  <li>Experience building desktop-grade web applications.</li>
</ul>
    `,
  },
  {
    companySlug: 'vercel',
    externalJobId: 'ver-gh-005',
    title: 'AI Platform Systems Engineer',
    department: 'Vercel AI SDK & Edge Compute',
    location: 'San Francisco, CA / Remote',
    workplaceType: WorkplaceType.REMOTE,
    roleCategory: RoleCategory.DATA_AI_ML,
    experienceLevel: ExperienceLevel.SENIOR,
    tags: ['TypeScript', 'Node.js', 'Next.js', 'Python', 'LLM', 'Rust', 'Docker', 'AWS'],
    minSalary: 190000,
    maxSalary: 250000,
    currency: 'USD',
    salarySummary: '$190,000 - $250,000 USD',
    applyUrl: 'https://boards.greenhouse.io/vercel/jobs/ver-gh-005',
    hoursAgo: 40,
    description: `
<h3>About Vercel AI</h3>
<p>Vercel is making the web faster and AI applications easier to build. Join our AI Platform team to build the infrastructure powering the AI SDK and Next.js model routing.</p>

<h3>Key Duties:</h3>
<ul>
  <li>Develop streaming primitives, tool-calling pipelines, and structured output parser runtimes.</li>
  <li>Bridge <strong>Python</strong> AI frameworks with high-concurrency <strong>Rust</strong> and <strong>Node.js</strong> edge worker runtimes.</li>
  <li>Optimize TTFT (Time To First Token) for AI completions across edge datacenters.</li>
</ul>
    `,
  },
  {
    companySlug: 'pleo',
    externalJobId: 'ple-work-006',
    title: 'Backend Engineer, Fintech Core Banking',
    department: 'Financial Infrastructure',
    location: 'Copenhagen, Denmark / London, UK / Remote',
    workplaceType: WorkplaceType.HYBRID,
    roleCategory: RoleCategory.BACKEND,
    experienceLevel: ExperienceLevel.MID,
    tags: ['Kotlin', 'Java', 'PostgreSQL', 'Kafka', 'Docker', 'AWS', 'Spring Boot'],
    minSalary: 95000,
    maxSalary: 130000,
    currency: 'EUR',
    salarySummary: '€95,000 - €130,000 EUR',
    applyUrl: 'https://apply.workable.com/pleo/j/ple-work-006/',
    hoursAgo: 50,
    description: `
<h3>About Pleo</h3>
<p>Pleo offers smart company cards and automated expense management for modern businesses across Europe.</p>

<h3>What You Will Do:</h3>
<ul>
  <li>Build ledger services and banking integrations in <strong>Kotlin</strong> and <strong>Spring Boot</strong>.</li>
  <li>Implement idempotent payment settlement using <strong>PostgreSQL</strong> and <strong>Kafka</strong>.</li>
  <li>Work in a collaborative, cross-functional squad focused on financial correctness.</li>
</ul>
    `,
  },
  {
    companySlug: 'square',
    externalJobId: 'sq-sr-007',
    title: 'Mobile Security Engineer, iOS & Android',
    department: 'AppSec Engineering',
    location: 'San Francisco, CA / Remote',
    workplaceType: WorkplaceType.REMOTE,
    roleCategory: RoleCategory.SECURITY,
    experienceLevel: ExperienceLevel.SENIOR,
    tags: ['Swift', 'Kotlin', 'Mobile', 'Security', 'CI/CD', 'Java'],
    minSalary: 185000,
    maxSalary: 240000,
    currency: 'USD',
    salarySummary: '$185,000 - $240,000 USD',
    applyUrl: 'https://jobs.smartrecruiters.com/square/sq-sr-007',
    hoursAgo: 60,
    description: `
<h3>About the Team</h3>
<p>The Mobile Security team at Square ensures that all point-of-sale hardware and mobile applications meet strict cryptographic and tamper-resistance standards.</p>

<h3>Responsibilities:</h3>
<ul>
  <li>Conduct penetration testing and threat modeling for <strong>iOS (Swift)</strong> and <strong>Android (Kotlin)</strong> payment applications.</li>
  <li>Implement hardware-backed keystore integration, certificate pinning, and jailbreak detection.</li>
  <li>Build automated static and dynamic analysis tools into our CI/CD pipelines.</li>
</ul>
    `,
  },
  {
    companySlug: 'figma',
    externalJobId: 'fig-gh-008',
    title: 'Engineering Manager, Design Systems & Community',
    department: 'Product Engineering',
    location: 'San Francisco, CA / Hybrid',
    workplaceType: WorkplaceType.HYBRID,
    roleCategory: RoleCategory.ENGINEERING_MANAGEMENT,
    experienceLevel: ExperienceLevel.LEAD,
    tags: ['TypeScript', 'React', 'GraphQL', 'PostgreSQL'],
    minSalary: 230000,
    maxSalary: 310000,
    currency: 'USD',
    salarySummary: '$230,000 - $310,000 USD + Equity',
    applyUrl: 'https://boards.greenhouse.io/figma/jobs/fig-gh-008',
    hoursAgo: 72,
    description: `
<h3>About the Role</h3>
<p>Lead a team of 7-10 exceptional software engineers building Figma's design systems tokens, community publishing hub, and plugin ecosystem.</p>

<h3>Requirements:</h3>
<ul>
  <li>3+ years of engineering management experience leading product teams.</li>
  <li>Previous background as a Senior/Staff software engineer on complex web apps.</li>
  <li>Strong coaching, career development, and hiring track record.</li>
</ul>
    `,
  },
  {
    companySlug: 'stripe',
    externalJobId: 'str-gh-009',
    title: 'Software Engineering Intern, Summer 2026',
    department: 'University Programs',
    location: 'San Francisco, CA / Seattle, WA',
    workplaceType: WorkplaceType.ONSITE,
    roleCategory: RoleCategory.FULLSTACK,
    experienceLevel: ExperienceLevel.INTERN,
    tags: ['TypeScript', 'Python', 'Go', 'React', 'PostgreSQL'],
    minSalary: 65,
    maxSalary: 75,
    currency: 'USD',
    salarySummary: '$65 - $75 / hour + Housing Stipend',
    applyUrl: 'https://boards.greenhouse.io/stripe/jobs/str-gh-009',
    hoursAgo: 80,
    description: `
<h3>Internship Program</h3>
<p>Join Stripe as a Software Engineering Intern for a 12-week immersive internship. You will work on production code alongside senior mentors and ship features directly to users.</p>
    `,
  },
  {
    companySlug: 'datadog',
    externalJobId: 'dd-lev-010',
    title: 'Junior Backend Engineer, Metrics Pipeline',
    department: 'Time Series Database',
    location: 'Boston, MA / New York, NY',
    workplaceType: WorkplaceType.HYBRID,
    roleCategory: RoleCategory.BACKEND,
    experienceLevel: ExperienceLevel.JUNIOR,
    tags: ['Go', 'C++', 'Linux', 'Docker', 'PostgreSQL'],
    minSalary: 110000,
    maxSalary: 140000,
    currency: 'USD',
    salarySummary: '$110,000 - $140,000 USD',
    applyUrl: 'https://jobs.lever.co/datadog/dd-lev-010',
    hoursAgo: 96,
    description: `
<h3>Role Overview</h3>
<p>An entry-level engineering opportunity to contribute to Datadog's high-scale metrics ingest clusters written in Go and C++.</p>
    `,
  },
];

async function main() {
  console.log('🌱 Seeding companies and jobs into PostgreSQL...');

  // Upsert Companies
  const companyMap = new Map<string, string>();
  for (const c of SEED_COMPANIES) {
    const comp = await prisma.company.upsert({
      where: { slug: c.slug },
      update: {
        name: c.name,
        atsProvider: c.atsProvider,
        websiteUrl: c.websiteUrl,
        logoUrl: c.logoUrl,
      },
      create: {
        name: c.name,
        slug: c.slug,
        atsProvider: c.atsProvider,
        websiteUrl: c.websiteUrl,
        logoUrl: c.logoUrl,
      },
    });
    companyMap.set(c.slug, comp.id);
  }

  const now = new Date();

  // Upsert Jobs
  for (const j of SEED_JOBS) {
    const companyId = companyMap.get(j.companySlug);
    if (!companyId) continue;

    const postedAt = new Date(now.getTime() - j.hoursAgo * 60 * 60 * 1000);
    const jobSlug = slugify(`${j.companySlug}-${j.title}-${j.externalJobId}`, { lower: true, strict: true });

    await prisma.job.upsert({
      where: {
        atsProvider_externalJobId: {
          atsProvider: SEED_COMPANIES.find((c) => c.slug === j.companySlug)!.atsProvider,
          externalJobId: j.externalJobId,
        },
      },
      update: {
        title: j.title,
        slug: jobSlug,
        companyId,
        department: j.department,
        location: j.location,
        workplaceType: j.workplaceType,
        description: j.description.trim(),
        applyUrl: j.applyUrl,
        tags: j.tags,
        roleCategory: j.roleCategory,
        experienceLevel: j.experienceLevel,
        minSalary: j.minSalary,
        maxSalary: j.maxSalary,
        currency: j.currency,
        salarySummary: j.salarySummary,
        postedAt,
        firstSeenAt: postedAt,
        lastSeenAt: now,
        isActive: true,
      },
      create: {
        externalJobId: j.externalJobId,
        atsProvider: SEED_COMPANIES.find((c) => c.slug === j.companySlug)!.atsProvider,
        title: j.title,
        slug: jobSlug,
        companyId,
        department: j.department,
        location: j.location,
        workplaceType: j.workplaceType,
        description: j.description.trim(),
        applyUrl: j.applyUrl,
        tags: j.tags,
        roleCategory: j.roleCategory,
        experienceLevel: j.experienceLevel,
        minSalary: j.minSalary,
        maxSalary: j.maxSalary,
        currency: j.currency,
        salarySummary: j.salarySummary,
        postedAt,
        firstSeenAt: postedAt,
        lastSeenAt: now,
        isActive: true,
      },
    });
  }

  console.log(`✅ Seed finished! Added ${SEED_COMPANIES.length} companies and ${SEED_JOBS.length} jobs.`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
