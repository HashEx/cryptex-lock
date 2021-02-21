import React from 'react';
import styled from 'styled-components';
import { Tab, Tabs, Nav } from 'react-bootstrap';
import { lighten } from 'polished';

import Section from '../../components/section';
import Card from '../../components/Card';
import EditLock from '../../components/EditLock';
import LockForm from '../../components/LockForm';

const LockerSection = () => {
    return (
        <LockerSectionStyled>
            <Section>
                <Tab.Container id="locker-tabs" defaultActiveKey="lock" mountOnEnter>
                    <Card noPadding>
                        <StyledNav>
                            <Nav.Item>
                                <Nav.Link eventKey="lock">New lock</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="edit">Edit / Withdraw</Nav.Link>
                            </Nav.Item>
                        </StyledNav>
                    </Card>
                    <Tab.Content>
                        <Tab.Pane eventKey="lock">
                            <LockForm />
                        </Tab.Pane>
                        <Tab.Pane eventKey="edit">
                            <EditLock />
                        </Tab.Pane>
                    </Tab.Content>
                </Tab.Container>
            </Section>
        </LockerSectionStyled>
    )
}

export default LockerSection;


const LockerSectionStyled = styled.div`
    max-width: 700px;
    width: 100%;
    margin: 0 auto;

    
`;

const StyledNav = styled(Nav)`
    display: flex;
    .nav-link {
        display: inline-block;
        padding: 20px;
        font-size: 16px;
        font-weight: 600;

        &:hover {
            background-color: ${props => lighten(0.75, "#333")};
        }

        &.active {
            color: ${props => props.theme.colors.primary};
            &:hover {
                background-color: ${props => lighten(0.55, props.theme.colors.primary)};
            }
        }
    }
`;