import React, { useEffect, useState, useCallback } from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import { useWallet } from 'use-wallet';
import styled from 'styled-components';

import * as config from '../../config';

import pancakeswapService from '../../services/api/pancakeswapService';
import AmountInput from '../AmountInput';
import Button from '../button';

import Card from '../Card';
import ConnectWalletButton from '../connectWalletButton';
import FormGroup from '../FormGroup';
import Input from '../Input';
import Loader from '../Loader';
import PairLabel from '../PairLabel';
import TextAlign from '../Text/TextAlign';
import { usePancakeswapLocker } from '../../providers/PancakeswapLockerProvider';
import { useRouter } from 'next/router';
import DateTimeInput from '../DateTimeInput';
import moment from 'moment';
import { useLockSteps } from '../../hooks';
import PairBanner from '../PairBanner';




const useLockForm = (token: string) => {
    const wallet = useWallet();
    const pancakeswapLocker = usePancakeswapLocker();
    const [form, setForm] = useState<any>({
        amount: "0.0",
        unlockDate: moment().add(10, "minutes"),
    });
    const [isApproved, setApproved] = useState<boolean>(false);
    const [isApproving, setIsApproving] = useState<boolean>(false);
    const [isLocking, setIsLocking] = useState<boolean>(false);
    const [tokenBalance, setTokenBalance] = useState<string>("0");
    const [fees, setFees] = useState<any>({});

    const resetForm = () => {
        setForm({
            amount: "0",
            unlockDate: null
        });
    }

    const onApprove = useCallback(async () => {
        setIsApproving(true);
        try {
            await pancakeswapLocker.approve(token, wallet.account);
            setApproved(true);
            resetForm();
        } catch(e) {
            console.error(e);
        }
        setIsApproving(false);
    }, [token, form.amount, wallet.account])

    

    const onLock = useCallback(async () => {
        setIsLocking(true);
        try {
            const unlockDate = parseInt(form.unlockDate.format("X"));
            await pancakeswapLocker.lock(token, form.amount, unlockDate, wallet.account, fees.ethFee);
            resetForm();
        } catch(e) {
            console.error("Locking error", e);
        }
        setIsLocking(false);
    }, [token, form.amount, wallet.account, fees.ethFee]);

    const onChange = (name: string) => (value: any) => {
        setForm({
            ...form,
            [name]: value
        });
    }

    const fetchFees = async () => {
        if(!fees.ethFee){
            const newFees = await pancakeswapLocker.getFees();
            if(newFees.ethFee) setFees(newFees);
        }
    }

    const fetchIsApproved = async (token: string, account: string) => {
        const isApproved: boolean = await pancakeswapService.isApproved(token, account);
        setApproved(isApproved);
    };

    const fetchBalance = async (token: string, account: string) => {
        const balance: string = await pancakeswapService.fetchTokenBalance(token, account);
        setTokenBalance(balance);
    }

    useEffect(() => {
        fetchIsApproved(token, wallet.account);
        fetchBalance(token, wallet.account);
    }, [token, wallet.account]);

    useEffect(() => {
        fetchFees();
    }, [pancakeswapLocker]);

    return {
        onChange,
        onApprove,
        onLock,
        fees,
        form,
        isApproved,
        isApproving,
        isLocking,
        tokenBalance
    }
}

const lockForInvestorsText = "Use the locker to prove to investors you have locked uniswap liquidity. If you are not a token developer, this section is almost definitely not for you.";

const LockForm = () => {
    const wallet = useWallet();
    const router = useRouter();
    const queryAddress = router.query.address as string;
    
    const { address, onChangeAddress, loading, pair, onContinue, onBack, step } = useLockSteps();
    useEffect(() => {
        onChangeAddress(queryAddress);
    }, [queryAddress])

    const { form, onChange, isApproving, isApproved, isLocking, onApprove, onLock, tokenBalance, fees } = useLockForm(pair?.id);

    if(!wallet.account) {
        return (
            <Card title="New lock">
                <p>{lockForInvestorsText}</p>
                <TextAlign.Center>
                    <ConnectWalletButton size="lg" />
                </TextAlign.Center>
            </Card>
        )
    }
    if(step === "initial"){
        return (
            <Card title="New lock">
                <p>{lockForInvestorsText}</p>
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

    const isLockDisabled = !(form.amount > 0) || !isApproved || !fees.ethFee;

    return (
        <Card title="Lock liquidity" onBack={onBack}>
            <TextAlign.Center>
                <PairLabel pair={pair} center />
            </TextAlign.Center>
            <FormGroup label="Lock how many LP tokens?">
                <AmountInput value={form.amount} max={tokenBalance} currency="CAKE-LP" onChange={onChange("amount")} />
            </FormGroup>
            <FormGroup label="Unlock Date">
                <DateTimeInput value={form.unlockDate} onChange={onChange("unlockDate")} />
            </FormGroup>
            <FormGroup label="Fees options">
                <AmountInput disabled value={fees.ethFee} currency="BNB" />
            </FormGroup>
            <CaptionText>
                Once tokens are locked they cannot be withdrawn under any circumstances until the timer has expired. Please ensure the parameters are correct, as they are final.
            </CaptionText>
            <Row>
                <Col>
                    <Button block disabled={isApproved} onClick={onApprove} loading={isApproving}>
                        Approve
                    </Button>
                </Col>
                <Col>
                    <Button block disabled={isLockDisabled} onClick={onLock} loading={isLocking}>
                        Lock
                    </Button>
                </Col>
            </Row>
        </Card>
    )
    
}

export default LockForm;


const CaptionText = styled(TextAlign.Center)`
    padding-left: 20px;
    padding-right: 20px;
    margin-top: 20px;
    margin-bottom: 20px;
    color: #777;
    font-size: 14px;
`;