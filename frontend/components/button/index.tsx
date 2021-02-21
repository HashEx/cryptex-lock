import React from 'react';
import styled from 'styled-components';
import { Button as BSButton, ButtonProps } from 'react-bootstrap';
import { lighten } from 'polished';

import Loader from '../Loader';

export interface IButtonProps extends ButtonProps {
    loading?: boolean;
    block?: boolean;
    disabled?: boolean;
}

const Button: React.FC<IButtonProps> = ({children, loading, ...props}) => {
    const disabled = props.disabled || loading;
    return (
        <StyledButton {...props} disabled={disabled}>
            <strong>
                {loading ? <Loader size="sm" /> : children}
            </strong>
        </StyledButton>
    )
}

export default Button;

const StyledButton = styled(BSButton)`
    padding: ${props => props.block ? '15px' : '10px 15px'};
    border-radius: 25px;
    color: #fff;
    font-size: 12px;
    text-align: center;
    font-weight: 500;
    position: relative;
    display: inline-block;
    margin: 5px;
    transition: .4s linear;
    border: none;
    white-space: nowrap;
    border: 1px solid ${props => props.theme.colors.primary};
    background-color: ${props => props.theme.colors.primary};

    width: ${props => props.block ? '100%' : 'auto'};


    &.unactive,
    &[disabled] {
        opacity: 0.5;
        pointer-events: none;
        cursor: not-allowed;
        background-color: #fff;
        color: ${props => props.theme.colors.primary};
    }

    &:focus {
        outline: none;
    }

    &:hover {
        cursor: pointer;
        background-color: #fff;
        color: ${props => props.theme.colors.primary};
    }
`;