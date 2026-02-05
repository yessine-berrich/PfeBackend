import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  message: string;

  @Column()
  link: string; // Cette colonne manquait probablement

  @Column({ default: false })
  isRead: boolean;

  @ManyToOne(() => User, (user) => user.notifications)
  recipient: User; // Utilise 'recipient' ici pour correspondre au service

  @CreateDateColumn()
  createdAt: Date;
}
