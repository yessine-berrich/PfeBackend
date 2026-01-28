import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtPayloadType } from 'utils/types';
import { LoginDto } from './dto/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { userRole } from 'utils/constants';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService, 
  ) {}

  async register(CreateUserDto: CreateUserDto) {
    const { firstName, lastName, email, password } =
      CreateUserDto;

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Cet e-mail est déjà utilisé.');
    }

    const salt = 10;
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = this.userRepository.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: userRole.EMPLOYEE,
      isActive: false,
    });

    let savedUser: User;
    try {
      savedUser = await this.userRepository.save(user);

    } catch (error) {
      if (error.code === '23505') {
        if (error.detail.includes('n_cin')) {
          throw new BadRequestException('Ce numéro CIN est déjà enregistré.');
        }
        if (error.detail.includes('rib')) {
          throw new BadRequestException('Ce RIB est déjà enregistré.');
        }
        throw new BadRequestException(
          'Erreur de données uniques. Vérifiez tous les champs.',
        );
      }

      console.error(error);
      throw new BadRequestException(
        "Une erreur inattendue est survenue lors de l'enregistrement.",
      );
    }

    const payload = {
      sub: savedUser.id,
      email: savedUser.email,
      role: savedUser.role,
    };
    const token = this.jwtService.sign(payload);

    const { password: _pwd, ...userWithoutPassword } = savedUser;

    return {
      message: "Inscription réussie. En attente d'activation.",
      user: userWithoutPassword,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      return { success: false, message: 'Email ou mot de passe incorrect' };
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return { success: false, message: 'Email ou mot de passe incorrect' };
    }

    if (!user.isActive) {
      return {
        success: false,
        message:
          "Votre compte n'est pas encore actif. Veuillez contacter l'administrateur.",
      };
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const token = this.jwtService.sign(payload);

    const { password: _pwd, ...userWithoutPassword } = user;

    return {
      success: true,
      token,
      user: userWithoutPassword,
    };
  }

  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
  }

  private generateJWT(payload: JwtPayloadType): Promise<string> {
    return this.jwtService.signAsync(payload);
  }
}