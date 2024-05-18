module.exports = function getImmunizationCards(contactProfile) {
  const canViewMedicalHistory = cht.v1.hasPermissions('can_view_medical_histrory');
  const cards = [];

  let previousImmunizations;

  previousImmunizations = contactProfile.getVaccinationHistory();
  let historyentries = [];
  const currentSchedule = contactProfile.getVaccinationSchedule();
  const nextSchedule = contactProfile.getVaccinationSchedule(1);

  if (previousImmunizations.length) {
    historyentries = previousImmunizations.map(function (history) {
      return {
        label: function () {
          return 'Immunized on ' + new Date(history.date).toLocaleString('en-us', { month: 'short', year: 'numeric', day: 'numeric' });
        },
        value: history.vaccines,
        width: 6
      };
    });
  }

  if (canViewMedicalHistory) {
    cards.push({
      label: 'Vaccination History',
      appliesToType: 'person',
      fields: historyentries,
      translate: true
    });

    const missedVacs = contactProfile.getVaccinesMissed();
    if (missedVacs.length) {
      cards.push({
        label: 'Missed Vaccines',
        appliesToType: 'person',
        fields: [
          {
            label: '',
            value: contactProfile.getVaccinesMissed().join(', '),
            width: 12,
            icon: 'icon-healthcare-warning',
          }
        ]
      });
    }
  }
  cards.push({
    label: 'Immunization Schedule',
    appliesToType: 'person',
    fields: [
      {
        label: 'contact.immunization_schedule_current',
        value: currentSchedule.vaccines.length ? currentSchedule.vaccines.join(', ') : 'Completed',
        width: 6
      },
      {
        label: 'contact.immunization_schedule_next',
        value: nextSchedule.vaccines.length ? nextSchedule.vaccines.join(', ') : 'Completed',
        width: 6
      }
    ],
    translate: true
  });

  return cards;
};

