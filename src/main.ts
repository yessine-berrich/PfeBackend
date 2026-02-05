import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { seedCategoriesAndTags } from './seeds/category-tag.seed';
import { DataSource } from 'typeorm';
import { join } from 'path/win32';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  // const app = await NestFactory.create(AppModule);

  // Ajoutez <NestExpressApplication> ici
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const dataSource = app.get(DataSource);
  await seedCategoriesAndTags(dataSource);

  // Rend le dossier "uploads" public
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  app.enableCors({
    origin: 'http://localhost:3001', // Next.js
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      // transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
  // console.log(`🚀 Backend running on: ${await app.getUrl()}`);
  // console.log(`📍 Port: ${process.env.PORT ?? 3000}`);
  // console.log(`🌍 CORS enabled for: localhost:3000, localhost:5173`);
}
bootstrap();
