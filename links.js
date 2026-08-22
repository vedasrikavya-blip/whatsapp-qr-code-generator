export function normalizePhoneDigits(value) {
  return String(value ?? '').replace(/\D/g, '');
}

export function createWhatsAppUrl(phoneDigits, message = '') {
  const normalizedPhone = normalizePhoneDigits(phoneDigits);
  if (!normalizedPhone) {
    throw new Error('A valid WhatsApp phone number is required.');
  }

  const url = new URL(`https://wa.me/${normalizedPhone}`);
  const normalizedMessage = String(message ?? '').trim();
  if (normalizedMessage) {
    url.searchParams.set('text', normalizedMessage);
  }
  return url.toString();
}

export function createShareUrl(baseUrl, phoneDigits, message = '') {
  const normalizedPhone = normalizePhoneDigits(phoneDigits);
  if (!normalizedPhone) {
    throw new Error('A valid phone number is required to create a share link.');
  }

  const url = new URL(baseUrl);
  url.search = '';
  url.hash = '';

  const params = new URLSearchParams();
  params.set('phone', normalizedPhone);
  const normalizedMessage = String(message ?? '').trim();
  if (normalizedMessage) {
    params.set('text', normalizedMessage);
  }

  return `${url.toString()}#${params.toString()}`;
}

export function parseShareState(hash) {
  const rawHash = String(hash ?? '').replace(/^#/, '');
  if (!rawHash) return null;

  const params = new URLSearchParams(rawHash);
  const phone = normalizePhoneDigits(params.get('phone'));
  if (!phone) return null;

  return {
    phone,
    message: params.get('text') ?? ''
  };
}
