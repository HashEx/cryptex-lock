import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import web3 from 'web3'

import { isAddress } from '../../utils/helpers'

const BAD_IMAGES = {}

const Inline = styled.div`
  display: flex;
  align-items: center;
  align-self: center;
`

const Image: any = styled.img`
  width: ${({ size }: any) => size};
  height: ${({ size }: any) => size};
  background-color: white;
  border-radius: 50%;
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
`;

export default function TokenLogo({ address, header = false, size = '24px', ...rest }) {
  const [error, setError] = useState(false)

  address = web3.utils.toChecksumAddress(address);

  useEffect(() => {
    setError(false)
  }, [address])

  if (error || BAD_IMAGES[address]) {
    return (
      <Inline>
        <span {...rest} style={{ fontSize: size }} role="img" aria-label="face">
          🤔
        </span>
      </Inline>
    )
  }


  const path = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/assets/${isAddress(
    address
  )}/logo.png`;

  return (
    <Inline>
      <Image
        {...rest}
        alt={''}
        src={path}
        size={size}
        onError={(event) => {
            BAD_IMAGES[address] = true
            setError(true)
            event.preventDefault()
        }}
      />
    </Inline>
  )
}
