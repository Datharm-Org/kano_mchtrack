const {
  ContactProfile
} = require('./contact.utils');

const getImmunizationCards = require('./contact-cards/immunization-cards');
let cards = [];
const context = {};

const fields = [
  { appliesToType: 'person', label: 'file N0', value: contact.file_no, width: 4 },
  { appliesToType: 'person', label: 'Enrollment Date', value: contact.reported_date, width: 4, filter: 'date' },
  { appliesToType: ['person', 'household'], label: 'Phone Number', value: contact.phone, width: 4, filter: 'phone' },
  { appliesToType: 'person', label: 'contact.gender', value: contact.gender, width: 4 },
  { appliesToType: 'person', label: 'contact.person_type', value: contact.woman_or_child, width: 4 },
];
if (contact.is_zero_dose) {
  fields.push({ appliesToType: 'person', label: 'Is Zero Dose Child', value: contact.is_zero_dose, width: 4 });
}
fields.push({ appliesToType: 'household', label: 'contact.household_number', value: contact.age, width: 4 });

if (contact.contact_type === 'person') {
  const contactProfile = new ContactProfile(contact, reports);
  let nextAppointment = contactProfile.getNextAppointment();
  fields.push({
    appliesToType: 'person',
    label: 'contact.age_estimate',
    value: 'contact.estimated_age_val',
    context: {
      age: contactProfile.getEstimatedCurrentAge(),
    },
    width: 4,
    translate: true,
  });

  fields.push({ appliesToType: 'person', label: 'contact.next_appointment_date', value: nextAppointment, width: 6, filter: 'date' });

  cards.push({
    label: 'contact.profile.pregnancy',
    appliesToType: 'report',
    appliesIf: function (report) {
      const tracks = report.fields.form.tracks || report.fields.form.start_track;
      return (report.form === 'client_visit' && tracks.includes('anc'));
    },
    fields: [
      { label: 'contact.profile.edd', value: function (report) { return report.fields.form.anc.edd; }, filter: 'relativeDay', width: 12 },
      { label: 'contact.profile.visit', value: 'contact.profile.visits.of', translate: true, context: { count: 2, total: 4, }, width: 6, },
      { label: 'contact.profile.risk.title', value: 'high', translate: true, width: 5, icon: 'icon-healthcare-warning', },
    ]
  });

  if (contact.woman_or_child === 'child') {
    const immunizationCards = getImmunizationCards(contactProfile);
    const vaccinesTaken = contactProfile.getVaccinesTaken().join(', ');
    const next_immunizations = contactProfile.getVaccinationSchedule();
    const vac_after_next = contactProfile.getVaccinationSchedule(1);

    context.next_immunizations = next_immunizations.vaccines.join(', ');
    context.next_appointment = nextAppointment;
    context.vaccines_taken = vaccinesTaken;
    context.vac_after_next = vac_after_next.vaccines.join(', ');
    cards = cards.concat(immunizationCards);
  }
}

fields.push({ appliesToType: '!person', appliesIf: function () { return contact.parent && lineage[0]; }, label: 'contact.parent', value: lineage, filter: 'lineage' });
fields.push({ appliesToType: 'person', label: 'contact.parent', value: lineage, filter: 'lineage' });
context.client_type = contact.client_type || contact.woman_or_child;

module.exports = {
  fields,
  cards,
  context,
};