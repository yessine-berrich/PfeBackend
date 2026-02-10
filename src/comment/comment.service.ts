import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createCommentDto: {
    articleId: number;
    content: string;
    parentId?: number;
    mentionedUserIds?: number[];
  }, userId: number): Promise<Comment> {
    // Récupérer l'utilisateur
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Créer le commentaire avec les IDs
    const comment = this.commentRepository.create({
      content: createCommentDto.content,
      article: { id: createCommentDto.articleId } as any, // Référence à l'article par ID
      author: user,
    });

    // Gérer la réponse à un commentaire parent
    if (createCommentDto.parentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: createCommentDto.parentId },
        relations: ['article'],
      });
      
      if (!parentComment) {
        throw new NotFoundException('Commentaire parent non trouvé');
      }
      
      // Vérifier que le parent appartient au même article
      if (parentComment.article.id !== createCommentDto.articleId) {
        throw new ForbiddenException('Le commentaire parent ne correspond pas au même article');
      }
      
      comment.parent = parentComment;
    }

    // Gérer les mentions
    if (createCommentDto.mentionedUserIds && createCommentDto.mentionedUserIds.length > 0) {
      const mentionedUsers = await this.userRepository.findByIds(createCommentDto.mentionedUserIds);
      comment.mentionedUsers = mentionedUsers;
    }

    const savedComment = await this.commentRepository.save(comment);
    
    // Retourner avec les relations nécessaires
    return await this.commentRepository.findOneOrFail({
      where: { id: savedComment.id },
      relations: ['author', 'article', 'parent', 'mentionedUsers', 'replies', 'likes'],
    });
  }

  async findByArticle(articleId: number): Promise<Comment[]> {
    // Récupérer tous les commentaires de l'article avec leurs relations
    const comments = await this.commentRepository.find({
      where: { 
        article: { id: articleId } as any,
        parent: null as any, // Correction pour TypeORM v0.3+
      },
      relations: [
        'author', 
        'article',
        'mentionedUsers', 
        'likes',
        'replies',
        'replies.author',
        'replies.mentionedUsers',
        'replies.likes',
      ],
      order: {
        createdAt: 'DESC',
        replies: {
          createdAt: 'ASC',
        },
      },
    });

    return comments;
  }

  async toggleLike(commentId: number, userId: number): Promise<Comment> {
    // Récupérer l'utilisateur
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['likes'],
    });

    if (!comment) {
      throw new NotFoundException('Commentaire non trouvé');
    }

    const alreadyLiked = comment.likes.some(like => like.id === user.id);
    
    if (alreadyLiked) {
      // Retirer le like
      comment.likes = comment.likes.filter(like => like.id !== user.id);
    } else {
      // Ajouter le like
      comment.likes = [...comment.likes, user];
    }

    const savedComment = await this.commentRepository.save(comment);
    
    return await this.commentRepository.findOneOrFail({
      where: { id: savedComment.id },
      relations: ['author', 'likes'],
    });
  }

  async update(commentId: number, content: string, userId: number): Promise<Comment> {
    // Récupérer l'utilisateur
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['author'],
    });

    if (!comment) {
      throw new NotFoundException('Commentaire non trouvé');
    }

    if (comment.author.id !== user.id) {
      throw new ForbiddenException('Vous ne pouvez pas modifier ce commentaire');
    }

    comment.content = content;
    comment.isEdited = true;
    comment.updatedAt = new Date();

    const savedComment = await this.commentRepository.save(comment);
    
    return await this.commentRepository.findOneOrFail({
      where: { id: savedComment.id },
      relations: ['author', 'mentionedUsers', 'likes', 'replies'],
    });
  }

  async remove(commentId: number, userId: number): Promise<void> {
    // Récupérer l'utilisateur
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });
    
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['author', 'replies'],
    });

    if (!comment) {
      throw new NotFoundException('Commentaire non trouvé');
    }

    // Vérifier les permissions (auteur ou admin)
    const isAuthor = comment.author.id === user.id;
    const isAdmin = user.role === 'ADMIN';
    
    if (!isAuthor && !isAdmin) {
      throw new ForbiddenException('Vous ne pouvez pas supprimer ce commentaire');
    }

    // Si le commentaire a des réponses, marquer comme supprimé
    if (comment.replies && comment.replies.length > 0) {
      comment.content = '[Commentaire supprimé]';
      comment.deletedAt = new Date();
      await this.commentRepository.save(comment);
    } else {
      // Sinon, supprimer définitivement
      await this.commentRepository.remove(comment);
    }
  }

  async getCommentStats(articleId: number): Promise<{ total: number; withReplies: number }> {
    const comments = await this.commentRepository.find({
      where: { article: { id: articleId } as any },
    });

    const withReplies = comments.filter(comment => comment.replies && comment.replies.length > 0).length;

    return {
      total: comments.length,
      withReplies,
    };
  }
}