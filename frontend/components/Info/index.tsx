import React from 'react';
import styled from 'styled-components';
import { SpaceBetweenRow } from '../Row';

interface IInfoItem {
    label: string;
    value: any;
}

export const InfoItem: React.FC<{label: string}> = ({label, children}) => {
    return (
        <InfoItemStyled>
            <Label>{label}</Label>
            <Value>{children}</Value>
        </InfoItemStyled>
    )
}

const Info: React.FC<{items: IInfoItem[]}> = ({items}) => {
    return (
        <React.Fragment>
            {items.map((item) => <InfoItem label={item.label}>{item.value}</InfoItem>)}
        </React.Fragment>
    )
}

export default Info;

const Label = styled.div`

`;

const Value = styled.div`

`;


const InfoItemStyled = styled(SpaceBetweenRow)`
    margin: 10px auto;
`;