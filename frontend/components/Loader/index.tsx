import React from 'react';
import styled, { keyframes } from 'styled-components';


interface ILoaderProps {
    size?: "sm" | "md" | "lg"
}

const sizeValues = {
    "sm": 10,
    "md": 20,
    "lg": 40
};

const Loader: React.FC<ILoaderProps> = ({size = "md"}) => {
    const sizeValue = sizeValues[size];
    return <StyledLoader size={sizeValue} />;
}

export default Loader;

const loaderSpin = keyframes`{
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}`;

const StyledLoader: any = styled.div`
    border-radius: 50%;
    border: 2px solid ${(props: any) => props.theme.colors.primary};
    border-left-color: transparent;
    display: inline-block;
    animation: ${loaderSpin} 1s infinite;

    height: ${(props: any) => props.size}px;
    width: ${(props: any) => props.size}px;
`;
