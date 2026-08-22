import { createShareUrl, createWhatsAppUrl, parseShareState } from './links.js';
import { parseInternationalPhone, parseUserPhone } from './phone.js';
import { createQrMatrix, drawMatrixToCanvas, matrixToSvg } from './qr.js';

const elements = {
  form: document.querySelector('#qr-form'),
  country: document.querySelector('#country'),
  phone: document.querySelector('#phone'),
  phoneError: document.querySelector('#phone-error'),
  message: document.querySelector('#message'),
  messageCount: document.querySelector('#message-count'),
  canvas: document.querySelector('#qr-canvas'),
  placeholder: document.querySelector('#qr-placeholder'),
  resultPhone: document.querySelector('#result-phone'),
  messagePreview: document.querySelector('#message-preview span'),
  resultError: document.querySelector('#result-error'),
  openWhatsApp: document.querySelector('#open-whatsapp'),
  downloadPng: document.querySelector('#download-png'),
  downloadSvg: document.querySelector('#download-svg'),
  copyLink: document.querySelector('#copy-link'),
  copyLabel: document.querySelector('#copy-link span'),
  copyStatus: document.querySelector('#copy-status'),
  foreground: document.querySelector('#foreground-color'),
  background: document.querySelector('#background-color'),
  resetColors: document.querySelector('#reset-colors'),
  contrastStatus: document.querySelector('#contrast-status'),
  year: document.querySelector('#copyright-year')
};

let current = null;
let updateTimer = 0;
let restoringHash = false;

function flagEmoji(countryCode) {
  return [...countryCode.toUpperCase()]
    .map(character => String.fromCodePoint(127397 + character.charCodeAt(0)))
    .join('');
}

function localeCountry() {
  const locales = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const locale of locales) {
    const match = locale?.match(/[-_]([A-Z]{2})$/i);
    if (match) return match[1].toUpperCase();
  }
  return 'SG';
}

function populateCountries() {
  const library = globalThis.libphonenumber;
  const countries = library?.getCountries?.() || ['SG', 'US', 'GB', 'AU', 'CA', 'IN', 'MY', 'ID', 'PH', 'CN', 'JP', 'KR'];
  const names = typeof Intl.DisplayNames === 'function'
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

  const items = countries.map(country => {
    let callingCode = '';
    try { callingCode = library?.getCountryCallingCode?.(country) || ''; } catch { callingCode = ''; }
    return {
      country,
      callingCode,
      name: names?.of(country) || country
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  const fragment = document.createDocumentFragment();
  for (const item of items) {
    const option = document.createElement('option');
    option.value = item.country;
    option.textContent = `${flagEmoji(item.country)}  ${item.name}${item.callingCode ? `  +${item.callingCode}` : ''}`;
    fragment.append(option);
  }
  elements.country.replaceChildren(fragment);
  elements.country.value = countries.includes(localeCountry()) ? localeCountry() : 'SG';
}

function setFieldError(message = '') {
  elements.phoneError.textContent = message;
  elements.phone.setAttribute('aria-invalid', message ? 'true' : 'false');
}

function setResultEnabled(enabled) {
  for (const button of [elements.downloadPng, elements.downloadSvg, elements.copyLink]) {
    button.disabled = !enabled;
  }
  elements.openWhatsApp.classList.toggle('is-disabled', !enabled);
  elements.openWhatsApp.setAttribute('aria-disabled', String(!enabled));
  elements.openWhatsApp.tabIndex = enabled ? 0 : -1;
  if (!enabled) elements.openWhatsApp.removeAttribute('href');
}

function showResultError(message = '') {
  elements.resultError.textContent = message;
}

function currentColors() {
  return {
    foreground: elements.foreground.value,
    background: elements.background.value
  };
}

function hexLuminance(hex) {
  const values = hex.replace('#', '').match(/.{2}/g)?.map(value => parseInt(value, 16) / 255) || [0, 0, 0];
  const linear = values.map(value => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(foreground, background) {
  const a = hexLuminance(foreground);
  const b = hexLuminance(background);
  const light = Math.max(a, b);
  const dark = Math.min(a, b);
  return (light + 0.05) / (dark + 0.05);
}

function updateContrastStatus() {
  const { foreground, background } = currentColors();
  const ratio = contrastRatio(foreground, background);
  const safe = ratio >= 4.5 && hexLuminance(foreground) < hexLuminance(background);
  elements.contrastStatus.textContent = safe
    ? `Contrast ratio ${ratio.toFixed(1)}:1 — suitable for scanning.`
    : `Contrast ratio ${ratio.toFixed(1)}:1 — use a darker foreground and lighter background.`;
  elements.contrastStatus.style.color = safe ? '#078844' : '#c4314b';
  return safe;
}

function renderMatrix(matrix) {
  const colors = currentColors();
  drawMatrixToCanvas(matrix, elements.canvas, { size: 1024, margin: 4, ...colors });
  elements.canvas.hidden = false;
  elements.placeholder.hidden = true;
  return matrixToSvg(matrix, { margin: 4, ...colors });
}

function generate({ focusError = true } = {}) {
  setFieldError('');
  showResultError('');

  const parsed = parseUserPhone(elements.phone.value, elements.country.value);
  if (!parsed.valid) {
    setFieldError(parsed.error);
    if (focusError) elements.phone.focus();
    return false;
  }

  const message = elements.message.value.trim();
  try {
    const whatsappUrl = createWhatsAppUrl(parsed.internationalDigits, message);
    const matrix = createQrMatrix(whatsappUrl);
    const svg = renderMatrix(matrix);

    current = { parsed, message, whatsappUrl, matrix, svg };
    elements.country.value = parsed.country || elements.country.value;
    elements.phone.value = parsed.formattedNational || parsed.nationalNumber;
    elements.resultPhone.textContent = parsed.e164;
    elements.messagePreview.textContent = message || 'No pre-filled message. The customer can type their own message.';
    elements.openWhatsApp.href = whatsappUrl;
    setResultEnabled(true);
    updateContrastStatus();
    return true;
  } catch (error) {
    current = null;
    setResultEnabled(false);
    showResultError(error instanceof Error ? error.message : 'Unable to generate the QR code.');
    return false;
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function qrFilename(extension) {
  const phone = current?.parsed?.internationalDigits || 'whatsapp';
  return `whatsapp-qr-${phone}.${extension}`;
}

async function copyText(value) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('Copy is not supported in this browser.');
}

async function handleCopyLink() {
  if (!current) return;
  const shareUrl = createShareUrl(window.location.href, current.parsed.internationalDigits, current.message);
  try {
    await copyText(shareUrl);
    elements.copyLabel.textContent = 'Copied';
    elements.copyStatus.textContent = 'Setup link copied. Opening it restores the phone number and message.';
    setTimeout(() => {
      elements.copyLabel.textContent = 'Copy Link';
      elements.copyStatus.textContent = 'Copies a link that restores this phone number and message.';
    }, 2200);
  } catch (error) {
    elements.copyStatus.textContent = error instanceof Error ? error.message : 'Unable to copy the link.';
  }
}

function restoreFromHash() {
  const state = parseShareState(window.location.hash);
  if (!state) return false;

  const parsed = parseInternationalPhone(state.phone);
  if (!parsed.valid) {
    showResultError(parsed.error);
    return false;
  }

  restoringHash = true;
  elements.country.value = parsed.country;
  elements.phone.value = parsed.formattedNational || parsed.nationalNumber;
  elements.message.value = state.message.slice(0, 500);
  elements.messageCount.textContent = `${elements.message.value.length} / 500`;
  const success = generate({ focusError: false });
  restoringHash = false;
  return success;
}

function scheduleLiveUpdate() {
  if (!current || restoringHash) return;
  clearTimeout(updateTimer);
  updateTimer = setTimeout(() => generate({ focusError: false }), 320);
}

elements.form.addEventListener('submit', event => {
  event.preventDefault();
  if (generate() && window.innerWidth < 760) {
    document.querySelector('#preview-heading').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

elements.message.addEventListener('input', () => {
  elements.messageCount.textContent = `${elements.message.value.length} / 500`;
  scheduleLiveUpdate();
});

elements.phone.addEventListener('input', scheduleLiveUpdate);
elements.country.addEventListener('change', scheduleLiveUpdate);
elements.phone.addEventListener('blur', () => {
  const parsed = parseUserPhone(elements.phone.value, elements.country.value);
  if (parsed.valid) {
    elements.country.value = parsed.country || elements.country.value;
    elements.phone.value = parsed.formattedNational || parsed.nationalNumber;
  }
});

elements.downloadPng.addEventListener('click', () => {
  if (!current) return;
  elements.canvas.toBlob(blob => {
    if (blob) downloadBlob(blob, qrFilename('png'));
  }, 'image/png');
});

elements.downloadSvg.addEventListener('click', () => {
  if (!current) return;
  const svg = matrixToSvg(current.matrix, { margin: 4, ...currentColors() });
  downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), qrFilename('svg'));
});

elements.copyLink.addEventListener('click', handleCopyLink);

for (const colorInput of [elements.foreground, elements.background]) {
  colorInput.addEventListener('input', () => {
    updateContrastStatus();
    if (current) current.svg = renderMatrix(current.matrix);
  });
}

elements.resetColors.addEventListener('click', () => {
  elements.foreground.value = '#000000';
  elements.background.value = '#ffffff';
  updateContrastStatus();
  if (current) current.svg = renderMatrix(current.matrix);
});

window.addEventListener('hashchange', restoreFromHash);

elements.year.textContent = String(new Date().getFullYear());
populateCountries();
updateContrastStatus();
setResultEnabled(false);
restoreFromHash();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Service worker registration failed:', error));
  });
}
