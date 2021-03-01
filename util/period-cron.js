const createPeriodCron = (period, cron) => {
  return {
    period,
    cron
  };
};

module.exports = [
  createPeriodCron(1, '0 50 7 * * *'),
  createPeriodCron(2, '0 50 8 * * *'),
  createPeriodCron(3, '0 40 9 * * *'),
  createPeriodCron(4, '0 30 10 * * *'),
  createPeriodCron(5, '0 25 11 * * *'),
  createPeriodCron(6, '0 15 12 * * *'),
  createPeriodCron(7, '0 5 13 * * *'),
  createPeriodCron(8, '0 5 14 * * *'),
  createPeriodCron(9, '0 55 14 * * *'),
  createPeriodCron(10, '0 45 15 * * *'),
  createPeriodCron(11, '0 40 16 * * *'),
  createPeriodCron(12, '0 30 17 * * *')
];
