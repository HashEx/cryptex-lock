import React from 'react';
import styled from 'styled-components';

import { StyledInputWrapper } from '../Input'

interface IAmountInput {
    value: string;
    onChange?: (value: string) => void;
    max?: string;
    currency: string;
    disabled?: boolean;
}

const AmountInput: React.FC<IAmountInput> = ({ value, onChange, currency, max, disabled }) => {
    const handleChagne = (e: React.SyntheticEvent<HTMLInputElement>) => {
        const value = (e.target as HTMLInputElement).value;
        const formattedValue = value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
        if(onChange) onChange(formattedValue);
    }
    const maxNumber = parseFloat(max || '0.0');
    const onSetMax = () => {
        if(max && maxNumber > 0 && !disabled) {
            onChange(max);
        }
    }
    
    return (
        <StyledWrapper>
            <input
                type="text"
                value={value}
                onChange={handleChagne}
                placeholder="0.0000"
                className="form-control"
                disabled={disabled}
            />
            <InputCurrency>{currency}</InputCurrency>
            {(maxNumber > 0) && <InputMax onClick={onSetMax}>Max</InputMax>}
        </StyledWrapper>
    )
}

export default AmountInput;

const StyledWrapper = styled(StyledInputWrapper)`
    .form-control {
        padding: 12px 120px 12px 20px;
        text-align: left;
    }
`;

const InputCurrency = styled.span`
    width: 45px;
    height: 35px;
    line-height: 35px;
    text-align: center;
    color: #333;
    font-size: 10px;
    font-weight: 500;
    background: #f5f7f9;
    border-radius: 6px;
    position: absolute;
    top: 7px;
    right: 10px;
    display: block;
`;

const InputMax = styled.span`
    width: 35px;
    height: 35px;
    line-height: 35px;
    text-align: center;
    color: #000;
    font-size: 12px;
    font-weight: 600;
    background: #f5f7f9;
    border-radius: 6px;
    position: absolute;
    top: 7px;
    right: 60px;
    display: block;

    &:hover {
        cursor: pointer;
    }
`;