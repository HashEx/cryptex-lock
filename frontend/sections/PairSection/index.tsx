import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/router'
import { lighten } from 'polished'
import Link from 'next/link';
import { Form } from 'react-bootstrap';
import { BsLock } from 'react-icons/bs';
import { FiLink } from 'react-icons/fi';

import Card from '../../components/Card';
import Input from '../../components/Input';
import Section from '../../components/section';
import Button from '../../components/button';
import FormGroup from '../../components/FormGroup';
import PairsList from '../../components/PairsList';
import TextAlign from '../../components/Text/TextAlign';
import PairLabel from '../../components/PairLabel';
import pancakeswapService from '../../services/api/pancakeswapService';
import { Pair } from '../../interfaces/Pair';
import { roundTo } from '../../utils/helpers';
import { info } from 'console';
import { InfoItem } from '../../components/Info';
import { SpaceBetweenRow } from '../../components/Row';
import { FadeLabel } from '../../components/Label';
import DateLabel from '../../components/DateLabel';


const Links: React.FC<{pair: Pair}> = ({pair}) => {
    const links = [{
        url: 'https://bscscan.com/address',
        title: 'BSCScan'
    },{
        url: 'https://pancakeswap.info/token',
        title: 'Pancakeswap'
    }];

    return (
        <ExplorerLinks>
            {links.map((link, index) => (
                <ExplorerLink href={`${link.url}/${pair.id}`} target="_blank" key={index}>
                    {link.title} <FiLink size={10} />
                </ExplorerLink>        
            ))}
        </ExplorerLinks>
    )
}

const LockedBanner: React.FC<{pair: Pair}> = ({pair}) => {
    if(!pair.lockedAmount) {
        return (
            <EmptyLockedWrapper>
                There is no locked liquidity.
            </EmptyLockedWrapper>
        )
    }
    const lockedPercent = roundTo(pair.lockedAmount / pair.liquidity * 100, 2);
    return (
        <div>
            <LockedWrapper>
                <span>{lockedPercent}% LOCKED</span><BsLock size={40} />
            </LockedWrapper>
            <InfoItem label="Total LP tokens">
                {roundTo(pair.liquidity, 4)}
            </InfoItem>
            <InfoItem label="Total locked LP tokens">
                {roundTo(pair.lockedAmount, 4)}
            </InfoItem>
        </div>
    )
}

const LockedWrapper = styled.div`
    margin: 20px auto;
    padding: 15px 30px;
    border-radius: 20px;
    ${(props: any) => {
        const { primary } = props.theme.colors;
        const lightPrimary = lighten(0.2, primary);
        return `background: linear-gradient(to right, ${lightPrimary}, ${primary});`;
    }}
    color: #fff;
    font-size: 26px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    span {
        margin-left: 10px;
    }
`;

const EmptyLockedWrapper = styled(LockedWrapper)`
    background-color: ${props => lighten(0.2, '#f00')};
`;

const LockItem: React.FC<{lock: any}> = ({lock}) => {
    return (
        <LockItemStyled>
            <div>{lock.amount} LP Tokens</div>
            <div><DateLabel value={lock.unlockDate} /></div>
        </LockItemStyled>
    )
}

const Locks: React.FC<{locks: any[]}> = ({locks}) => {
    const filteredLocks = locks.filter(lock => parseFloat(lock.amount) > 0);
    if(!filteredLocks.length) return null;
    return (
        <LocksStyled>
            <LocksHeader>
                <FadeLabel>Value</FadeLabel>
                <FadeLabel>Unlock date</FadeLabel>
            </LocksHeader>
            {filteredLocks.map((lock, index) => <LockItem key={index} lock={lock} />)}
        </LocksStyled>
    )
}

const LocksStyled = styled.div`
    margin: 20px auto;
`;

const LocksHeader = styled(SpaceBetweenRow)`
    font-size: 12px;
    margin-bottom: 10px;
`;

const LockItemStyled = styled(SpaceBetweenRow)``;



const PairsSection = () => {
    const router = useRouter();
    const pairId: string = router.query.id as string;
    const [pair, setPair] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const fetchPair = async (pairId: string) => {
        setLoading(true);
        try {
            const pair = await pancakeswapService.findPair(pairId)
            setPair(pair);
        } catch(e) {
            console.error(e);
        }
        setLoading(false);
    }
    useEffect(() => {
        fetchPair(pairId);
    }, [pairId])
    const onBack = () => {
        router.back();
    }
    const onLockClick = () => {
        router.push(`/locker?address=${pairId}`);
    };
    return (
        <StyledPairSection>
            <Section>
                <Card onBack={onBack} loading={loading}>
                    <LockButtonWrapper>
                        <Button onClick={onLockClick}>
                            Lock liquidity
                        </Button>
                    </LockButtonWrapper>
                    {pair && (
                        <React.Fragment>
                            <PairLabel center pair={pair} />
                            <PairName>{pair.token0.name} / {pair.token1.name}</PairName>
                            <PairAddress>
                                {pair.id}
                            </PairAddress>
                            <Links pair={pair} />
                            <LockedBanner pair={pair} />
                            <Locks locks={pair.locks} />
                        </React.Fragment>
                    )}
                </Card>
            </Section>
        </StyledPairSection>
    )
}

export default PairsSection;


const StyledPairSection = styled.div`
    max-width: 700px;
    width: 100%;
    margin: 0 auto;
`;

const LockButtonWrapper = styled.div`
    position: absolute;
    top: 10px;
    right: 10px;
`;

const PairName = styled.div`
    font-size: 12px;
    margin: 20px auto;  
    text-align: center;
`;

const PairAddress = styled.div`
    margin: 20px auto;
    text-align: center;
`;

const ExplorerLinks = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
`;

const ExplorerLink = styled.a`
    display: inline-block;
    padding: 10px 15px;
    border-radius: 20px;
    margin: 5px 15px;

    &:hover {
        background-color: #eaeaea;
    }
`;