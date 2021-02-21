import TokenContract from './TokenContract';
import Web3Provider from './Web3Provider';

import PancakePairAbi from './pancake-pair.json';
import { AbiItem } from 'web3-utils';

class PancakePairContract extends TokenContract {
    constructor(address: string, web3Provider: Web3Provider, ){
        super(address, web3Provider, PancakePairAbi as AbiItem[]);
    }
    async getTotalSupply() {
        return await this.getVariable("totalSupply");
    }
}

export default PancakePairContract;