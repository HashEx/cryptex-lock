import web3 from 'web3';
import { AbiItem } from 'web3-utils';
import moment from 'moment';
import bluebird from 'bluebird';

import * as config from '../../config';

import Web3Provider from './Web3Provider';
import EthContract from './EthContract';

import TokenContract from './TokenContract';
import { fromWeiWithDecimals, toWeiWithDecimals } from './helper';
import PancakeswapLockerContract from './PancakeswapLockerContract';
import { Lock } from '../../interfaces/Lock';

class PancakeswapLocker {
    provider: Web3Provider;
    pancakeswapLockerContract: PancakeswapLockerContract;
    defaultAccount: string;
    constructor(web3Provider: Web3Provider, defaultAccount?: string){
        this.provider = web3Provider;
        this.pancakeswapLockerContract = new PancakeswapLockerContract(config.CONTRACT_ADDRESS, web3Provider);
        this.defaultAccount = defaultAccount;
    }

    async lock(token: string, amount: string, unlockDate: number, from: string, ethFee: string) {
        await this.pancakeswapLockerContract.lockLPToken(token, amount, unlockDate, from, ethFee);
    }

    async unlock(token: string, index: number, lockId: number, amount: string, from: string) {
        await this.pancakeswapLockerContract.withdraw(token, index, lockId, amount, from);
    }

    async transferOwnership(token: string, index: number, lockId: number, newOwner: string, from: string) {
        await this.pancakeswapLockerContract.transferLockOwnership(token, index, lockId, newOwner, from);
    }

    async relock(token: string, index: number, lockId: number, newUnlockDate: number, from: string) {
        await this.pancakeswapLockerContract.relock(token, index, lockId, newUnlockDate, from);
    }

    async incrementLock(token: string, index: number, lockId: number, amount: string, from: string){
        await this.pancakeswapLockerContract.incrementLock(token, index, lockId, amount, from);
    }

    async approve(token: string, from: string) {
        const tokenContract = new TokenContract(token, this.provider);
        await tokenContract.approve(config.CONTRACT_ADDRESS, from);
    }

    async getMetrics() {
        const numLockedTokens = await this.pancakeswapLockerContract.getNumLockedTokens();
        return {
            numLockedTokens,
        }
    }

    formatLock = (decimals: number) => (lock: any): Lock => {
        return {
            amount: fromWeiWithDecimals(lock.amount, decimals),
            initialAmount: fromWeiWithDecimals(lock.initialAmount, decimals),
            lockDate: parseInt(lock.lockDate),
            unlockDate: parseInt(lock.unlockDate),
            lockId: parseInt(lock.lockID),
            owner: lock.owner,
            index: lock.index,
        } as Lock
    }

    async getPairLocks(address: string) {
        const tokenContract = new TokenContract(address, this.provider);
        const decimals = await tokenContract.getDecimals();
        const numLocks = await this.pancakeswapLockerContract.getNumLocksForToken(address);
        let i = 0;
        let locks = [];
        while(i < numLocks){
            let lock = await this.pancakeswapLockerContract.tokenLocks(address, i);
            lock.index = i;
            locks.push(lock);
            i++;
        }

        return locks.map(this.formatLock(decimals));
    }

    async getPairInfo(address: string) {
        try {
            const locks = (await this.getPairLocks(address));
            const lockedAmount = locks.reduce((acc, lock) => {
                return acc + parseFloat(lock.amount);
            }, 0);
            return {
                locks,
                lockedAmount,
            }
        } catch(e){
            console.error(e, address);
            return {
                locks: 0,
                lockedAmount: 0
            }
        }
    }

    async getFees() {
        try {
            const gFees = await this.pancakeswapLockerContract.getGFees();
            return {
                ethFee: fromWeiWithDecimals(gFees.ethFee),
                liquidityFee: gFees.liquidityFee,
                referralDiscount: gFees.referralDiscount,
                referralHold: fromWeiWithDecimals(gFees.referralHold),
                referralPercent: gFees.referralPercent,
                referralToken: gFees.referralToken,
                secondaryFeeToken: gFees.secondaryFeeToken,
                secondaryTokenDiscount: gFees.secondaryTokenDiscount,
                secondaryTokenFee: fromWeiWithDecimals(gFees.secondaryTokenFee),
            }
        } catch(e) {
            console.error(e);
            return {}
        }
    }

    getUserLocksForToken = async (address: string, token: string) => {
        const tokenContract = new TokenContract(token, this.provider);
        const decimals = await tokenContract.getDecimals();
        const numLocks = await this.pancakeswapLockerContract.getUserNumLocksForToken(address, token);
        let i = 0;
        let locks = [];
        while(i < numLocks){
            let lock = await this.pancakeswapLockerContract.getUserLockForTokenAtIndex(address, token, i);
            lock.lockDate = lock[0];
            lock.amount = lock[1];
            lock.initialAmount = lock[2];
            lock.unlockDate = lock[3];
            lock.lockID = lock[4];
            lock.owner = lock[5];
            lock.index = i;
            locks.push(lock);
            i++;
        }
        return locks.map(this.formatLock(decimals));
    }

    getTokenBalanceOf = async (token: string, address: string) => {
        const tokenContract = new TokenContract(token, this.provider);
        const decimals = await tokenContract.getDecimals();
        const balanceOf = await tokenContract.getBalanceOf(address);

        return fromWeiWithDecimals(balanceOf, decimals);
    }
}

export default PancakeswapLocker;