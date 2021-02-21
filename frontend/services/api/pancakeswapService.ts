import BigNumber from 'bignumber.js';
import bluebird  from 'bluebird';

import * as config from '../../config';

import { web3Provider } from '../../utils/pancake-swap-lock/Web3Provider';

import { cakeswapClient } from '../../apollo/clients';
import { PAIR_QUERY } from '../../apollo/gql-queries';
import TokenContract from '../../utils/pancake-swap-lock/TokenContract';
import { fromWeiWithDecimals } from '../../utils/pancake-swap-lock/helper';
import PancakeswapContract from '../../utils/pancake-swap-lock/PancakeswapContract';
import PancakeswapLocker from "../../utils/pancake-swap-lock";

export class PancakeswapService {
    pancakeswapContract: PancakeswapContract;
    locker: PancakeswapLocker;
    constructor(){
        this.locker = new PancakeswapLocker(web3Provider);
        this.pancakeswapContract = new PancakeswapContract(web3Provider);
    }

    async findPair(pairAddress: string) {
        const pair = await this.pancakeswapContract.findPair(pairAddress);
        return pair;
    }

    async isApproved(token: string, owner: string) {
        try {
            const tokenContract = new TokenContract(token, web3Provider);
            const allowance = await tokenContract.allowance(owner, config.CONTRACT_ADDRESS);
            return parseInt(fromWeiWithDecimals(allowance)) > 0;
        } catch(e) {
            return false;
        }
    }

    async fetchTokenBalance(token: string, owner: string) {
        try {
            const tokenContract = new TokenContract(token, web3Provider);
            const decimals = await tokenContract.getDecimals();
            const balance = await tokenContract.getBalanceOf(owner);
            return fromWeiWithDecimals(balance, decimals);
        } catch(e) {
            return "0";
        }
    }

    async getPairs() {
        let result = await this.pancakeswapContract.getPairs();
        const pairs = await bluebird.map(result, async (pair) => {
            const lockInfo = await this.locker.getPairInfo(pair.id);

            return {
                ...pair,
                ...lockInfo,
            }
        });
        return {
            count: result.length,
            rows: pairs
        }
    }
}

export default new PancakeswapService();