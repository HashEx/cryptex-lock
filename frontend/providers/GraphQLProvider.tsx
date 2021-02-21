import React from 'react';
import { ApolloProvider } from '@apollo/client';

import { cakeswapClient } from '../apollo/clients';

const GQLProvider: React.FC = ({children}) => {
    return (
        <ApolloProvider client={cakeswapClient}>
            {children}
        </ApolloProvider>
    )
}

export default GQLProvider;