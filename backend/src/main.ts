import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefijo global para la API REST
  app.setGlobalPrefix('api/v1');

  // Habilitar CORS para peticiones desde el frontend de desarrollo
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Validación estricta de DTOs en todos los controladores
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Backend corriendo en: http://localhost:${port}/api/v1`);
}
await bootstrap();
