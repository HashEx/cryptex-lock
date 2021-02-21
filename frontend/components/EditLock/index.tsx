import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
import { useWallet } from 'use-wallet';
import Card from '../Card';
import ConnectWalletButton from '../connectWalletButton';
import FormGroup from '../FormGroup';
import Input from '../Input';
import Loader from '../Loader';
import PairBanner from '../PairBanner';
import TextAlign from '../Text/TextAlign';
import { useLockSteps } from '../../hooks';
import * as config from '../../config';
import PairLabel from '../PairLabel';
import { usePancakeswapLocker } from '../../providers/PancakeswapLockerProvider';
import moment from 'moment';
import pancakeswapService from '../../services/api/pancakeswapService';
import UserLocks from '../UserLocks';

const EditLock = () => {
    const wallet = useWallet();
    const router = useRouter();
    const queryAddress = router.query.address as string;
    
    const { address, onChangeAddress, loading, pair, onContinue, onBack, step } = useLockSteps();
    useEffect(() => {
        onChangeAddress(queryAddress);
    }, [queryAddress]);

    if(!wallet.account) {
        return (
            <Card title="Edit / Withdraw">
                <TextAlign.Center>
                    <ConnectWalletButton size="lg" />
                </TextAlign.Center>
            </Card>
        )
    }
    if(step === "initial"){
        return (
            <Card title="Edit / Withdraw">
                <FormGroup label="Enter the pancakeswap pair address youd like to lock liquidity for">
                    <Input onChange={onChangeAddress} value={address} />
                    <TextAlign.Center>
                        <Form.Text>e.g {config.PAIR_TOKEN}</Form.Text>
                    </TextAlign.Center>
                </FormGroup>
                {loading ? <TextAlign.Center><Loader /></TextAlign.Center> : pair ? <PairBanner pair={pair} onContinue={onContinue} /> : null}
            </Card>
        )
    }

    return (
        <Card title="Withdraw liquidity" onBack={onBack}>
            <PairLabel pair={pair} center />
            <UserLocks pair={pair} />
        </Card>
    )
}

export default EditLock;