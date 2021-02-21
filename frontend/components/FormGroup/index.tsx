import React from 'react';
import { Form,  } from 'react-bootstrap';
import styled from 'styled-components';

interface IFormGroup {
    label?: string;
}

const FormGroup: React.FC<IFormGroup> = ({label, children}) => {
    return (
        <StyledFormGroup>
            {label && <Form.Label>{label}</Form.Label>}
            {children}
        </StyledFormGroup>
    )
}

export default FormGroup;

const StyledFormGroup = styled(Form.Group)`
    margin-top: 20px;
    margin-bottom: 20px;

    .form-label {
        color: #445070;
        margin-bottom: 10px;
        display: block;
    }

    .form-text {
        display: inline-block;
        margin-top: 10px;
        opacity: 0.7;
    }
`;