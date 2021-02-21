import bluebird from "bluebird";

import { cakeswapClient } from "../apollo/clients";
import Web3Provider, { web3Provider } from "../utils/pancake-swap-lock/Web3Provider";

import PancakeswapLocker from "../utils/pancake-swap-lock";
import { PAIRS_QUERY } from "../apollo/gql-queries";
import PancakeswapContract from "../utils/pancake-swap-lock/PancakeswapContract";

class PancakeswapLockerProvider {
    provider: Web3Provider = web3Provider;
    locker: PancakeswapLocker;
    pancakeSwapContract: PancakeswapContract;
    
    constructor(){
        // Mainnet - https://bsc-dataseed1.binance.org:443
        // Tetsnet - https://data-seed-prebsc-1-s1.binance.org:8545
        this.locker = new PancakeswapLocker(this.provider);
        this.pancakeSwapContract = new PancakeswapContract(this.provider);
    }

    async getPairs() {
        let result = await this.pancakeSwapContract.getPairs();
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

export default new PancakeswapLockerProvider();