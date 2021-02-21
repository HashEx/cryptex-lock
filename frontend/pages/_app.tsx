import Head from 'next/head';
import { createGlobalStyle, ThemeProvider } from 'styled-components';

import "react-datetime/css/react-datetime.css";

import DAppProvider from '../providers/DAppProvider';

import '../styles/bootstrap-grid.css';

const GlobalStyle = createGlobalStyle`
  html,
  body {
    padding: 0;
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
      Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
    background-color: #f2f7fb;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  * {
    box-sizing: border-box;
  }

  .tab-content {
    & > .tab-pane {
      display: none;
    }
    & > .active {
      display: block;
    }
  }
`;

const theme = {
  colors: {
    dark: '#070a0e',
    white: '#fff',
    primary: '#0088c9',
  }
}

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>CryptEx - Pancakeswap Liquidity Provider Tokens Locker</title>
        <link rel="icon" href="/favicon.png" type="image/png" />
      </Head>
      <GlobalStyle />
      <DAppProvider>
        <ThemeProvider theme={theme}>
          <Component {...pageProps} />
        </ThemeProvider>
      </DAppProvider>
    </>
  )
}

export default MyApp
