import React from 'react';

import Header from '../components/header';
import Footer from '../components/footer';
import Container from '../components/container';
import Main from '../components/main';

import LockerSection from '../sections/LockerSection'

export default function Pairs() {
  return (
    <Container>
      <Header />
      <Main>
        <LockerSection />
      </Main>
      <Footer />
    </Container>
  )
}
