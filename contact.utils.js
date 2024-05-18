const moment = require('moment');

const immunizationSchedule = [
  {
    ageRange: [0, 6],
    vaccines: ['BCG', 'OPV_0', 'HepB_0']
  },
  {
    ageRange: [6, 10],
    vaccines: ['OPV_1', 'Penta_1', 'PCV_1', 'Rota_1', 'IPV_1']
  },
  {
    ageRange: [10, 14],
    vaccines: ['OPV_2', 'Penta_2', 'PCV_2', 'Rota_2']
  },
  {
    ageRange: [14, 24],
    vaccines: ['OPV_3', 'Penta_3', 'Rota_3', 'IPV_2']
  },
  {
    ageRange: [24, 36],
    vaccines: ['VitaminA_1']
  },
  {
    ageRange: [36, 48],
    vaccines: ['Measles_1', 'YF', 'meningitis']
  },
  {
    ageRange: [48, 60],
    vaccines: ['VitaminA_2'],
  },
  {
    ageRange: [60, 72],
    vaccines: ['Measles_2']
  },
  {
    ageRange: [432, 444],
    vaccines: ['HPV']
  }
];

function getCurrentAgeInWeeks(contact) {
  if (!(contact.age_weeks || contact.age_months || contact.age_years)) {
    throw new Error('Contact age was not properly captured. Please edit contact and save again.');
  }
  const ageAtRegistration = moment(contact.reported_date);

  if (contact.age_years) {
    ageAtRegistration.subtract(Number(contact.age_years), 'years');
  }
  if (contact.age_months) {
    ageAtRegistration.subtract(Number(contact.age_months), 'months');
  }
  if (contact.age_weeks) {
    ageAtRegistration.subtract(Number(contact.age_weeks), 'weeks');
  }

  return moment().diff(ageAtRegistration, 'weeks');
}

function getEstimatedCurrentAge(contact) {
  if (!(contact.age_weeks || contact.age_months || contact.age_years)) {
    throw new Error('Contact age was not properly captured. Please edit contact and save again.');
  }
  const ageAtRegistration = moment(contact.reported_date);

  if (contact.age_years) {
    ageAtRegistration.subtract(Number(contact.age_years), 'years');
  }
  if (contact.age_months) {
    ageAtRegistration.subtract(Number(contact.age_months), 'months');
  }
  if (contact.age_weeks) {
    ageAtRegistration.subtract(Number(contact.age_weeks), 'weeks');
  }
  return ageAtRegistration.fromNow(true);
}

/**
 * 
 * @param {*} contact 
 * @param {*} reports 
 * @returns {
 *  ageInWeeks,
 *  getEstimatedCurrentAge,
 *  getNextAppointment,
 *  getVaccinationHistory,
 *  getVaccinesMissed,
 *  getVaccinationSchedule
 * }
 */
function ContactProfile(contact, reports) {
  const ageEstimate = getEstimatedCurrentAge(contact);
  const ageInWeeks = getCurrentAgeInWeeks(contact);

  const getVaccinationReports = () => {
    return reports.filter(function (report) {
      const tracks = report.fields.form.tracks || report.fields.form.start_track;
      return (report.form === 'client_visit' && tracks.includes('immunization'));
    })
      .sort(function (a, b) {
        return a.reported_date > b.reported_date;
      });
  };
  const vaccinationStage = () => {
    const index = immunizationSchedule.findIndex(function (schedule) {
      return schedule.ageRange[0] <= ageInWeeks && ageInWeeks < schedule.ageRange[1];
    });
    if (index === -1) {
      const lastSchedule = immunizationSchedule[immunizationSchedule.length - 1];
      if (ageInWeeks <= lastSchedule.ageRange[0]) {
        return immunizationSchedule.length - 2;
      }
      return immunizationSchedule.length - 1;
    }
    return index;
  };
  const getVaccinesDueAtAge = () => {
    const stageInSchedule = vaccinationStage();
    const vaccinesTaken = getVaccinesTaken();
    let vaccinesDue = [];
    for (let i = 0; i <= stageInSchedule; i++) {
      vaccinesDue = vaccinesDue.concat(immunizationSchedule[i].vaccines);
    }
    return vaccinesDue.filter(function (vaccine) {
      return !vaccinesTaken.includes(vaccine);
    });
  };
  const getVaccinesTaken = () => {
    const vaccinationReports = getVaccinationReports();
    let vaccinesTaken = [];
    vaccinationReports.forEach(function (report) {
      const vacAdministered = report.fields.form.immunization.vaccines_administered.split(' ');
      vaccinesTaken = vaccinesTaken.concat(vacAdministered);
    });
    return vaccinesTaken;
  };
  const getVaccinesMissed = () => {
    const vaccinesTaken = getVaccinesTaken();
    const vaccinesDue = getVaccinesDueAtAge(ageInWeeks);
    return vaccinesDue.filter(function (vaccine) {
      return !vaccinesTaken.includes(vaccine);
    });
  };

  const getVaccinationHistory = () => {
    const vaccinationReports = getVaccinationReports();
    return vaccinationReports.map(function (report) {
      return {
        date: report.reported_date,
        vaccines: report.fields.form.immunization.vaccines_administered
      };
    });
  };

  const _getAppointmentDateFromReport = (report) => {
    console.log(report);
    switch (report.form) {
      case 'client_visit':
        if (report.fields.form.appointments) {
          if (report.fields.form.appointments.has_next_appointment) {
            return report.fields.form.appointments.new_date;
          }
        }
        break;
      case 'referral_for_care':
        return report.fields.form.visit_due_date;
      case 'referral_visit_reminder':
        return report.fields.form.new_date;
      default:
        return null;  // no appointment date
    }
  };

  function getNextAppointment() {
    const appointmentSchedulingReports = ['client_visit', 'referral_for_care', 'referral_visit_reminder'];
    const appointments = reports.filter(function (report) {
      return appointmentSchedulingReports.includes(report.form);
    })
      .sort(function (a, b) {
        return b.reported_date - a.reported_date;
      })
      .map(_getAppointmentDateFromReport);

    return appointments[0];
  }

  const getVaccinationSchedule = (stage = 0) => {
    let stageTofind = vaccinationStage();
    if (stage) {
      stageTofind += stage;
    }
    if (stageTofind > immunizationSchedule.length - 1) {
      return {
        ageRange: [0, 0],
        vaccines: []
      };
    }
    const schedule = immunizationSchedule[stageTofind];
    const vaccinesTaken = getVaccinesTaken();
    const vacsToTake = schedule.vaccines.filter(function (vaccine) {
      return !vaccinesTaken.includes(vaccine);
    });
    return { ageRange: schedule.ageRange, vaccines: vacsToTake };
  };

  return {
    ageInWeeks,
    getEstimatedCurrentAge: () => ageEstimate,
    getNextAppointment,
    getVaccinationHistory,
    getVaccinesMissed,
    getVaccinationSchedule,
    getVaccinesTaken
  };
}

module.exports = {
  ContactProfile
};
