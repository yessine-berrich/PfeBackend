import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { userRole } from 'utils/constants';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 100 })
    nom: string;

    @Column({ length: 100 })
    prenom: string;

    @Column({ length: 255, unique: true })
    email: string;

    @Column({ length: 255 })
    password: string;

    @Column({ type: 'enum', enum: userRole })
    role: userRole;
    
    @Column({ default: false })
    est_actif: boolean; // Activé par l'Admin

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    date_creation: Date;
}
