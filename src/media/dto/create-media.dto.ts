import { IsString, IsNotEmpty, IsUrl, IsEnum, IsOptional, IsInt } from 'class-validator';
import { MediaType } from '../entities/media.entity';

export class CreateMediaDto {
  @IsUrl()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsNotEmpty()
  mimetype: string;

  @IsEnum(MediaType)
  @IsOptional()
  type?: MediaType;

  @IsInt()
  @IsOptional()
  articleId?: number; // Optionnel si on lie le média après la création de l'article
}