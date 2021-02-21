import React from 'react';
import styled from 'styled-components';

const SectionHeader: React.FC<{title: string}> = ({title}) => {
    return (
        <StyledSectionHeader>
            <StyledSectionTitle>{title}</StyledSectionTitle>
        </StyledSectionHeader>
    )
}

const Section: React.FC<{title?: string}> = ({children, title}) => {
    return (
        <StyledSection>
            {title && <SectionHeader title={title} />}
            {children}
        </StyledSection>
    )
}

export default Section;

const StyledSection = styled.section`
    padding: 20px 0;
    width: 100%;
    max-width: 1024px;
`;

const StyledSectionHeader = styled.div`
    text-align: center;
    margin-bottom: 20px;
`;

const StyledSectionTitle = styled.h2`
    color: ${props => props.theme.colors.white};
    font-size: 30px;
`;