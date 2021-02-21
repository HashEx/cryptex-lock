import { AbiItem } from 'web3-utils';
import { Contract, EventData, PastEventOptions } from 'web3-eth-contract';
import Web3Provider from './Web3Provider';

class EthContract {
    address: string;
    web3Provider: Web3Provider;
    contract: Contract;

    constructor(address: string, abi: AbiItem | AbiItem[], web3Provider: Web3Provider) {
        this.address = address;
        this.web3Provider = web3Provider;
        this.contract = new web3Provider.web3.eth.Contract(abi);
        this.contract.options.address = address;
    }

    async getPastEvents(event: string, options: PastEventOptions): Promise<EventData[]> {
        return await this.contract.getPastEvents(event, options);
    }

    async getVariable(name: string, ...args: any[]): Promise<any>{
        return await this.contract.methods[name](...args).call();
    }
}

export default EthContract;