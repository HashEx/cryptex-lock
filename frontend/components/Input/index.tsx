import React from 'react';
import styled from 'styled-components';

import * as config from '../../config';

interface IInput {
    value: string;
    onChange?: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
    type?: string;
}

const Input: React.FC<IInput> = ({ type = "text", value, onChange, disabled, placeholder }) => {
    const handleChagne = (e: React.SyntheticEvent<HTMLInputElement>) => {
        const value = (e.target as HTMLInputElement).value;
        if(onChange) onChange(value);
    }
    return (
        <StyledInputWrapper>
            <input
                type={type}
                value={value}
                onChange={handleChagne}
                placeholder={placeholder}
                className="form-control"
                disabled={disabled}
            />
        </StyledInputWrapper>
    )
}

export default Input;


export const StyledInputWrapper = styled.div`
    position: relative;

    .form-control{
        padding: 12px 20px;
        width: 100%;
        background: #f5f7f9;
        border: 1px solid #f5f7f9;
        border-radius: 25px;
        height: auto;
        box-shadow: none;
        color: #000;
        font-size: 1rem;
        font-weight: 400;
        line-height: 1.5;

        &:focus {
            outline: none;
            border-color: ${props => props.theme.colors.primary};
        }
    }

    .form-control::-webkit-input-placeholder,
    .form-control::-moz-placeholder,
    .form-control:-ms-input-placeholder,
    .form-control::-ms-input-placeholder,
    .form-control::placeholder{
        color: #000;
    }
`;