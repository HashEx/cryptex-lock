import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useWallet } from 'use-wallet';

import * as config from '../config';

import PancakeswapLocker from '../utils/pancake-swap-lock';
import Web3Provider from '../utils/pancake-swap-lock/Web3Provider';

const PancakeswapLockerContext = createContext({} as PancakeswapLocker);

export const usePancakeswapLocker = () => {
    return useContext(PancakeswapLockerContext);
};

const PancakeswapLockerProvider: React.FC = ({children}) => {
    const wallet: any = useWallet();
    useEffect(() => {
        wallet.connect("injected");
    }, []);
    const pancakeswapLocker = useMemo(() => {
        let provider = new Web3Provider('https://data-seed-prebsc-1-s1.binance.org:8545', config.CHAIN_ID);
        if(wallet.ethereum){
            provider = new Web3Provider(wallet.ethereum, config.CHAIN_ID);
        }
        return new PancakeswapLocker(provider, wallet.account);
    }, [wallet.account, wallet.ethereum])

    return (
        <PancakeswapLockerContext.Provider value={pancakeswapLocker}>
            {children}
        </PancakeswapLockerContext.Provider>
    )
}

export default PancakeswapLockerProvider;