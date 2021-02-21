import bluebird from 'bluebird';
import { Contract } from 'ethers';
import { AbiItem } from 'web3-utils';
import PancakeswapLocker from '.';
import * as config from '../../config';

import EthContract from './EthContract';
import { fromWeiWithDecimals } from './helper';
import PancakePairContract from './PancakePairContract';
import PancakeswapABI from './pancakeswap.json';
import TokenContract from './TokenContract';
import Web3Provider from './Web3Provider';



class PancakeswapContract extends EthContract {
    pancakeswapLocker: PancakeswapLocker;
    constructor(web3Provider: Web3Provider) {
        super(config.FACTORY_ADDRESS, PancakeswapABI as AbiItem[], web3Provider);
        this.pancakeswapLocker = new PancakeswapLocker(web3Provider);
    }
    
    findPair = async (pairAddress: string) => {
        const allPairs = await this.getAllPairs();
        const pair = allPairs.find(pair => pair.id === pairAddress);
        return await this.getPair(pair);
    }

    getPair = async (pair: any) => {
        
        const pairContract = new PancakePairContract(pair.id, this.web3Provider);
        const token0Contract = new TokenContract(pair.token0, this.web3Provider);
        const token1Contract = new TokenContract(pair.token1, this.web3Provider);
        
        const totalSupply = fromWeiWithDecimals(await pairContract.getTotalSupply());
        const pairInfo = await this.pancakeswapLocker.getPairInfo(pair.id);

        return {
            id: pair.id,
            token0: {
                id: pair.token0,
                symbol: await token0Contract.getSymbol(),
                decimals: await token0Contract.getDecimals(),
                name: await token0Contract.getName(),
            },
            token1: {
                id: pair.token1,
                symbol: await token1Contract.getSymbol(),
                decimals: await token1Contract.getDecimals(),
                name: await token0Contract.getName(),
            },
            liquidity: totalSupply,
            ...pairInfo
        }
    }

    getAllPairs = async () => {
        const pairCreateEvents = await this.getPastEvents("PairCreated", {fromBlock: '0'});
        return pairCreateEvents.map((event) => {
            const token0 = event.returnValues.token0;
            const token1 = event.returnValues.token1;
            return {
                id: event.returnValues.pair,
                token0,
                token1,
            }
        });
    }
    getPairs = async () => {
        const allPairs = await this.getAllPairs();
        
        const pairs = await bluebird.map(allPairs, this.getPair);

        return pairs;
    }
}

export default PancakeswapContract