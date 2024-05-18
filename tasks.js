const followupTask = require('./tasks/follow-up.task');
const visitReminderTask = require('./tasks/visit_reminder.task');
const defaulterTask = require('./tasks/defaulter.task');

module.exports = [
  followupTask,
  visitReminderTask,
  defaulterTask
];