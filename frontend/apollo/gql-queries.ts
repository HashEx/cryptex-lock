import { gql } from '@apollo/client';


export const PAIRS_QUERY = gql`
    query pairs($first: Int!) {
        pairs(first: $first, orderBy: trackedReserveETH, orderDirection: desc) {
            id
            reserveUSD
            trackedReserveETH
            untrackedVolumeUSD
            volumeUSD
            token0 {
              id
              symbol
              decimals
              name
              totalLiquidity
            }
            token1 {
              id
              symbol
              decimals
              name
              totalLiquidity
            }
        }
    }
`;

export const PAIR_QUERY = gql`
    query pair($address: String!) {
        pair(id: $address) {
            id
            reserveUSD
            trackedReserveETH
            untrackedVolumeUSD
            volumeUSD
            token0 {
              id
              symbol
              decimals
              name
              totalLiquidity
            }
            token1 {
              id
              symbol
              decimals
              name
              totalLiquidity
            }
        }
    }
`;