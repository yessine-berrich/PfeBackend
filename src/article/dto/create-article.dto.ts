import { IsString, IsNotEmpty, IsInt, IsArray, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ArticleStatus } from '../entities/article.entity';
import { CreateMediaDto } from '../../media/dto/create-media.dto'; // Importe le DTO du Media

export class CreateArticleDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string; // Le Markdown avec les URLs des images

  @IsInt()
  @IsNotEmpty()
  categoryId: number;

  @IsArray()
  @IsOptional()
  @IsInt({ each: true })
  tagIds?: number[]; // IDs des tags existants

  @IsEnum(ArticleStatus)
  @IsOptional()
  status?: ArticleStatus;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateMediaDto) // Important pour la validation des objets imbriqués
  media?: CreateMediaDto[]; 
}