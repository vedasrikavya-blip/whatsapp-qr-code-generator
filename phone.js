function invalidResult(error, country = '') {
  return {
    valid: false,
    country,
    countryCallingCode: '',
    nationalNumber: '',
    formattedNational: '',
    internationalDigits: '',
    e164: '',
    error
  };
}

function getLibrary(phoneLibrary) {
  return phoneLibrary ?? globalThis.libphonenumber;
}

function toResult(parsed, fallbackCountry = '') {
  if (!parsed || !parsed.isPossible() || !parsed.isValid()) {
    return invalidResult('Enter a valid phone number for the selected country.', fallbackCountry);
  }

  const e164 = parsed.number;
  return {
    valid: true,
    country: parsed.country || fallbackCountry,
    countryCallingCode: String(parsed.countryCallingCode || ''),
    nationalNumber: String(parsed.nationalNumber || ''),
    formattedNational: parsed.formatNational(),
    internationalDigits: e164.replace(/\D/g, ''),
    e164,
    error: ''
  };
}

export function parseUserPhone(input, country, phoneLibrary) {
  const digits = String(input ?? '').replace(/\D/g, '');
  if (!digits) {
    return invalidResult('Enter a WhatsApp phone number.', country);
  }
  if (digits.length < 4) {
    return invalidResult('This phone number appears too short.', country);
  }

  const library = getLibrary(phoneLibrary);
  if (!library?.parsePhoneNumberFromString) {
    return invalidResult('Phone number validation is not available yet. Please try again.', country);
  }

  try {
    const raw = String(input ?? '').trim();
    const parsed = raw.startsWith('+')
      ? library.parsePhoneNumberFromString(`+${digits}`)
      : library.parsePhoneNumberFromString(digits, country);
    return toResult(parsed, country);
  } catch {
    return invalidResult('Enter a valid phone number for the selected country.', country);
  }
}

export function parseInternationalPhone(phoneDigits, phoneLibrary) {
  const digits = String(phoneDigits ?? '').replace(/\D/g, '');
  if (!digits) return invalidResult('The shared link does not include a phone number.');

  const library = getLibrary(phoneLibrary);
  if (!library?.parsePhoneNumberFromString) {
    return invalidResult('Phone number validation is not available yet.');
  }

  try {
    const parsed = library.parsePhoneNumberFromString(`+${digits}`);
    return toResult(parsed, parsed?.country || '');
  } catch {
    return invalidResult('The shared phone number is not valid.');
  }
}
