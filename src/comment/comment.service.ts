import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Repository, IsNull } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { UsersService } from 'src/users/users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationService } from 'src/notification/notification.service';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    private readonly userService: UsersService,
    private readonly notificationService: NotificationService,
  ) {}

  async create(createCommentDto: CreateCommentDto, userId: number) {
    const { content, articleId, parentId } = createCommentDto;

    // 1. Vérification de l'auteur
    const author = await this.userService.getCurrentUser(userId);
    if (!author) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // 2. Extraction des mentions
    const mentionRegex = /@([A-Z][a-z]+)([A-Z][a-z]+)/g;
    const matches = [...content.matchAll(mentionRegex)];
    const mentionData = matches.map((match) => ({
      firstName: match[1],
      lastName: match[2],
    }));
    const mentionedUsers = await this.userService.findByNames(mentionData);

    // 3. Préparation des données (on force les types pour satisfaire TS)
    const newComment = this.commentRepository.create({
      content,
      author: author, // Ici author n'est plus null grâce au check plus haut
      article: { id: articleId } as any,
      parent: parentId ? ({ id: parentId } as any) : undefined, // Utilise undefined au lieu de null ici
      mentionedUsers,
    });

    // savedComment sera maintenant reconnu comme un objet unique (Comment)
    const savedComment = await this.commentRepository.save(newComment);

    // 4. Rechargement pour les notifications
    const fullComment = await this.commentRepository.findOne({
      where: { id: savedComment.id },
      relations: ['author', 'article', 'mentionedUsers'],
    });

    if (!fullComment) throw new NotFoundException('Commentaire non créé');

    // 5. Notifications
    if (mentionedUsers.length > 0) {
      await this.notificationService.notifyMentions(mentionedUsers, fullComment);
    }

    if (parentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: parentId },
        relations: ['author'],
      });
      if (parentComment && parentComment.author.id !== userId) {
        await this.notificationService.notifyReply(parentComment.author, fullComment);
      }
    }

    return fullComment;
  }

  async findByArticle(articleId: number) {
    return await this.commentRepository.find({
      where: {
        article: { id: articleId },
        parent: IsNull(), // Pour Facebook-style : on récupère les racines
      },
      relations: ['author', 'replies', 'replies.author', 'mentionedUsers'],
      order: { createdAt: 'DESC' },
    });
  }
}