import moment from 'moment-timezone';

const IANA_TIMEZONE_DATA = moment.tz.names();

// Aliases for common time zones
const ALIASES = {
  PST: 'America/Los_Angeles',
  MST: 'America/Denver',
  CST: 'America/Chicago',
  EST: 'America/New_York',
  GMT: 'Etc/GMT',
  BST: 'Europe/London',
  CET: 'Europe/Paris',
  IST: 'Asia/Kolkata',
  JST: 'Asia/Tokyo',
};

export const buildTimeZoneOptions = () => {
  const options = IANA_TIMEZONE_DATA.map((tz) => ({
    value: tz,
    label: `${tz} - (UTC${moment().tz(tz).format('Z')})`,
  }));

  // Add aliases
  for (const alias in ALIASES) {
    options.push({
      value: ALIASES[alias as keyof typeof ALIASES],
      label: `${alias} - ${displayForIana(ALIASES[alias as keyof typeof ALIASES])}`,
    });
  }

  return options;
};

export const displayForIana = (iana: string) => {
  return moment().tz(iana).format('z');
};