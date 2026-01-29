import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // app.enableCors({
  //   origin: [
  //     'http://localhost:3000',
  //     'http://localhost:5173',
  //     'http://127.0.0.1:3000',
  //     'http://127.0.0.1:5173',
  //   ],
  //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  //   allowedHeaders: [
  //     'Content-Type',
  //     'Authorization',
  //     'Accept',
  //     'X-Requested-With',
  //     'Access-Control-Allow-Origin',
  //   ],
  //   credentials: true,
  //   preflightContinue: false,
  //   optionsSuccessStatus: 204,
  // });

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
