import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ArticleStatus } from 'utils/constants';
import { ArticleVersion } from './article-version.entity';
import { User } from 'src/users/entities/user.entity';
import { Category } from 'src/category/entities/category.entity';
import { Tag } from 'src/tag/entities/tag.entity';
import { Comment } from 'src/comment/entities/comment.entity';

@Entity('articles')
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: ArticleStatus,
    default: ArticleStatus.DRAFT,
  })
  status: ArticleStatus;

  // User (author)
  @ManyToOne(() => User, (user) => user.articles, { eager: true })
  author: User;

  // Comments
  @OneToMany(() => Comment, (comment) => comment.article)
  comments: Comment[];

  // Category
  @ManyToOne(() => Category, (category) => category.articles, { eager: true })
  category: Category;

  // Versions
  @OneToMany(() => ArticleVersion, (version) => version.article)
  versions: ArticleVersion[];

  // Tags
  @ManyToMany(() => Tag, (tag) => tag.articles, { cascade: true })
  @JoinTable()
  tags: Tag[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
