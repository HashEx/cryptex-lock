import React from 'react';
import { useWallet } from 'use-wallet';

import Button, { IButtonProps } from '../button';

const ConnectWalletButton: React.FC<IButtonProps> = (props) => {
    const wallet = useWallet();
    const onConnect = () => {
        wallet.connect("injected");
    };
    const onDisconnect = () => {
        wallet.reset();
    }
    if(wallet.account) {
        return (
            <Button onClick={onDisconnect}>
                {wallet.account.slice(0, 10) + '...'}
            </Button>
        )
    }
    return (
        <Button {...props} onClick={onConnect}>
            Connect wallet
        </Button>
    )
}

export default ConnectWalletButton;