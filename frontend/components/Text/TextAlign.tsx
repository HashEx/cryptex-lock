import React from 'react';
import styled from 'styled-components';

const Left = styled.div`
    text-align: left;
`

const Center = styled.div`
    text-align: center;
`;

const Right = styled.div`
    text-align: right;
`;

interface SubComponents {
    Left: React.FC;
    Center: React.FC;
    Right: React.FC;
  }

type align = "left" | "center" | "right"

interface ITextAlignProps {
    align: align
}

const TextAlign: React.FC<ITextAlignProps> & SubComponents = ({align, children}) => {
    const Wrapper = align === "center" ? Center : align === "right" ? Right : Left;
    return (
        <Wrapper>
            {children}
        </Wrapper>
    )
};

TextAlign.Left = Left;
TextAlign.Center = Center;
TextAlign.Right = Right;

export default TextAlign;