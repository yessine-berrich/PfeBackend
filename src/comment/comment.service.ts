import { Injectable } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentService {
  async create(createCommentDto: CreateCommentDto, userId: number) {
    const { content, articleId, parentId } = createCommentDto;

    const author = await this.userService.getCurrentUser(userId);

    // 1. Extraire les mentions (ex: @username)
    const mentionRegex = /@(\w+)/g;
    const usernames = [...content.matchAll(mentionRegex)].map(
      (match) => match[1],
    );
    const mentionedUsers = await this.userService.findByUsernames(usernames);

    // 2. Créer le commentaire
    const comment = this.commentRepository.create({
      content,
      author,
      article: { id: articleId },
      parent: parentId ? { id: parentId } : null,
      mentionedUsers,
    });

    const savedComment = await this.commentRepository.save(comment);

    // 3. ENVOYER LES NOTIFICATIONS
    // Notification pour les mentions
    if (mentionedUsers.length > 0) {
      await this.notificationService.notifyMentions(
        mentionedUsers,
        savedComment,
      );
    }

    // Notification pour la réponse au parent
    if (parentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: parentId },
        relations: ['author'],
      });
      if (parentComment.author.id !== userId) {
        await this.notificationService.notifyReply(
          parentComment.author,
          savedComment,
        );
      }
    }

    return savedComment;
  }

  findAll() {
    return `This action returns all comment`;
  }

  findOne(id: number) {
    return `This action returns a #${id} comment`;
  }

  update(id: number, updateCommentDto: UpdateCommentDto) {
    return `This action updates a #${id} comment`;
  }

  remove(id: number) {
    return `This action removes a #${id} comment`;
  }
}
