import React from 'react';
import styled from 'styled-components';

const Main: React.FC = ({children}) => {
    return (
        <StyledMain>
            {children}
        </StyledMain>
    )
}

export default Main;

const StyledMain = styled.main`
    padding: 25px 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    width: 100%;
`;