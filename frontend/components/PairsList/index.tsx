import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { Row, Col } from 'react-bootstrap';
import { useRouter } from 'next/router';
import { BsLock } from 'react-icons/bs';

import { BaseService } from '../../services/api/baseService';
import pairsService, { PairsService } from '../../services/api/pairsService';

import Card from '../Card';
import Loader from '../Loader';
import PairLabel from '../PairLabel';
import { FadeLabel, PrimaryLabel } from '../Label';
import TextAlign from '../Text/TextAlign';
import { formattedNum } from '../../utils/helpers';
import Link from 'next/link';

const PairItemStyled = styled(Card)`
    &:hover {
        cursor: pointer;
        box-shadow: 0 5px 10px rgba(218,225,233,.75);
    }
`;

const PairItem = ({pair}) => {
    const router = useRouter();
    const onPairClick = () => {
        router.push({
            pathname: '/pair/[id]',
            query: { id: pair.id },
        })
    };
    return (
        <PairItemStyled onClick={onPairClick}>
            <Row>
                <Col>
                    <PairLabel pair={pair} />
                    <div>
                        <FadeLabel>Liquidity:</FadeLabel>
                        <PrimaryLabel>{formattedNum(pair.liquidity)} LP Tokens</PrimaryLabel>
                    </div>
                </Col>
                <Col>
                    {pair.lockedAmount > 0 ? (
                        <LockedValue>
                            {formattedNum(pair.lockedAmount)} LP Tokens {" "} <BsLock size={26} />
                        </LockedValue>
                    ) : (
                        <TextAlign.Right>
                            <FadeLabel>There is no locked liquidity on CryptEx for this pair.</FadeLabel>
                        </TextAlign.Right>
                    )}
                </Col>
            </Row>
        </PairItemStyled>
    )
}

const LockedValue = styled(PrimaryLabel)`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    color: ${props => props.theme.colors.primary};
    font-size: 20px;
    svg {
        margin-left: 10px;
    }
`;

function useService<T = BaseService>(service: any) {
    const [loading, setLoading] = useState<boolean>(false);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<any>(null);
    const fetch = async () => {
        setError(null);
        setLoading(true);
        try {
            const data = await service.get();
            setData(data);
        } catch(e) {
            setError(e);
        }
        setLoading(false);
    }

    useEffect(() => {
        fetch();
    }, [service])

    return {
        loading,
        data,
        fetch
    }
}

interface IPairListProps {
    filter?: {
        address?: string;
        locked?: boolean;
    }
}

const PairsList: React.FC<IPairListProps> = ({filter}) => {
    const {loading, data, fetch} = useService<PairsService>(pairsService);

    if(loading) return <TextAlign.Center><Loader size="lg" /></TextAlign.Center>;
    const filteredRows = (data?.rows || []).filter(row => {
        if(!filter) return true;
        if(filter.address) {
            return row.id === filter.address;
        }else if(filter.locked) {
            return row.lockedAmount > 0;
        }
        return true;
    })
    if(!filteredRows.length) {
        return (
            <TextAlign.Center>
                <PrimaryLabel>Pair not found</PrimaryLabel>
            </TextAlign.Center>
        )
    }
    return (
        <PairListStyled>
            {filteredRows.map((pair, index) => <PairItem key={index} pair={pair} />)}
        </PairListStyled>
    )
}

export default PairsList;

const PairListStyled = styled.div`

`;