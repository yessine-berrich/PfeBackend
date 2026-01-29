import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from 'bcryptjs';
import { MailService } from "../mail/mail.service";
import { randomBytes } from "node:crypto"
import { ConfigService } from "@nestjs/config";
import { User } from "./entities/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { LoginDto } from "./dto/login.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { JwtPayloadType } from "utils/types";
import { userRole } from "utils/constants";

@Injectable()
export class AuthService {

    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
        private readonly mailService: MailService,
        private readonly config: ConfigService
    ) { }

   /**
   * Create new user
   * @param registerDto data for creating new user
   * @returns a success message
   */
    public async register(registerDto: CreateUserDto) {
        const { email, password, firstName, lastName } = registerDto;

        const userFromDb = await this.userRepository.findOne({ where: { email } });
        if (userFromDb) throw new BadRequestException("user already exist");

        const hashedPassword = await this.hashPassword(password);

        let newUser = this.userRepository.create({
            email,
            firstName,
            lastName,
            password: hashedPassword,
            verificationToken: randomBytes(32).toString('hex'),
            role: userRole.EMPLOYEE,
            isActive: false,
        });

        newUser = await this.userRepository.save(newUser);
        const link = this.generateLink(newUser.id, newUser.verificationToken);

        await this.mailService.sendVerifyEmailTemplate(email, link);

        return { message: 'Verification token has been sent to your email, please verify your email address' };
    }

    /**
     * Log In user
     * @param loginDto data for log in to user account
     * @returns JWT (access token)
     */
    public async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) throw new BadRequestException("invalid email or password");

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) throw new BadRequestException("invalid email or password");

        if (!user.isActive) {
            let verificationToken = user.verificationToken;

            if (!verificationToken) {
                user.verificationToken = randomBytes(32).toString('hex');
                const result = await this.userRepository.save(user);
                verificationToken = result.verificationToken;
            }

            const link = this.generateLink(user.id, verificationToken);
            await this.mailService.sendVerifyEmailTemplate(email, link);

            return { message: 'Verification token has been sent to your email, please verify your email address' };
        }

        const accessToken = await this.generateJWT({ sub: user.id, role: user.role });
        return { accessToken };
    }

    /**
     *  Sending reset password link to the client
     */
    public async sendResetPasswordLink(email: string) {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) throw new BadRequestException("user with given email does not exist");

        user.resetPasswordToken = randomBytes(32).toString('hex');
        const result = await this.userRepository.save(user);

        const resetPasswordLink = `${this.config.get<string>("CLIENT_DOMAIN")}/reset-password/${user.id}/${result.resetPasswordToken}`;
        await this.mailService.sendResetPasswordTemplate(email, resetPasswordLink);

        return { message: "Password reset link sent to your email, please check your inbox" };
    }
    
    /**
     * Get reset password link
     */
    public async getResetPasswordLink(userId: number, resetPasswordToken: string) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new BadRequestException("invalid link");

        if (user.resetPasswordToken === null || user.resetPasswordToken !== resetPasswordToken)
            throw new BadRequestException("invalid link");

        return { message: 'valid link' }
    }

    /**
     *  Reset the password
     */
    public async resetPassword(dto: ResetPasswordDto) {
        const { userId, resetPasswordToken, newPassword } = dto;

        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new BadRequestException("invalid link");

        if (user.resetPasswordToken === null || user.resetPasswordToken !== resetPasswordToken)
            throw new BadRequestException("invalid link");

        const hashedPassword = await this.hashPassword(newPassword);
        user.password = hashedPassword;
        user.resetPasswordToken = '';
        await this.userRepository.save(user);

        return { message: 'password reset successfully, please log in' };
    }


    /**
     * Hashing password
     * @param password plain text password
     * @returns hashed password
     */
    public async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }

    /**
     * Generate Json Web Token
     * @param payload JWT payload
     * @returns token
     */
    private generateJWT(payload: JwtPayloadType): Promise<string> {
        return this.jwtService.signAsync(payload);
    }

    /**
     *  Generate email verification link
     */
    private generateLink(userId: number, verificationToken: string) {
        return `${this.config.get<string>("DOMAIN")}/api/users/verify-email/${userId}/${verificationToken}`;
    }
}