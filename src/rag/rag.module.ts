import { Module } from '@nestjs/common';
import { RagService } from './rag.service';
import { RagController } from './rag.controller';
import { ArticleModule } from 'src/article/article.module';
import { OllamaService } from './ollama.sevice';

@Module({
  imports: [ArticleModule],
  controllers: [RagController],
  providers: [RagService, OllamaService],
  exports: [RagService],
})
export class RagModule {}
