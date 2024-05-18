const REFERRAL_REPORT = 'referral_for_care';
const FACILITY_FEEDBACK_REPORT = 'client_visit';
const VISIT_REMINDER = 'referral_visit_reminder';

/**
 * create task for CHIPS agent to follow up with client after referral
 * and ensure that client has visited facility
 * 
 * Automatically resolved if client has visited facility or if client has
 * another referral after this one.
 */

module.exports = {
  name: 'visit-reminder',
  title: 'Visit reminder',
  icon: 'icon-visit-reminder',
  appliesTo: 'reports',
  appliesToType: [VISIT_REMINDER, FACILITY_FEEDBACK_REPORT, REFERRAL_REPORT],
  appliesIf: (c, r) => {
    if (c.contact.muted) return false;
    if (user.contact_type !== 'chw') return false;

    const form = r.fields.form;
    switch (r.form) {
      case REFERRAL_REPORT:
        return Boolean(form.visit_due_date);
      case VISIT_REMINDER:
        return Boolean(form.new_date);
      default: {
        const na = form.appointments ? form.appointments.new_date : form.next_appointment;
        return Boolean(na);
      }
    }
  },
  resolvedIf: function (contact, report) {
    const newerReport = Utils.getMostRecentReport(contact.reports, [REFERRAL_REPORT, VISIT_REMINDER, FACILITY_FEEDBACK_REPORT]);
    if (newerReport._id === report._id) return false;
    return newerReport.reported_date - report.reported_date;
  },
  actions: [{
    form: 'referral_visit_reminder',
    label: 'Referral visit reminder',
    modifyContent: (ctx, contact, report) => {
      ctx.reminder_source_id = report._id;
      ctx.reminder_source_type = report.form;
      switch (report.form) {
        case REFERRAL_REPORT:
          ctx.reminder_source_type = report.fields.form.referral_reasons;
          break;
        case FACILITY_FEEDBACK_REPORT:
          ctx.reminder_source_type = 'Facility feedback';
          break;
        default:
          ctx.reminder_source_type = 'Visit reminder';
      }
    }
  }],
  events: [{
    dueDate: (event, contact, report) => {
      if (report.form === VISIT_REMINDER) {
        if (report.fields.form.new_date) {
          return new Date(report.fields.form.new_date);
        }
        return new Date(report.reported_date);
      }
      if (report.form === FACILITY_FEEDBACK_REPORT) {
        let form = report.fields.form;
        const na = form.appointments ? form.appointments.new_date : form.next_appointment;
        return na;
      }
      return new Date(report.fields.form.visit_due_date);
    },
    start: 3,
    end: 0,
  }],
  priority: (contact, report) => {
    if (report.form === REFERRAL_REPORT) {
      return {
        label: report.fields.form.referral_reasons.toUpperCase()
      };
    } else if (report.form === FACILITY_FEEDBACK_REPORT) {
      return {
        label: report.fields.form.tracks.toUpperCase()
      };
    }
  }
};