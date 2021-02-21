import React from 'react';
import { Card as BSCard } from 'react-bootstrap';
import styled from 'styled-components';
import { BiArrowBack } from 'react-icons/bi';

import Loader from '../Loader';
import TextAlign from '../Text/TextAlign';

interface ICardProps {
    title?: any;
    style?: any;
    loading?: boolean;
    noPadding?: boolean;

    onBack?: () => void;
    onClick?: () => void;
}

const StyledBackButton = styled.div`
    display: flex;
    align-items: center;
    position: absolute;
    top: 20px;
    left: 20px;

    &:hover {
        cursor: pointer;
    }
`;

const BackButton: React.FC<{onClick: () => void}> = ({onClick}) => {
    return (
        <StyledBackButton onClick={onClick}>
            <BiArrowBack size={25} />
        </StyledBackButton>
    )
}

const Card: React.FC<ICardProps> = ({title, children, loading, onBack, ...props}) => {
    return (
        <StyledCard {...props}>
            {onBack && <BackButton onClick={onBack} />}
            {title ? <CardTitle>{title}</CardTitle> : null}
            {loading ? <TextAlign.Center><Loader size="lg" /></TextAlign.Center> : children}
        </StyledCard>
    )
}

export default Card;


const StyledCard = styled(BSCard)`
    position: relative;
    padding: ${props => props.noPadding ? '0px' : '20px'};
    background: #fff;
    border-radius: 10px;
    margin: 0 0 10px;
    color: #000;
    box-shadow: 0 5px 10px rgba(218,225,233,.5);
`;

const CardTitle = styled.div`
    color: #000;
    font-size: 30px;
    margin-bottom: 25px;
    text-align: center;
    font-weight: bold;
`;