import { Controller, Get, Param, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { GetJobsQueryDto } from './dto/get-jobs-query.dto';

@Controller('api/v1/jobs')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get()
  async getJobs(@Query() query: GetJobsQueryDto) {
    return this.jobsService.findAll(query);
  }

  @Get('tags')
  async getTags(@Query('limit') limit?: number) {
    const topTags = await this.jobsService.getTopTags(limit ? Number(limit) : 30);
    return {
      success: true,
      data: topTags,
    };
  }

  @Get(':idOrSlug')
  async getJob(@Param('idOrSlug') idOrSlug: string) {
    const job = await this.jobsService.findOne(idOrSlug);
    return {
      success: true,
      data: job,
    };
  }
}
