const form = document.getElementById('converterForm');
const amountInput = document.getElementById('amount');
const fromCurrency = document.getElementById('fromCurrency');
const toCurrency = document.getElementById('toCurrency');
const swapButton = document.getElementById('swapButton');
const convertButton = document.getElementById('convertButton');
const buttonText = document.getElementById('buttonText');
const statusMessage = document.getElementById('statusMessage');
const resultAmount = document.getElementById('resultAmount');
const resultRate = document.getElementById('resultRate');

// This free endpoint supports GHS and the other currencies used in the app.
const API_BASE = 'https://open.er-api.com/v6/latest/';

function setStatus(message, type = '') {
  statusMessage.textContent = message;
  statusMessage.className = 'mt-3';
  if (type) statusMessage.classList.add(type);
}

function setLoading(isLoading) {
  convertButton.disabled = isLoading;
  buttonText.textContent = isLoading ? 'Converting...' : 'Convert';
}

async function getRates(baseCurrency) {
  const response = await fetch(`${API_BASE}${encodeURIComponent(baseCurrency)}`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`Exchange-rate service returned ${response.status}.`);
  }

  const data = await response.json();

  if (data.result !== 'success' || !data.rates) {
    throw new Error('The exchange-rate service did not return valid rates.');
  }

  return data;
}

async function convertCurrency() {
  const amount = Number(amountInput.value);
  const from = fromCurrency.value;
  const to = toCurrency.value;

  if (!Number.isFinite(amount) || amount <= 0) {
    setStatus('Please enter an amount greater than zero.', 'status-error');
    amountInput.focus();
    return;
  }

  if (from === to) {
    resultAmount.textContent = `${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${to}`;
    resultRate.textContent = `1 ${from} = 1 ${to}`;
    setStatus('The currencies are the same.', 'status-success');
    return;
  }

  setLoading(true);
  setStatus('Getting the latest exchange rate...');
  resultAmount.textContent = '—';
  resultRate.textContent = 'Please wait.';

  try {
    const data = await getRates(from);
    const rate = data.rates[to];

    if (typeof rate !== 'number') {
      throw new Error(`A rate for ${to} is not available right now.`);
    }

    const converted = amount * rate;
    resultAmount.textContent = `${converted.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} ${to}`;
    resultRate.textContent = `1 ${from} = ${rate.toLocaleString(undefined, {
      maximumFractionDigits: 6
    })} ${to}`;

    setStatus('Conversion completed.', 'status-success');
  } catch (error) {
    resultAmount.textContent = '—';
    resultRate.textContent = 'The exchange rate could not be loaded.';
    setStatus('Could not connect to the exchange-rate service. Check your internet connection and try again.', 'status-error');
  } finally {
    setLoading(false);
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  convertCurrency();
});

swapButton.addEventListener('click', () => {
  const oldFrom = fromCurrency.value;
  fromCurrency.value = toCurrency.value;
  toCurrency.value = oldFrom;
  setStatus('Currencies swapped. Click Convert to update the result.');
});

// Convert once when the page opens so the user immediately sees that it works.
convertCurrency();
