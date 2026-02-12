import { ArticleStatus } from "utils/constants";

// src/article/dto/update-article.dto.ts
export class UpdateArticleDto {
  title?: string;
  content?: string;
  status?: ArticleStatus;
  categoryId?: number;
  tagIds?: number[];
  
  // Ajout recommandé pour le versioning
  changeSummary?: string;     // ← message de commit / changelog
}