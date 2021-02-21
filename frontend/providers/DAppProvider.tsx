import { UseWalletProvider, ConnectionRejectedError } from 'use-wallet';
import {
    BscConnector,
    UserRejectedRequestError,
} from '@binance-chain/bsc-connector'

import * as config from '../config';
import PancakeswapLockerProvider from './PancakeswapLockerProvider';

// const connectors = {
//     bsc: {
//         web3ReactConnector() {
//             return new BscConnector({ supportedChainIds: [56, 97] })
//         },
//         handleActivationError(err) {
//             if (err instanceof UserRejectedRequestError) {
//                 return new ConnectionRejectedError()
//             }
//         },
//     },
// };

const DAppProvider: React.FC = ({children}) => {
    return (
        <UseWalletProvider chainId={config.CHAIN_ID}>
            <PancakeswapLockerProvider>
                {children}
            </PancakeswapLockerProvider>
        </UseWalletProvider>
    )
}

export default DAppProvider;