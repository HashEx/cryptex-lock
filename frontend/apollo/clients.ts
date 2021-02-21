import { ApolloClient, InMemoryCache } from '@apollo/client';


export const cakeswapClient = new ApolloClient({
    uri: 'https://api.bscgraph.org/subgraphs/name/cakeswap',
    cache: new InMemoryCache()
})