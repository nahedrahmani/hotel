import { Module } from '@nestjs/common';
import { EurekaService } from './eureka.service';

@Module({
    providers: [EurekaService],
    exports: [],
})
export class EurekaModule {}
