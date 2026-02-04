// notification.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async send(userId: number, message: string, link: string) {
    const notification = this.notificationRepository.create({
      recipient: { id: userId },
      message,
      link,
      isRead: false,
    });
    
    return await this.notificationRepository.save(notification);
  }

  // Helper pour les mentions
  async notifyMentions(users: User[], comment: any) {
    const promises = users.map(user => 
      this.send(
        user.id, 
        `${comment.author.username} vous a mentionné dans un commentaire.`,
        `/articles/${comment.article.id}`
      )
    );
    await Promise.all(promises);
  }

  // Helper pour les réponses
  async notifyReply(parentAuthor: User, reply: any) {
    await this.send(
      parentAuthor.id,
      `${reply.author.username} a répondu à votre commentaire.`,
      `/articles/${reply.article.id}`
    );
  }
}