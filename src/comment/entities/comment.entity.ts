import { Article } from "src/article/entities/article.entity";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('comments')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  // AJOUTE/VÉRIFIE CECI :
  @ManyToOne(() => Article, (article) => article.comments)
  article: Article;
}