import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const app = await NestFactory.create(AppModule, {
	abortOnError: process.env['NODE_ENV'] !== 'development',
	cors: true,
});


await app.listen(8888);
