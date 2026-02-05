import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { NotificationModule } from 'src/notification/notification.module';
import { UsersModule } from 'src/users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';

@Module({
  imports: [
    // 1. Enregistre l'entité pour générer le Repository
    TypeOrmModule.forFeature([Comment]),
    // 2. Importe les modules dont les services sont utilisés dans CommentService
    UsersModule,
    NotificationModule,
  ],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}
