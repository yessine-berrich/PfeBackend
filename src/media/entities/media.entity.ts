import { Article } from 'src/article/entities/article.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

export enum MediaType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  OTHER = 'other',
}

@Entity('media')
export class Media {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string; // URL de stockage (S3, Cloudinary, local)

  @Column()
  filename: string; // Nom original du fichier

  @Column()
  mimetype: string; // ex: image/jpeg, application/pdf

  @Column({
    type: 'enum',
    enum: MediaType,
    default: MediaType.OTHER,
  })
  type: MediaType;

  @ManyToOne(() => Article, (article) => article.media, { onDelete: 'CASCADE' })
  article: Article;
}