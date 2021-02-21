import React from 'react';
import styled from 'styled-components';

const Container: React.FC = ({children}) => {
    return (
        <StyledContainer>
            {children}
        </StyledContainer>
    )
}

export default Container;

const StyledContainer = styled.div`
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`;