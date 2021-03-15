const moment = require('moment');

const createPeriod = (number, cron, startHour, startMinute, endHour, endMinute) => {
  return {
    number,
    cron,
    startTime: {
      hour: startHour,
      minute: startMinute
    },
    endTime: {
      hour: endHour,
      minute: endMinute
    }
  };
};

exports.periods = [
  createPeriod(1, '1 50 7 * * *', 7, 50, 8, 50),
  createPeriod(2, '1 50 8 * * *', 8, 50, 9, 40),
  createPeriod(3, '1 40 9 * * *', 9, 40, 10, 30),
  createPeriod(4, '1 30 10 * * *', 10, 30, 11, 25),
  createPeriod(5, '1 25 11 * * *', 11, 25, 12, 15),
  createPeriod(6, '1 15 12 * * *', 12, 15, 13, 5),
  createPeriod(7, '1 11 13 * * *', 13, 6, 14, 5),
  createPeriod(8, '1 5 14 * * *', 14, 5, 14, 55),
  createPeriod(9, '1 55 14 * * *', 14, 55, 15, 45),
  createPeriod(10, '1 46 15 * * *', 15, 46, 16, 40),
  createPeriod(11, '1 40 16 * * *', 16, 40, 17, 30),
  createPeriod(12, '1 30 17 * * *', 17, 30, 18, 20)
];

exports.getCurrentPeriod = () => {
  const currentTime = moment();
  const currentPeriod = this.periods.find(period => {
    const start = moment().set({
      'hour': period.startTime.hour,
      'minute':period.startTime.minute,
      'second': 0
    });
    const end = moment().set({
      'hour': period.endTime.hour,
      'minute':period.endTime.minute,
      'second': 0
    });
    const isAfterStart = currentTime.isAfter(start);
    const isBeforeEnd = currentTime.isBefore(end);
    return isAfterStart && isBeforeEnd;
  });
  return currentPeriod ? currentPeriod.number : null;
};