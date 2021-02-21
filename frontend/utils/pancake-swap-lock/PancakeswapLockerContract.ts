import EthContract from "./EthContract";
import Web3Provider from "./Web3Provider";

import PancakeswapLockerAbi from './pancakeswap-locker.json';
import { toWeiWithDecimals } from "./helper";
import { AbiItem } from "web3-utils";
import TokenContract from "./TokenContract";

export class PancakeswapLockerContract extends EthContract {
    constructor(address: string, web3Provider: Web3Provider) {
        super(address, PancakeswapLockerAbi as AbiItem[], web3Provider);
    }
    
    async getGFees() {
        return await this.getVariable("gFees");
    }

    async getLockedTokenAtIndex(index: number) {
        return await this.getVariable("getLockedTokenAtIndex", index);
    }

    async getNumLockedTokens() {
        return await this.getVariable("getNumLockedTokens");
    }

    async getNumLocksForToken(lpToken: string) {
        return await this.getVariable("getNumLocksForToken", lpToken);
    }

    async getUserLockForTokenAtIndex(user: string, lpToken: string, index: number) {
        return await this.getVariable("getUserLockForTokenAtIndex", user, lpToken, index);
    }

    async getUserLockedTokenAtIndex(user: string, index: number) {
        return await this.getVariable("getUserLockedTokenAtIndex", user, index);
    }

    async getUserNumLockedTokens(user: string) {
        return await this.getVariable("getUserNumLockedTokens", user);
    }

    async getUserNumLocksForToken(user: string, lpToken: string) {
        return await this.getVariable("getUserNumLocksForToken", user, lpToken);
    }

    async getUserWhitelistStatus(user: string) {
        return await this.getVariable("getUserWhitelistStatus", user);
    }

    async getWhitelistedUserAtIndex(index: number) {
        return await this.getVariable("getWhitelistedUserAtIndex", index);
    }

    async getWhitelistedUsersLength() {
        return await this.getVariable("getWhitelistedUsersLength");
    }

    async tokenLocks(address: string, index: number) {
        return await this.getVariable("tokenLocks", address, index);
    }

    async lockLPToken(lpToken: string, amount: string, unlockDate: number, from: string, ethFee: string){
        const formattedAmount = toWeiWithDecimals(amount);
        const formattedFee = toWeiWithDecimals(ethFee);

        return await this.contract.methods.lockLPToken(
            lpToken, 
            formattedAmount,
            unlockDate,
            true,
            from
        ).send({from, value: formattedFee})
    }

    async withdraw(lpToken: string, index: number, lockID: number, amount: string, from: string) {
        const tokenContract = new TokenContract(lpToken, this.web3Provider);
        const decimals = await tokenContract.getDecimals();
        const formattedAmount = toWeiWithDecimals(amount, decimals);
        return await this.contract.methods.withdraw(lpToken, index, lockID, formattedAmount).send({from});
    }

    async transferLockOwnership(lpToken: string, index: number, lockID: number, newOwner: string, from: string) {
        return await this.contract.methods.transferLockOwnership(lpToken, index, lockID, newOwner).send({from});
    }
    
    async relock(lpToken: string, index: number, lockID: number, newUnlockDate: number, from: string) {
        return await this.contract.methods.relock(lpToken, index, lockID, newUnlockDate).send({from});
    }

    async incrementLock(lpToken: string, index: number, lockID: number, amount: string, from) {
        const tokenContract = new TokenContract(lpToken, this.web3Provider);
        const decimals = await tokenContract.getDecimals();
        const formattedAmount = toWeiWithDecimals(amount, decimals);
        return await this.contract.methods.incrementLock(lpToken, index, lockID, formattedAmount).send({from});
    }
}

export default PancakeswapLockerContract;