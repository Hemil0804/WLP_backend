const moment = require('moment');

const setCurrentTimestamp = () => moment().format('x');

const addTimeToCurrentTimestamp = (number, unit) => moment().add(number, unit).format('x');

const getDateAndTimeFromTimestamp = (timestamp, format) => moment(timestamp, 'x').format(format);

const getTimestamp = (time, format) => moment(time, format).format('x');

const startOfToday = (format, unit) => moment().startOf(unit).format(format);
const endOfToday = (format, unit) => moment().endOf(unit).format(format);

const getStartOfDate = (time, format) => moment(time, format).startOf('d').format(format);
const getEndOfDate = (time, format) => moment(time, format).endOf('d').format(format);

const getStartOf = (unit, format) => moment().startOf(unit).format(format);
const getEndOf = (unit, format) => moment().endOf(unit).format(format);

const addTimeToTimestamp = (timestamp, unit, number) => moment(timestamp, "x").add(number, unit).format('x');

const getDiffBetweenToDates = (startDate, endDate, durationAs = 'seconds') => {
    let dateDiff = moment.duration(moment(endDate, 'x').diff(moment(startDate, 'x')), durationAs);
    return Math.round(dateDiff);
}

module.exports = {
    setCurrentTimestamp,
    addTimeToCurrentTimestamp,
    startOfToday,
    endOfToday,
    getStartOfDate,
    getEndOfDate,
    getDateAndTimeFromTimestamp,
    getTimestamp,
    getStartOf,
    getEndOf,
    addTimeToTimestamp,
    getDiffBetweenToDates
};