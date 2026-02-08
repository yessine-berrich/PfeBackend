import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article, ArticleStatus } from './entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { User } from 'src/users/entities/user.entity';
import { MediaService } from 'src/media/media.service'; // Importe MediaService
import { UpdateArticleDto } from './dto/update-article.dto';
import { SemanticService } from 'src/semantic/semantic.service';
import { ArticleView } from './entities/article-view.entity';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(ArticleView)
    private readonly viewRepository: Repository<ArticleView>,
    private readonly mediaService: MediaService, // Injecte MediaService
    private semanticService: SemanticService,
  ) {}

  async create(createArticleDto: CreateArticleDto, user: User) {
    const {
      tagIds,
      categoryId,
      media: mediaDtos,
      ...articleData
    } = createArticleDto;

    // 1. Préparation de l'entité
    const article = this.articleRepository.create({
      ...articleData,
      author: user,
      category: { id: categoryId },
      tags: tagIds?.map((id) => ({ id })) || [],
      media: [],
      status: createArticleDto.status || ArticleStatus.DRAFT,
    });

    // 2. Premier enregistrement (pour obtenir l'ID)
    const savedArticle = await this.articleRepository.save(article);

    // 3. Gestion des médias (ton code existant)
    if (mediaDtos && mediaDtos.length > 0) {
      const mediaEntities = mediaDtos.map((dto) =>
        this.mediaService.create({
          ...dto,
          articleId: savedArticle.id,
          type: this.mediaService.getMediaTypeFromMimeType(dto.mimetype),
        }),
      );
      savedArticle.media = await Promise.all(mediaEntities);
    }

    // --- NOUVEAU : GENERATION DU VECTEUR SEMANTIQUE ---

    // On récupère l'article complet avec les noms de catégories/tags pour un meilleur vecteur
    const fullArticle = await this.articleRepository.findOne({
      where: { id: savedArticle.id },
      relations: ['category', 'tags'],
    });

    if (fullArticle) {
      // On combine Titre + Contenu + Nom de catégorie pour Ollama
      const textToEmbed = `
      Titre: ${fullArticle.title}. 
      Contenu: ${fullArticle.content}. 
      Catégorie: ${fullArticle.category?.name || ''}
    `.trim();

      try {
        // Appel à Ollama via ton service
        fullArticle.embedding =
          await this.semanticService.getVector(textToEmbed);

        // Sauvegarde finale avec le vecteur
        await this.articleRepository.save(fullArticle);
        return fullArticle;
      } catch (error) {
        console.error(
          'Échec de la génération du vecteur lors de la création:',
          error,
        );
        // On retourne quand même l'article, il sera juste indexé plus tard par la synchro manuelle
        return fullArticle;
      }
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

  async incrementView(articleId: number, userId?: number, ip?: string) {
    // 1. On cherche si une vue existe déjà
    const alreadyViewed = await this.viewRepository.findOne({
      where: {
        article: { id: articleId },
        ...(userId ? { user: { id: userId } } : { ipAddress: ip }),
      },
    });

    if (!alreadyViewed) {
      // 2. On prépare l'objet de création proprement
      const viewData: any = {
        article: { id: articleId },
        ipAddress: ip,
      };

      // N'ajoute la propriété user que si l'id existe (évite le null)
      if (userId) {
        viewData.user = { id: userId };
      }

      const view = this.viewRepository.create(viewData);
      await this.viewRepository.save(view);

      // 3. Incrémenter le compteur global sur l'article pour l'affichage rapide
      await this.articleRepository.increment(
        { id: articleId },
        'viewsCount',
        1,
      );
    }
  }
}
