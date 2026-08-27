import { AshbyAdapter } from './ashby.adapter';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AshbyAdapter', () => {
  let adapter: AshbyAdapter;

  beforeEach(() => {
    adapter = new AshbyAdapter();
    jest.clearAllMocks();
  });

  it('should fetch and normalize jobs with compensation parsing from tiers and summary', async () => {
    mockedAxios.get.mockResolvedValue({
      status: 200,
      data: {
        jobs: [
          {
            id: 'ashby-1',
            title: 'Senior Backend Engineer',
            location: 'San Francisco, CA',
            workplaceType: 'Remote',
            descriptionPlain: 'Looking for a Senior Backend Engineer proficient in TypeScript, Node.js, and PostgreSQL.',
            publishedAt: '2026-08-01T00:00:00.000Z',
            compensation: {
              compensationTiers: [
                {
                  title: 'Tier 1',
                  minCompensation: 150000,
                  maxCompensation: 210000,
                  currency: 'USD',
                },
              ],
              summary: '$150,000 - $210,000 USD',
            },
          },
          {
            id: 'ashby-2',
            title: 'Full Stack Engineer',
            location: 'Remote',
            descriptionPlain: 'React and Python engineer',
            publishedAt: '2026-08-10T00:00:00.000Z',
            compensation: {
              tierSummary: '$130k - $170k USD',
            },
          },
        ],
      },
    });

    const jobs = await adapter.fetchJobs('linear');

    expect(jobs).toHaveLength(2);

    expect(jobs[0].externalJobId).toBe('ashby-1');
    expect(jobs[0].title).toBe('Senior Backend Engineer');
    expect(jobs[0].minSalary).toBe(150000);
    expect(jobs[0].maxSalary).toBe(210000);
    expect(jobs[0].currency).toBe('USD');
    expect(jobs[0].tags).toContain('TypeScript');
    expect(jobs[0].tags).toContain('PostgreSQL');

    expect(jobs[1].externalJobId).toBe('ashby-2');
    expect(jobs[1].minSalary).toBe(130000);
    expect(jobs[1].maxSalary).toBe(170000);
    expect(jobs[1].tags).toContain('React');
    expect(jobs[1].tags).toContain('Python');
  });

  it('should handle network errors gracefully and return empty array', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network error'));

    const jobs = await adapter.fetchJobs('unknown-company');
    expect(jobs).toEqual([]);
  });
});
