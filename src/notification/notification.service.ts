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
    // On utilise "as any" sur les relations si TS est trop strict avec les IDs
    const notification = this.notificationRepository.create({
      recipient: { id: userId } as any,
      message,
      link,
      isRead: false,
    });
    
    return await this.notificationRepository.save(notification);
  }

  async notifyMentions(users: User[], comment: any) {
    const authorName = `${comment.author.firstName} ${comment.author.lastName}`;
    const promises = users.map(user => 
      this.send(
        user.id, 
        `${authorName} vous a mentionné dans un commentaire.`,
        `/articles/${comment.article.id}`
      )
    );
    await Promise.all(promises);
  }

  async notifyReply(parentAuthor: User, reply: any) {
    const authorName = `${reply.author.firstName} ${reply.author.lastName}`;
    await this.send(
      parentAuthor.id,
      `${authorName} a répondu à votre commentaire.`,
      `/articles/${reply.article.id}`
    );
  }
}