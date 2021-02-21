import React from 'react';
import styled from 'styled-components';
import { Pair } from '../../interfaces/Pair';

import TokenLogo from '../TokenLogo';

interface IPairLabelProps {
    pair: Pair;
    center?: boolean;
}

const PairLabel: React.FC<IPairLabelProps> = ({pair, center}) => {
    const base = pair.token0.symbol;
    const quote = pair.token1.symbol;
    const title = `${base} / ${quote}`;
    const size = "22px";
    return (
        <PairItemTitle center={center}>
            <TokenLogo address={pair.token0.id} size={size} />
            <strong>{title}</strong>
            <TokenLogo address={pair.token1.id} size={size} />
        </PairItemTitle>
    )
}

export default PairLabel;


const PairItemTitle: any = styled.div`
    display: flex;
    justify-content: ${(props: any) => props.center ? 'center' : 'flex-start'};
    align-items: center;
    margin-bottom: 10px;

    strong {
        display: inline-block;
        margin: 0 10px;
        font-size: 20px;
    }
`;