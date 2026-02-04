import { User } from 'src/users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @Column()
  type: string; // ex: 'COMMENT', 'VALIDATION', 'UPDATE'

  @ManyToOne(() => User)
  recipient: User;

  @CreateDateColumn()
  createdAt: Date;
}