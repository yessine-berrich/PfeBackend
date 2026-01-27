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
    private readonly jwtService: JwtService, // Le JwtService est injecté par son type, sans InjectRepository
  ) {}

  async register(CreateUserDto: CreateUserDto) {
    // 1. Récupérer les données
    const { nom, prenom, email, password, role } =
      CreateUserDto;

    // 🚨 CORRECTION 1: Vérification si l'utilisateur existe DÉJÀ AVANT de créer/sauvegarder
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Cet e-mail est déjà utilisé.');
    }

    // ... (Hashing du mot de passe) ...
    const salt = 10;
    const hashedPassword = await bcrypt.hash(password, salt);

    // 2. Création de l'utilisateur
    const user = this.userRepository.create({
      nom,
      prenom,
      email,
      password: hashedPassword,
      role: role,
      est_actif: false,
    });

    let savedUser: User;
    try {
      // 3. Sauvegarde de l'utilisateur principal
      savedUser = await this.userRepository.save(user);

    } catch (error) {
      // 🚨 CORRECTION 2: Gestion des erreurs de contraintes uniques (CIN/RIB)
      // Le code '23505' est l'erreur PostgreSQL pour "duplicate key value violates unique constraint"
      if (error.code === '23505') {
        // Utiliser le champ 'detail' de l'erreur PostgreSQL pour identifier la colonne
        if (error.detail.includes('n_cin')) {
          throw new BadRequestException('Ce numéro CIN est déjà enregistré.');
        }
        if (error.detail.includes('rib')) {
          throw new BadRequestException('Ce RIB est déjà enregistré.');
        }
        // Si une autre contrainte est violée
        throw new BadRequestException(
          'Erreur de données uniques. Vérifiez tous les champs.',
        );
      }

      // Gérer les autres erreurs inattendues
      console.error(error);
      throw new BadRequestException(
        "Une erreur inattendue est survenue lors de l'enregistrement.",
      );
    }

    // 5. Génération du token et préparation de la réponse
    const payload = {
      sub: savedUser.id,
      email: savedUser.email,
      role: savedUser.role,
    };
    const token = this.jwtService.sign(payload);

    // 🚨 CORRECTION 3: Retourner un message de succès et les données de l'utilisateur (sans mot de passe)
    const { password: _pwd, ...userWithoutPassword } = savedUser;

    return {
      message: "Inscription réussie. En attente d'activation.",
      user: userWithoutPassword,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 1. Recherche de l'utilisateur par email
    const user = await this.userRepository.findOne({ where: { email } });

    // Vérification : Utilisateur non trouvé
    if (!user) {
      return { success: false, message: 'Email ou mot de passe incorrect' };
    }

    // 2. Vérification du mot de passe
    const passwordMatch = await bcrypt.compare(password, user.password);

    // Vérification : Mot de passe incorrect
    if (!passwordMatch) {
      return { success: false, message: 'Email ou mot de passe incorrect' };
    }

    // 🚨 3. VÉRIFICATION DU STATUT D'ACTIVATION
    if (!user.est_actif) {
      return {
        success: false,
        message:
          "Votre compte n'est pas encore actif. Veuillez contacter l'administrateur.",
      };
    }

    // 4. Génération du token JWT (Si le compte est actif)
    // Nous ajoutons également le rôle dans le payload pour faciliter l'autorisation (guards)
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role, // Inclus le rôle de l'utilisateur
    };
    const token = this.jwtService.sign(payload);

    // 5. Préparation de la réponse
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