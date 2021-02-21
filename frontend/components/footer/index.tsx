import React from 'react';
import styled from 'styled-components';


const Footer = () => {
    return (
        <StyledFooter>
        </StyledFooter>
    )
}

export default Footer;

const StyledFooter = styled.footer`
    width: 100%;
    height: 100px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: ${(props) => props.theme.colors.white};
    
    img {
        margin-left: 0.5rem;
    }
    
    a {
        display: flex;
        justify-content: center;
        align-items: center;
    }
`