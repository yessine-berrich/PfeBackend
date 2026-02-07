import { Module } from '@nestjs/common';
import { SemanticService } from './semantic.service';
import { SemanticController } from './semantic.controller';
import { Article } from 'src/article/entities/article.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Article])], // Permet d'utiliser le Repository Article
  controllers: [SemanticController],
  providers: [SemanticService],
  exports: [SemanticService], // Indispensable pour l'injecter ailleurs
})
export class SemanticModule {}
