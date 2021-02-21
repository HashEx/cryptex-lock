import React from 'react';

import Header from '../../components/header';
import Footer from '../../components/footer';
import Container from '../../components/container';
import Main from '../../components/main';

import PairSection from '../../sections/PairSection'

export default function Pair() {
  return (
    <Container>
      <Header />
      <Main>
        <PairSection />
      </Main>
      <Footer />
    </Container>
  )
}
