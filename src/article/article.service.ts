import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from './entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    private readonly usersService: UsersService,
  ) {}

  async create(createArticleDto: CreateArticleDto, userId: number): Promise<Article> {
    // Utilisation stricte de ta méthode
    const author = await this.usersService.getCurrentUser(userId);
    
    if (!author) {
      throw new NotFoundException(`Auteur avec l'ID ${userId} introuvable`);
    }

    const { tagIds, categoryId, ...articleData } = createArticleDto;

    const article = this.articleRepository.create({
      ...articleData,
      author, // Injection de l'entité User complète récupérée
      category: { id: categoryId },
      tags: tagIds?.map((id) => ({ id })),
    });

    return await this.articleRepository.save(article);
  }

  async findAll(): Promise<Article[]> {
    return await this.articleRepository.find({
      relations: ['author', 'category', 'tags'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Article> {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['author', 'category', 'tags', 'comments'],
    });
    if (!article) throw new NotFoundException(`Article #${id} introuvable`);
    return article;
  }

  async update(id: number, updateArticleDto: UpdateArticleDto): Promise<Article> {
    const { tagIds, categoryId, ...articleData } = updateArticleDto;
    const article = await this.findOne(id);

    const updatedArticle = this.articleRepository.merge(article, articleData);

    if (categoryId) updatedArticle.category = { id: categoryId } as any;
    if (tagIds) updatedArticle.tags = tagIds.map((id) => ({ id })) as any;

    return await this.articleRepository.save(updatedArticle);
  }

  async remove(id: number): Promise<void> {
    const article = await this.findOne(id);
    await this.articleRepository.remove(article);
  }
}