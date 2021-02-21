import { AbiItem } from 'web3-utils';

import * as config from '../../config';

import tokenAbi from './erc20.json';

import EthContract from './EthContract';
import Web3Provider from './Web3Provider';
import { fromWeiWithDecimals } from './helper';


class TokenContract extends EthContract {
    constructor(address: string, web3Provider: Web3Provider, abi: AbiItem[] = tokenAbi as AbiItem[]) {
        super(address, abi, web3Provider);
    }

    async getName(): Promise<string> {
        return await this.getVariable("name");
    }

    async getSymbol(): Promise<string> {
        return await this.getVariable("symbol");
    }

    async getDecimals(): Promise<number> {
        return await this.getVariable("decimals");
    }

    async getBalanceOf(address: string): Promise<string> {
        return await this.getVariable("balanceOf", address);
    }

    async allowance(owner: string, spender: string): Promise<string> {
        return await this.getVariable("allowance", owner, spender);
    }

    async approve(to: string, from: string) {
        await this.contract.methods.approve(to, config.MAX_APPROVAL.toString()).send({from})
    }
}

export default TokenContract