import React from 'react';
import moment from 'moment';

interface IDateLabel {
    value: number | string;
    format?: string;
}

const DateLabel: React.FC<IDateLabel> = ({value, format = "MM/DD/YYYY HH:mm"}) => {
    if(typeof value === "string") value = parseInt(value);
    value = value * 1000;
    return <span>{moment(value).format(format)}</span>
}

export default DateLabel;