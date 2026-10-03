import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Eureka } from 'eureka-js-client';
import * as os from 'os';

@Injectable()
export class EurekaService implements OnModuleInit, OnModuleDestroy {
    private client: any;

    onModuleInit() {
        const serviceName = process.env.SERVICE_NAME || 'user-service';
        const port = Number(process.env.PORT || 3000);
        const host = process.env.HOST || 'localhost';
        const ipAddr = process.env.IP_ADDR || '127.0.0.1';
        const eurekaHost = process.env.EUREKA_HOST || 'localhost';
        const eurekaPort = Number(process.env.EUREKA_PORT || 8889);


        this.client = new Eureka({
            instance: {
                app: serviceName,
                instanceId: `${os.hostname()}:${serviceName}:${process.pid}`,
                hostName: host,
                ipAddr,
                statusPageUrl: `http://${ipAddr}:${port}/info`,
                healthCheckUrl: `http://${ipAddr}:${port}/health`,
                port: { '$': port, '@enabled': true },
                vipAddress: serviceName,
                dataCenterInfo: {
                    '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
                    name: 'MyOwn',
                },
                metadata: { protocol: 'http' },
            },
            eureka: {
                host: eurekaHost,
                port: eurekaPort,
                servicePath: '/eureka/apps/',
            },
        });

        this.client.start((err) => {
            if (err) console.error('Eureka start error', err);
            else console.log(`Registered ${serviceName} with Eureka at ${eurekaHost}:${eurekaPort}`);
        });

        // graceful unregister on process exit
        process.on('SIGINT', () => {
            this.client.stop(() => process.exit(0));
        });
    }

    onModuleDestroy() {
        if (this.client) this.client.stop();
    }
}
