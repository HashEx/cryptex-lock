import React from 'react';
import styled from 'styled-components';
import Link from 'next/link'

import ConnectWalletButton from '../connectWalletButton';
import Logo from '../Logo';

const Header = () => {
    return (
        <StyledHeader>
            <div>
                <Logo /> (BSC TESTNET)
            </div>
            <Menu>
                <Link href="/">
                    <a>Pairs</a>
                </Link>
            </Menu>
            <div>
                <ConnectWalletButton />
            </div>
        </StyledHeader>
    )
}

export default Header;

const StyledHeader = styled.header`
    width: 100%;
    padding: 10px 20px;
    text-align: center;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    background-color: #fff;
`;

const Menu = styled.div`
    display: flex;
    align-items: center;
`;