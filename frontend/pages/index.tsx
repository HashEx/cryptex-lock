import React from 'react';

import Header from '../components/header';
import Footer from '../components/footer';
import Container from '../components/container';
import Main from '../components/main';

import PairsSection from '../sections/PairsSection'

export default function Pairs() {
  return (
    <Container>
      <Header />
      <Main>
        <PairsSection />
      </Main>
      <Footer />
    </Container>
  )
}
