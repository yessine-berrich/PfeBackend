import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article, ArticleStatus } from './entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { User } from 'src/users/entities/user.entity';
import { Category } from 'src/category/entities/category.entity';
import { Tag } from 'src/tag/entities/tag.entity';
import { MediaService } from 'src/media/media.service'; // Importe MediaService
import { UpdateArticleDto } from './dto/update-article.dto';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    // @InjectRepository(Category) // Si tu veux manipuler Category directement ici
    // private readonly categoryRepository: Repository<Category>,
    // @InjectRepository(Tag) // Si tu veux manipuler Tag directement ici
    // private readonly tagRepository: Repository<Tag>,
    private readonly mediaService: MediaService, // Injecte MediaService
  ) {}

  async create(createArticleDto: CreateArticleDto, user: User) {
    const {
      tagIds,
      categoryId,
      media: mediaDtos,
      ...articleData
    } = createArticleDto;

    // Création de l'article de base
    const article = this.articleRepository.create({
      ...articleData,
      author: user,
      category: { id: categoryId },
      tags: tagIds?.map((id) => ({ id })) || [],
      // Les médias seront attachés après la sauvegarde de l'article ou via la cascade
      media: [], // Initialise le tableau, sera rempli ci-dessous
      status: createArticleDto.status || ArticleStatus.DRAFT, // Default si non fourni
    });

    const savedArticle = await this.articleRepository.save(article);

    // Si des médias sont fournis (ils ont déjà été uploadés et leurs URLs sont disponibles)
    if (mediaDtos && mediaDtos.length > 0) {
  const mediaEntities = mediaDtos.map(dto => this.mediaService.create({ 
    ...dto, 
    articleId: savedArticle.id, // On utilise l'ID ici pour correspondre au DTO
    type: this.mediaService.getMediaTypeFromMimeType(dto.mimetype)
  }));
      savedArticle.media = await Promise.all(mediaEntities); // Attend que tous les médias soient enregistrés
      await this.articleRepository.save(savedArticle); // Sauvegarde l'article avec les médias attachés
    }

    return savedArticle;
  }

  async findAll() {
    return await this.articleRepository.find({
      relations: ['author', 'category', 'tags', 'media'],
    });
  }

  async update(id: number, updateArticleDto: UpdateArticleDto) {
    const article = await this.articleRepository.preload({
      id: +id,
      ...updateArticleDto,
    });
    if (!article) throw new NotFoundException(`Article #${id} not found`);
    return this.articleRepository.save(article);
  }

  async remove(id: number) {
    const article = await this.findOne(id);
    return this.articleRepository.remove(article);
  }
  async findOne(id: number) {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: [
        'author',
        'category',
        'tags',
        'media',
        'comments',
        'comments.author',
      ],
    });
    if (!article) {
      throw new NotFoundException(`Article #${id} not found`);
    }
    return article;
  }
}
