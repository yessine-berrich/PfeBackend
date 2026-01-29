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
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

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

  // GET: ~/api/users/verify-email/:id/:verificationToken
    @Get("verify-email/:id/:verificationToken")
    public verifyEmail(
        @Param('id', ParseIntPipe) id: number,
        @Param('verificationToken') verificationToken: string
    ) {
        return this.usersService.verifyEmail(id, verificationToken);
    }

    // POST: ~/api/users/forgot-password
    @Post("forgot-password")
    @HttpCode(HttpStatus.OK)
    public forgotPassword(@Body() body: ForgotPasswordDto) {
        return this.usersService.sendResetPassword(body.email);
    }

    // GET: ~/api/users/reset-password/:id/:resetPasswordToken
    @Get("reset-password/:id/:resetPasswordToken")
    public getResetPassword(
        @Param("id", ParseIntPipe) id: number,
        @Param("resetPasswordToken") resetPasswordToken: string
    ) {
        return this.usersService.getResetPassword(id, resetPasswordToken);
    }

    // POST: ~/api/users/reset-password
    @Post("reset-password")
    public resetPassword(@Body() body: ResetPasswordDto) {
        return this.usersService.resetPassword(body);
    }
}
