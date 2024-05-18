function isPastAppointments(report) {
  const form = report.fields.form;
  if (!form.next_appointment) return false;
  return (form && form.next_appointment && (new Date(form.next_appointment) < Utils.now()));
}
module.exports = {
  name: 'defaulter',
  title: 'Defaulter',
  icon: 'icon-healthcare-warning',
  appliesTo: 'reports',
  appliesToType: ['client_visit', 'referral_for_care', 'referral_visit_reminder'],
  appliesIf: (contact, report) => {
    if (contact.contact.muted) return false;
    switch (report.form) {
      case 'client_visit':
        return isPastAppointments(report);
      case 'referral_for_care':
        return (report.fields.form.visit_due_date && new Date(report.fields.form.visit_due_date) < Utils.now());
      case 'referral_visit_reminder':
        return (report.fields.form.reminder_feedback === 'not_visiting');
      default:
        return false;
    }
  },
  resolvedIf: (contact, report, event, dueDate) => {
    const newerSameReport = Utils.isFormSubmittedInWindow(
      contact.reports,
      report.form,
      Utils.addDate(dueDate, event.start).getTime(),
      Utils.addDate(dueDate, event.end + 1).getTime()
    );
    const newerOtherReports = Utils.getMostRecentReport(
      contact.reports,
      ['referral_for_care', 'client_visit', 'referral_visit_reminder', 'tracing']
    );
    return newerSameReport || (newerOtherReports.reported_date > report.reported_date);
  },
  actions: [{
    form: 'tracing',
    label: 'Defaulter',
  }],
  priority: {
    level: 'high',
  },
  events: [{
    dueDate: (event, contact, report) => {
      switch (report.form) {
        case 'client_visit':
          return new Date(report.fields.form.next_appointment);
        case 'referral_for_care':
          return new Date(report.fields.form.visit_due_date);
        case 'referral_visit_reminder':
          return new Date(report.reported_date);
        default:
          return report.reported_date;
      }
    },
    start: 0,
    end: 90,
  }],
};