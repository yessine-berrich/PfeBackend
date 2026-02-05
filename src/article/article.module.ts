import { Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { Article } from './entities/article.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticleVersion } from './entities/article-version.entity';
import { Category } from 'src/category/entities/category.entity';
import { Tag } from 'src/tag/entities/tag.entity';
import { UsersModule } from 'src/users/users.module';
import { MediaModule } from 'src/media/media.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Article, ArticleVersion, Category, Tag]),
    UsersModule,
    MediaModule
  ],
  controllers: [ArticleController],
  providers: [ArticleService],
  exports: [ArticleService],
})
export class ArticleModule {}
