import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class CreateTagDto {
  @IsString()
  @IsNotEmpty({ message: 'Le nom du tag est obligatoire' })
  @Length(2, 20)
  // Optionnel : s'assurer que le tag ne contient pas d'espaces (ex: "nest-js")
  @Matches(/^[a-zA-Z0-9-]+$/, { message: 'Le tag ne doit contenir que des lettres, chiffres ou tirets' })
  name: string;
}