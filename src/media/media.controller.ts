import { Controller, Post, UseInterceptors, UploadedFile, UploadedFiles, Body } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

// Configuration de Multer pour le stockage local (ou utilise S3/Cloudinary)
export const multerConfig = {
  storage: diskStorage({
    destination: './uploads', // Le dossier où seront sauvegardés les fichiers
    filename: (req, file, cb) => {
      const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
      cb(null, `${randomName}${extname(file.originalname)}`);
    },
  }),
};

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload-single')
  @UseInterceptors(FileInterceptor('file', multerConfig)) // 'file' est le nom du champ dans le formulaire
  async uploadSingleFile(@UploadedFile() file: Express.Multer.File) {
    const mediaType = this.mediaService.getMediaTypeFromMimeType(file.mimetype);
    // Ici, tu pourrais sauvegarder dans S3/Cloudinary et obtenir l'URL finale
    // Pour l'instant, on utilise l'URL locale
    const fileUrl = `${process.env.APP_URL || 'http://localhost:3000'}/uploads/${file.filename}`;

    return {
      url: fileUrl,
      filename: file.originalname,
      mimetype: file.mimetype,
      type: mediaType,
    };
  }

  @Post('upload-multiple')
  @UseInterceptors(FilesInterceptor('files', 10, multerConfig)) // 'files' pour plusieurs, max 10
  async uploadMultipleFiles(@UploadedFiles() files: Array<Express.Multer.File>) {
    const uploadedFiles = await Promise.all(files.map(async (file) => {
      const mediaType = this.mediaService.getMediaTypeFromMimeType(file.mimetype);
      const fileUrl = `${process.env.APP_URL || 'http://localhost:3000'}/uploads/${file.filename}`;

      return {
        url: fileUrl,
        filename: file.originalname,
        mimetype: file.mimetype,
        type: mediaType,
      };
    }));
    return uploadedFiles;
  }
}