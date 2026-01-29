import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm/browser/repository/Repository.js';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly authService: AuthService,
  ) {}

  async getCurrentUser(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  async register(registerDto: CreateUserDto) {
    return this.authService.register(registerDto);
  }

  async login(loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.find();
  }

  async getUserById(id: number): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé.`);
    }

    return user;
  }

   /**
   * Verify Email
   * @param userId id of the user from the link
   * @param verificationToken verification token from the link
   * @returns success message
   */
  public async verifyEmail(userId: number, verificationToken: string) {
  const user = await this.getCurrentUser(userId);

  if (!user) {
    throw new NotFoundException("User not found");
  }

  if (user.verificationToken === null) {
    throw new NotFoundException("There is no verification token");
  }

  if (user.verificationToken !== verificationToken) {
    throw new BadRequestException("Invalid link");
  }

  user.isActive = true;
  
  user.verificationToken = null as any; 

  await this.userRepository.save(user);
  return { message: "Your email has been verified, please log in to your account" };
}

  /**
   * Sending reset password template
   * @param email email of the user
   * @returns a success message
   */
  public sendResetPassword(email: string) {
    return this.authService.sendResetPasswordLink(email);
  }

  /**
   * Get reset password link
   * @param userId user id from the link
   * @param resetPasswordToken reset password token from the link
   * @returns a success message
   */
  public getResetPassword(userId:number, resetPasswordToken: string) {
    return this.authService.getResetPasswordLink(userId, resetPasswordToken);
  }

  /**
   * Reset the password
   * @param dto data for reset the password
   * @returns a success message
   */
  public resetPassword(dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
