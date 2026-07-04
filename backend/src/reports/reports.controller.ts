import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReportsService } from './reports.service';
import { UploadIntentDto } from './dto/upload-intent.dto';
import { ReportsFiltersDto } from './dto/reports-filters.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('upload-intent')
  @HttpCode(HttpStatus.OK)
  async createUploadIntent(
    @Body() dto: UploadIntentDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.reportsService.createUploadIntent(dto, req.user.userId);
  }

  @Patch(':id/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmUpload(@Param('id') id: string) {
    return this.reportsService.confirmUpload(id);
  }

  @Get(':id/download-link')
  async getDownloadLink(@Param('id') id: string) {
    return this.reportsService.getDownloadLink(id);
  }

  @Get()
  async findAll(@Query() filters: ReportsFiltersDto) {
    return this.reportsService.findAll(filters);
  }
}
