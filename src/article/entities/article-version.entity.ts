import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Article } from './article.entity';

@Entity('article_versions')
export class ArticleVersion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  versionNumber: number;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => Article, (article) => article.versions, {
    onDelete: 'CASCADE',
  })
  article: Article;

  @CreateDateColumn()
  createdAt: Date;
}
