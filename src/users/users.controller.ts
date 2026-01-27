import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { Roles } from './decorators/user-role.decorator';
import { userRole } from 'utils/constants';
import { AuthGuard } from './guards/auth.guard';
import { CurrentPayload } from './decorators/current-payload.decorator';
import type { JwtPayloadType } from 'utils/types';
import { AuthRolesGuard } from './guards/auth-roles.guard';

@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('/auth/register')
  register(@Body() body: CreateUserDto) {
    return this.usersService.register(body);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/auth/login')
  login(@Body() body: LoginDto) {
    return this.usersService.login(body);
  }

  @Get('/current-user')
  @Roles(userRole.ADMIN, userRole.EMPLOYEE)
  @UseGuards(AuthGuard) 
  getCurrentUser(@CurrentPayload() payload: JwtPayloadType) {
    return this.usersService.getCurrentUser(payload.sub);
  }

  @Get()
  @UseGuards(AuthRolesGuard)
  @Roles(userRole.ADMIN, userRole.EMPLOYEE)
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Get(':id')
  @UseGuards(AuthRolesGuard)
  @Roles(userRole.ADMIN, userRole.EMPLOYEE)
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.getUserById(id);
  }
}
