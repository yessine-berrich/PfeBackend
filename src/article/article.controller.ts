import { 
  Controller, Get, Post, Body, Patch, Param, Delete, 
  UseGuards, ParseIntPipe 
} from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { userRole } from 'utils/constants';
import { ArticleService } from './article.service';
import { Roles } from 'src/users/decorators/user-role.decorator';
import { AuthGuard } from 'src/users/guards/auth.guard';
import { CurrentPayload } from 'src/users/decorators/current-payload.decorator';
import type { JwtPayloadType } from 'utils/types';
import { User } from 'src/users/entities/user.entity';


@Controller('api/articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post()
  @Roles(userRole.ADMIN, userRole.EMPLOYEE)
  @UseGuards(AuthGuard)
  create(
    @Body() createArticleDto: CreateArticleDto, 
    @CurrentPayload() payload: JwtPayloadType
  ) {
    return this.articleService.create(createArticleDto,{ id: payload.sub } as User);
  }

  @Get()
  findAll() {
    return this.articleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.articleService.findOne(id);
  }

  @Patch(':id')
  @Roles(userRole.ADMIN, userRole.EMPLOYEE)
  @UseGuards(AuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateArticleDto: UpdateArticleDto
  ) {
    return this.articleService.update(id, updateArticleDto);
  }

  @Delete(':id')
  @Roles(userRole.ADMIN, userRole.EMPLOYEE)
  @UseGuards(AuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.articleService.remove(id);
  }
}