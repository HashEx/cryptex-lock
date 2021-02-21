import React, { useCallback, useEffect, useState } from 'react';
import { useWallet } from 'use-wallet';
import { BsArrowRight, BsArrowClockwise, BsPerson, BsPlusCircle, BsShuffle } from 'react-icons/bs';
import { Row, Col, Form } from 'react-bootstrap';
import moment from 'moment';

import { Pair } from '../../interfaces/Pair';
import { Lock } from '../../interfaces/Lock';
import { usePancakeswapLocker } from '../../providers/PancakeswapLockerProvider';
import Card from '../Card';
import Loader from '../Loader';
import TextAlign from '../Text/TextAlign';
import DateLabel from '../DateLabel';
import { roundTo } from '../../utils/helpers';
import styled from 'styled-components';
import pancakeswapService from '../../services/api/pancakeswapService';
import AmountInput from '../AmountInput';
import Button from '../button';
import FormGroup from '../FormGroup';
import Input from '../Input';
import DateTimeInput from '../DateTimeInput';
import TokenContract from '../../utils/pancake-swap-lock/TokenContract';
import PancakeswapLocker from '../../utils/pancake-swap-lock';

enum LockAction {
    "WITHDRAW" = "WITHDRAW",
    "RELOCK" = "RELOCK",
    "INCEREMENT" = "INCEREMENT",
    "TRANSFER" = "TRANSFER",
}

const actionConfig = {
    [LockAction.WITHDRAW]: {
        title: "Withdraw",
        icon: BsArrowRight,
    },
    [LockAction.RELOCK]: {
        title: "Relock",
        icon: BsArrowClockwise,
    },
    [LockAction.INCEREMENT]: {
        title: "Increment",
        icon: BsPlusCircle,
    },
    [LockAction.TRANSFER]: {
        title: "Transfer ownership",
        icon: BsPerson,
    },
}

interface ActionIconProps {action: LockAction, onClick: (action: LockAction) => void;}

const ActionIcon: React.FC<ActionIconProps> = ({action, onClick}) => {
    const [loading, setLoading] = useState<boolean>(false);
    const config = actionConfig[action];
    const Icon = config.icon;
    const handleClick = async () => {
        setLoading(true);
        try {
            await onClick(action);
            setLoading(false);
        } catch(e) {
            setLoading(false);
            throw e;    
        }
    }
    if(loading) return <Loader />;
    return (
        <Icon className="action-icon" onClick={handleClick} size={20} title={config.title} />
    )
}

const ActionsStyled = styled.div`
    text-align: right;
    
    .action-icon {
        margin: 0 5px;

        &:hover {
            cursor: pointer;
        }
    }
`;

interface UserLockItemActionsProps {
    actions: LockAction[],
    onClick: (action: LockAction) => void
}

const UserLockItemActions: React.FC<UserLockItemActionsProps> = ({actions, onClick}) => {
    return (
        <ActionsStyled>
            {actions.map((action, index) => <ActionIcon action={action} onClick={onClick} />)}
        </ActionsStyled>
    )
}


interface ActionFormProps {
    token: string;
    action: LockAction,
    lock: Lock,
    onSubmit: (form: any) => void
    onCancel?: () => void;
}

const ActionFormFooter = ({onCancel, loading, onSubmit, disabledSubmit}) => {
    return (
        <Row>
            {onCancel && (
                <Col>
                    <Button block onClick={onCancel}>Cancel</Button>
                </Col>
            )}
            <Col>
                <Button block onClick={onSubmit} loading={loading} disabled={disabledSubmit}>
                    Submit
                </Button>
            </Col>
        </Row>
    )
}

const ActionForm: React.FC<ActionFormProps> = ({token, action, lock, onSubmit, onCancel}) => {
    const pancakeswapLocker = usePancakeswapLocker();
    const wallet = useWallet();
    const [form, setForm] = useState<any>({});
    const [loading, setLoading] = useState<boolean>(false);
    const [max, setMax] = useState<string>("0");
    const fetchMaxTokenBalance = async (token: string, address: string) => {
        const balance = await pancakeswapLocker.getTokenBalanceOf(token, wallet.account);
        setMax(balance);
    }
    useEffect(() => {
        fetchMaxTokenBalance(token, wallet.account);
    }, [token, wallet.account])
    const onChange = (name: string) => (value: any) => {
        setForm({
            ...form,
            [name]: value
        })
    }
    const handleSubmit = async () => {
        await setLoading(true);
        try {
            await onSubmit(form);
            setLoading(false);
            setForm({})
        } catch(e) {
            setLoading(false);
        }
    }
    if(action === LockAction.WITHDRAW) {
        const disabled = !(form.amount > 0)
        return (
            <div>
                <FormGroup label="Withdraw amount">
                    <AmountInput max={lock.amount} onChange={onChange("amount")} value={form.amount} currency="LP Token" />
                </FormGroup>
                <ActionFormFooter
                    loading={loading}
                    onCancel={onCancel}
                    onSubmit={handleSubmit}
                    disabledSubmit={disabled}
                />
            </div>
        )
    } else if(action === LockAction.TRANSFER) {
        const disabled = !form.newOwner;
        return (
            <div>
                <FormGroup label="Transfer ownership to">
                    <Input
                        onChange={onChange("newOwner")}
                        value={form.newOwner}
                    />  
                </FormGroup>
                <ActionFormFooter
                    loading={loading}
                    onCancel={onCancel}
                    onSubmit={handleSubmit}
                    disabledSubmit={disabled}
                />
            </div>
        )
    } else if(action === LockAction.RELOCK) {
        const newUnlockDate = form.newUnlockDate ? parseInt(moment(form.newUnlockDate).format("x")) : 0;
        const disabled = lock.unlockDate > newUnlockDate;
        return (
            <div>
                <FormGroup label="Current unlock date">
                    <DateLabel value={lock.unlockDate} />
                </FormGroup>
                <FormGroup label="New unlock date">
                    <DateTimeInput
                        onChange={onChange("newUnlockDate")}
                        value={form.newUnlockDate}
                    />  
                </FormGroup>
                <ActionFormFooter
                    loading={loading}
                    onCancel={onCancel}
                    onSubmit={handleSubmit}
                    disabledSubmit={disabled}
                />
            </div>
        )
    } else if(action === LockAction.INCEREMENT) {
        const disabled = !(form.amount > 0)
        return (
            <div>
                <FormGroup label="Increment amount">
                    <AmountInput max={max} onChange={onChange("amount")} value={form.amount} currency="LP Token" />
                </FormGroup>
                <ActionFormFooter
                    loading={loading}
                    onCancel={onCancel}
                    onSubmit={handleSubmit}
                    disabledSubmit={disabled}
                />
            </div>
        )
    }
    return (
        <div />
    )
}

interface UserLockItemProps {
    lock: Lock;
    totalSupply: number;
    token: string;
    onAction: (action: LockAction, value: any) => void;
}

const UserLockItem: React.FC<UserLockItemProps> = ({lock, totalSupply, token, onAction}) => {
    const [selectedAction, setSelectedAction] = useState<LockAction | null>(null);
    const wallet = useWallet();
    const percent = roundTo(parseFloat(lock.amount) / totalSupply * 100, 2);
    const isUnlocked = lock.unlockDate * 1000 < Date.now();
    const actions = [
        LockAction.RELOCK,
        LockAction.INCEREMENT,
        LockAction.TRANSFER,
    ];
    if(isUnlocked) {
        actions.unshift(LockAction.WITHDRAW);
    }
    const onSelectAction = (action: LockAction) => setSelectedAction(action);
    const onSubmit = (value: any) => onAction(selectedAction, value);
    const onReset = () => setSelectedAction(null);
    return (
        <Card>
            <Row>
                <Col>
                    <div>{percent}% LOCKED</div>
                    <div>{lock.amount} LP Tokens</div>
                    <div>
                        {isUnlocked ? "Unlocked" : (
                            <React.Fragment>
                                Will unlock at <DateLabel value={lock.unlockDate} />
                            </React.Fragment>
                        )}
                    </div>
                </Col>
                <Col>
                    <UserLockItemActions actions={actions} onClick={onSelectAction} />
                </Col>
            </Row>
            <Row>
                {selectedAction && <ActionForm token={token} lock={lock} action={selectedAction} onSubmit={onSubmit} onCancel={onReset} />}
            </Row>
        </Card>
    )
}

const useUserLocks = (pair: string) => {
    const wallet = useWallet();
    const pancakeswapLocker = usePancakeswapLocker();
    const [loading, setLoading] = useState<boolean>(false);
    const [locks, setLocks] = useState<any[]>([]);
    const fetch = async (address: string, token: string) => {
        setLoading(true);
        try {
            const userLocks = await pancakeswapLocker.getUserLocksForToken(address, token);
            setLocks(userLocks);
        } catch(e) {
            console.error(e);
        }
        setLoading(false);
    }
    const onAction = useCallback((lock: Lock) => async (action: LockAction, value: any) => {
        switch(action){
            case LockAction.WITHDRAW: {
                await pancakeswapLocker.unlock(pair, lock.index, lock.lockId, value.amount, wallet.account);
                await fetch(wallet.account, pair);
                break;
            }
            case LockAction.TRANSFER: {
                await pancakeswapLocker.transferOwnership(pair, lock.index, lock.lockId, value.newOwner, wallet.account);
                await fetch(wallet.account, pair);
                break;
            }
            case LockAction.RELOCK: {
                const newUnlockDate = parseInt(value.newUnlockDate.format("X"));
                await pancakeswapLocker.relock(pair, lock.index, lock.lockId, newUnlockDate, wallet.account);
                await fetch(wallet.account, pair);
                break;
            }
            case LockAction.INCEREMENT: {
                await pancakeswapLocker.incrementLock(pair, lock.index, lock.lockId, value.amount, wallet.account);
                await fetch(wallet.account, pair);
                break;
            }
            default: break;
        }
    }, [wallet.account, pair]);
    useEffect(() => {
        fetch(wallet.account, pair);
    }, [wallet.account, pair])
    return {
        locks, loading, fetch,
        onAction
    }
}

const UserLocks: React.FC<{pair: Pair}> = ({pair}) => {
    const wallet = useWallet();
    const { locks, loading, onAction } = useUserLocks(pair.id);
    if(loading) return <TextAlign.Center><Loader size="lg" /></TextAlign.Center>
    return (
        <div>
            {locks.map((lock, index) => (
                <UserLockItem
                    onAction={onAction(lock)}
                    lock={lock}
                    key={index}
                    totalSupply={pair.liquidity}
                    token={pair.id}
                />
            ))}
        </div>
    )
}

export default UserLocks;