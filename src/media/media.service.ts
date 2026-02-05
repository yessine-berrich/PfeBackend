import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media, MediaType } from './entities/media.entity';
import { CreateMediaDto } from './dto/create-media.dto';
import { extname } from 'path';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
  ) {}

  // Cette méthode serait appelée après l'upload physique du fichier
  async create(createMediaDto: CreateMediaDto): Promise<Media> {
    const media = this.mediaRepository.create(createMediaDto);
    return await this.mediaRepository.save(media);
  }

  // Exemple pour déterminer le type de média
  getMediaTypeFromMimeType(mimetype: string): MediaType {
    if (mimetype.startsWith('image/')) {
      return MediaType.IMAGE;
    } else if (mimetype.includes('pdf') || mimetype.includes('document')) {
      return MediaType.DOCUMENT;
    }
    return MediaType.OTHER;
  }
}