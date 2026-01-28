import { IsNotEmpty, IsString, IsOptional, Length } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom de la catégorie est obligatoire' })
  @Length(3, 50)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}