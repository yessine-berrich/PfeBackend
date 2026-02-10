import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { RagService } from './rag.service';
import { RagQueryDto } from './dto/rag-query.dto';
import { RagResponse } from './interfaces/rag-response.interface';

@Controller('rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async ragSearch(@Body() queryDto: RagQueryDto): Promise<RagResponse> {
    return this.ragService.ragSearch(queryDto);
  }
}