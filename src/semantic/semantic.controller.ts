import { Controller, Get, Post, Query } from '@nestjs/common';
import { SemanticService } from './semantic.service';

@Controller('semantic')
export class SemanticController {
  constructor(private readonly semanticService: SemanticService) {}

  @Get()
  async search(@Query('query') query: string) {
    if (!query) return [];
    return this.semanticService.searchArticles(query);
  }
}
