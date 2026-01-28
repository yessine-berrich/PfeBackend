import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Article } from './entities/article.entity';
import { ArticleVersion } from './entities/article-version.entity';
import { ArticleStatus } from 'utils/constants';
import { User } from 'src/users/entities/user.entity';
import { Category } from 'src/category/entities/category.entity';
import { Tag } from 'src/tag/entities/tag.entity';
import { CreateArticleDto } from './dto/create-article.dto';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,

    @InjectRepository(ArticleVersion)
    private readonly versionRepository: Repository<ArticleVersion>,

    // On injecte ces repositories pour gérer les relations du DTO
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  /**
   * Créer un article avec Category et Tags
   */
  async create(dto: CreateArticleDto, user: User): Promise<Article> {
    const { categoryId, tagIds, ...articleData } = dto;

    const category = await this.categoryRepository.findOneBy({
      id: categoryId,
    });
    if (!category)
      throw new NotFoundException(`Catégorie ${categoryId} introuvable`);

    let tags: Tag[] = [];
    if (tagIds && tagIds.length > 0) {
      tags = await this.tagRepository.findBy({ id: In(tagIds) });
    }

    const article = this.articleRepository.create({
      ...articleData,
      author: user,
      category: category,
      tags: tags,
      status: dto.status || ArticleStatus.DRAFT,
    });

    return await this.articleRepository.save(article);
  }

  /**
   * Récupère tous les articles avec leurs relations
   */
  async findAll(): Promise<Article[]> {
    return await this.articleRepository.find({
      relations: ['author', 'category', 'tags'],
    });
  }

  /**
   * Trouve un article par ID ou lève une exception
   */
  async findOne(id: number): Promise<Article> {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['author', 'category', 'tags', 'versions'],
    });

    if (!article) {
      throw new NotFoundException(`Article avec l'ID #${id} non trouvé`);
    }
    return article;
  }

  /**
   * Met à jour l'article et crée une version de sauvegarde (UML: update())
   */
  async update(id: number, updateDto: any): Promise<Article> {
    const article = await this.findOne(id);

    const version = this.versionRepository.create({
      content: article.content,
      versionNumber: (article.versions?.length || 0) + 1,
      article: article,
    });
    await this.versionRepository.save(version);

    Object.assign(article, updateDto);
    return await this.articleRepository.save(article);
  }

  /**
   * Change le statut en PUBLISHED (UML: publish())
   */
  async publish(id: number): Promise<Article> {
    const article = await this.findOne(id);
    article.status = ArticleStatus.PUBLISHED;
    return await this.articleRepository.save(article);
  }

  /**
   * Change le statut en ARCHIVE (UML: archive())
   */
  async archive(id: number): Promise<Article> {
    const article = await this.findOne(id);
    article.status = ArticleStatus.ARCHIVED;
    return await this.articleRepository.save(article);
  }

  /**
   * Restaure le contenu depuis une version spécifique (UML: restore())
   */
  async restoreVersion(articleId: number, versionId: number): Promise<Article> {
    const version = await this.versionRepository.findOne({
      where: { id: versionId, article: { id: articleId } },
    });

    if (!version) throw new NotFoundException('Version introuvable');

    const article = await this.findOne(articleId);
    article.content = version.content;
    return await this.articleRepository.save(article);
  }

  /**
   * Supprime un article
   */
  async remove(id: number): Promise<void> {
    const article = await this.findOne(id);
    await this.articleRepository.remove(article);
  }
}
