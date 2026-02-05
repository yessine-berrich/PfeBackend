import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { Notification } from './entities/notification.entity'; // Import de l'entité

@Module({
  imports: [
    // Indispensable pour injecter le repository dans le service
    TypeOrmModule.forFeature([Notification]), 
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  // TRÈS IMPORTANT : on l'exporte pour que CommentModule puisse l'utiliser
  exports: [NotificationService], 
})
export class NotificationModule {}