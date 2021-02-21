import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';

export const MAX_APPROVAL = ethers.constants.MaxUint256;

export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID) || 1;

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
export const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS || '';

export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || '';
export const PAIR_TOKEN = process.env.NEXT_PUBLIC_PAIR_TOKEN || '';
