import DateTime, { DatetimepickerProps } from "react-datetime";
import moment from "moment";

import { StyledInputWrapper } from '../Input';

const valid = current => {
    return moment().subtract(1, "day").isBefore(current);
};

export interface IDateTimeInputProps extends DatetimepickerProps {

}

const DateTimeInput: React.FC<IDateTimeInputProps> = (props) => {
    const onChange = (value) => {
        props.onChange(value);
    }
    return (
        <StyledInputWrapper>
            <DateTime
                {...props}
                value={props.value}
                onChange={onChange}
                initialViewMode="time"
                isValidDate={valid}
                closeOnSelect
            />
        </StyledInputWrapper>
    )
}

export default DateTimeInput;