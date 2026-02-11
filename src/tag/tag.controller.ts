// tag.controller.ts
import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards } from '@nestjs/common';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { Roles } from 'src/users/decorators/user-role.decorator';
import { userRole } from 'utils/constants';
import { AuthGuard } from 'src/users/guards/auth.guard';


@Controller('api/tags')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
    findAll() {
    return this.tagService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tagService.findOne(+id);
  }

  @Post()
  @Roles(userRole.ADMIN, userRole.EMPLOYEE)
  @UseGuards(AuthGuard)
  create(@Body() createTagDto: CreateTagDto) {
    return this.tagService.create(createTagDto);
  }

  @Patch(':id')
  @Roles(userRole.ADMIN)
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() updateTagDto: UpdateTagDto) {
    return this.tagService.update(+id, updateTagDto);
  }

  @Delete(':id')
  @Roles(userRole.ADMIN)
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.tagService.remove(+id);
  }
}