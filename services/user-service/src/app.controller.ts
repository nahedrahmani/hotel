import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('/health')
  health() {
    return { status: 'UP' };
  }

  @Get('/info')
  info() {
    return { app: process.env.SERVICE_NAME || 'user-service' };
  }
}
