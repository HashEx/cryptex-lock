import { Token } from './Token';
import { Lock } from './Lock';

export interface Pair {
  id: string,
  liquidity: number,
  lockedAmount: number,
  token0: Token,
  token1: Token,
  locks: Lock[];
}