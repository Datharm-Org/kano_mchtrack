const ACTION_FORM = 'client_visit';
const REFERRAL_REPORT = 'referral_for_care';
module.exports = {
  name: 'assessment-after-registration',
  title: 'Scheduled Facility Visit',
  icon: 'icon-healthcare-diagnosis',
  appliesTo: 'reports',
  appliesToType: [ACTION_FORM, 'referral_for_care'],
  appliesIf: (c, r) => {
    if (c.contact.muted) return false;
    if (user.contact_type !== 'nurse') return false;
    if (r.form === ACTION_FORM) {
      const na = r.fields.form.appointments ? r.fields.form.appointments.new_date : r.fields.form.next_appointment;
      return Boolean(na);
    }
    return r.fields.form.visit_due_date ? true : false;
  },
  resolvedIf: (c, r) => {
    const newerReport = Utils.getMostRecentReport(c.reports, [ACTION_FORM, REFERRAL_REPORT]);
    if (newerReport._id === r._id) return false;
    return newerReport.reported_date > r.reported_date;
  },
  actions: [{
    form: ACTION_FORM,
    label: 'Follow up after facility visit',
  }],
  events: [{
    dueDate: (event, contact, report) => {
      if (report.form === ACTION_FORM) {
        return new Date(report.fields.form.appointments ? report.fields.form.appointments.new_date : report.fields.form.next_appointment);
      }
      return new Date(report.fields.form.visit_due_date);
    },
    start: 2,
    end: 200,
  }],
  priority: (contact, report) => {
    if (report.form === REFERRAL_REPORT) {
      return {
        label: report.fields.form.referral_reasons.toUpperCase()
      };
    } else if (report.form === ACTION_FORM) {
      return {
        label: report.fields.form.tracks.toUpperCase()
      };
    }
  }
};