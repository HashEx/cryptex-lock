import Web3 from 'web3';
import {HttpProvider, WebsocketProvider} from 'web3-core';

import * as config from '../../config';

class Web3Provider {
    provider: HttpProvider | WebsocketProvider;
    web3: Web3;
    networkId: number;
    constructor(provider: string | HttpProvider | WebsocketProvider, networkId: number, options?: any){
        let realProvider;
        options = options || {}
        if (typeof provider === "string") {
            if (provider.includes("wss")) {
                realProvider = new Web3.providers.WebsocketProvider(
                    provider,
                    options.ethereumNodeTimeout || 10000
                );
            } else {
                realProvider = new Web3.providers.HttpProvider(
                    provider,
                    options.ethereumNodeTimeout || 10000
                );
            }
        } else {
            realProvider = provider;
        }
        this.networkId = networkId;
        this.provider = realProvider;
        this.web3 = new Web3(this.provider);
    }
}

export const web3Provider = new Web3Provider(config.RPC_URL, config.CHAIN_ID);

export default Web3Provider;