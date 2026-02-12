// category.controller.ts
import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Roles } from 'src/users/decorators/user-role.decorator';
import { userRole } from 'utils/constants';
import { AuthGuard } from 'src/users/guards/auth.guard';


@Controller('api/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(+id);
  }

  @Post()
  @Roles(userRole.ADMIN)
  @UseGuards(AuthGuard)
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Patch(':id')
  @Roles(userRole.ADMIN)
  @UseGuards(AuthGuard)
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoryService.update(+id, updateCategoryDto);
  }

  @Delete(':id')
  @Roles(userRole.ADMIN, userRole.EMPLOYEE)
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.categoryService.remove(+id);
  }
}