// comments.controller.ts
import { Controller, Post, Get, Body, Param, Delete, UseGuards, Patch } from '@nestjs/common';
import { CommentService } from './comment.service';
import { User } from '../users/entities/user.entity';
import { AuthGuard } from 'src/users/guards/auth.guard';
import { CurrentPayload } from 'src/users/decorators/current-payload.decorator';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @UseGuards(AuthGuard)
  @Post()
  create(@Body() createCommentDto: any, @CurrentPayload() user: User) {
    return this.commentService.create(createCommentDto, user);
  }

  @Get('article/:articleId')
  findAllByArticle(@Param('articleId') articleId: number) {
    return this.commentService.findByArticle(articleId);
  }

  @UseGuards(AuthGuard)
  @Post(':id/like')
  toggleLike(@Param('id') id: number, @CurrentPayload() user: User) {
    return this.commentService.toggleLike(id, user);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: number, @CurrentPayload() user: User) {
    return this.commentService.remove(id, user);
  }
}