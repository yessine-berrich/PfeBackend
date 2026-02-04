import { IsString, IsNotEmpty, IsInt, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsInt()
  @IsNotEmpty()
  articleId: number;

  @IsInt()
  @IsOptional()
  parentId?: number; // Optionnel : utilisé seulement si c'est une réponse
}