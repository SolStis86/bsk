import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ChannelService, RequestContext, RequestContextService, TransactionalConnection } from '@vendure/core';
import { Channel } from '@vendure/core/dist/entity/channel/channel.entity';

@Injectable()
export class ChannelTaxBootstrapService implements OnApplicationBootstrap {
    constructor(
        private connection: TransactionalConnection,
        private channelService: ChannelService,
        private requestContextService: RequestContextService,
    ) {}

    async onApplicationBootstrap(): Promise<void> {
        const ctx = await this.requestContextService.create({ apiType: 'admin' });
        await this.ensurePricesIncludeTax(ctx);
    }

    private async ensurePricesIncludeTax(ctx: RequestContext): Promise<void> {
        const channelRepo = this.connection.getRepository(ctx, Channel);
        const channels = await channelRepo.find();
        for (const channel of channels) {
            if (channel.pricesIncludeTax) {
                continue;
            }
            await this.channelService.update(ctx, {
                id: channel.id,
                pricesIncludeTax: true,
            });
        }
    }
}
