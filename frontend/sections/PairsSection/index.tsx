import React, { useState } from 'react';
import styled from 'styled-components';

import Card from '../../components/Card';
import Input from '../../components/Input';
import Section from '../../components/section';
import Button from '../../components/button';
import { Form } from 'react-bootstrap';
import FormGroup from '../../components/FormGroup';
import PairsList from '../../components/PairsList';
import TextAlign from '../../components/Text/TextAlign';
import Link from 'next/link';

const TextCenter = styled.div`
    text-align: center;
`;

const PairsSection = () => {
    const [pair, setPair] = useState<string>('');
    const [onlyLocked, setOnlyLocked] = useState<boolean>(false);
    const onPairChange = (value: string) => {
        setPair(value);
    }
    const onToggleOnlyLocked = () => {
        setOnlyLocked(!onlyLocked);
    }
    const filter = {
        address: pair,
        locked: onlyLocked
    };
    return (
        <StyledPairSection>
            <Section>
                <Card title="Locked pairs">
                    <FormGroup>
                        <TextCenter>
                            <Link href="/locker">
                                <Button>
                                    Lock liquidity
                                </Button>
                            </Link>
                        </TextCenter>
                    </FormGroup>
                    <FormGroup>
                        <Input placeholder="Pair address" onChange={onPairChange} value={pair} />
                    </FormGroup>
                    <FormGroup>
                        <TextAlign.Right>
                            <Button onClick={onToggleOnlyLocked}>
                                {onlyLocked ? "Show all" : "Show only locked"}
                            </Button>
                        </TextAlign.Right>
                    </FormGroup>
                    <PairsList filter={filter} />
                </Card>
            </Section>
        </StyledPairSection>
    )
}

export default PairsSection;


const StyledPairSection = styled.div`
    max-width: 700px;
    width: 100%;
    margin: 0 auto;
`;