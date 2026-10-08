/*
  Currency Converter - JavaScript

  References used for development guidance:

  MDN Web Docs - Fetch API
  https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

  MDN Web Docs - Client-side form validation
  https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation

  MDN Web Docs - Web Storage API
  https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API

  These sources were used as guidance for API requests,
  form validation and saving the user's theme preference.
*/


// =========================================================
// GET HTML ELEMENTS
// =========================================================

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

const themeToggle = document.getElementById('themeToggle');


// =========================================================
// API
// =========================================================

// ExchangeRate-API open endpoint.
// The currency selected in the "From currency" field
// becomes the base currency for the API request.

const API_BASE = 'https://open.er-api.com/v6/latest/';


// =========================================================
// STATUS MESSAGE
// =========================================================

function setStatus(message, type = '') {
  statusMessage.textContent = message;

  statusMessage.className = 'mt-3';

  if (type) {
    statusMessage.classList.add(type);
  }
}


// =========================================================
// LOADING STATE


function setLoading(isLoading) {
  convertButton.disabled = isLoading;
  swapButton.disabled = isLoading;

  buttonText.textContent = isLoading
    ? 'Converting...'
    : 'Convert';
}


// =========================================================
// FORM VALIDATION


function validateForm() {

  // Use the browser's built-in HTML form validation.
  if (!form.checkValidity()) {
    form.reportValidity();
    return false;
  }

  const amount = Number(amountInput.value);

  // Prevent zero, negative and invalid numbers.
  if (!Number.isFinite(amount) || amount <= 0) {

    setStatus(
      'Please enter an amount greater than zero.',
      'error'
    );

    amountInput.focus();

    return false;
  }

  // Make sure both currencies have been selected.
  if (!fromCurrency.value || !toCurrency.value) {

    setStatus(
      'Please select both currencies.',
      'error'
    );

    return false;
  }

  return true;
}


// =========================================================
// GET EXCHANGE RATES FROM API


async function getRates(baseCurrency) {

  const response = await fetch(
    `${API_BASE}${encodeURIComponent(baseCurrency)}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    }
  );

  if (!response.ok) {
    throw new Error(
      `Exchange-rate service returned ${response.status}.`
    );
  }

  const data = await response.json();

  if (
    data.result !== 'success' ||
    !data.rates
  ) {
    throw new Error(
      'The exchange-rate service did not return valid rates.'
    );
  }

  return data;
}


// =========================================================
// CURRENCY CONVERSION


async function convertCurrency() {

  if (!validateForm()) {
    return;
  }

  const amount = Number(amountInput.value);
  const from = fromCurrency.value;
  const to = toCurrency.value;


  // If both currencies are the same, no API request is required.
  if (from === to) {

    resultAmount.textContent =
      `${amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })} ${to}`;

    resultRate.textContent =
      `1 ${from} = 1 ${to}`;

    setStatus(
      'The currencies are the same.',
      'success'
    );

    return;
  }


  // Show loading state.
  setLoading(true);

  setStatus(
    'Getting the latest exchange rate...'
  );

  resultAmount.textContent = '—';

  resultRate.textContent =
    'Please wait while the exchange rate is retrieved.';


  try {

    // Request exchange rates from the third-party API.
    const data = await getRates(from);

    const rate = data.rates[to];


    // Make sure the requested currency exists.
    if (typeof rate !== 'number') {
      throw new Error(
        `A rate for ${to} is not available right now.`
      );
    }


    // Calculate the converted amount.
    const converted = amount * rate;


    // Display the converted amount.
    resultAmount.textContent =
      `${converted.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })} ${to}`;


    // Display the exchange rate.
    resultRate.textContent =
      `1 ${from} = ${rate.toLocaleString(undefined, {
        maximumFractionDigits: 6
      })} ${to}`;


    // Tell the user that the conversion succeeded.
    setStatus(
      'Conversion completed successfully.',
      'success'
    );


  } catch (error) {

    // Keep technical information in the browser console.
    console.error(
      'Currency conversion error:',
      error
    );


    resultAmount.textContent = '—';

    resultRate.textContent =
      'The exchange rate could not be loaded.';


    setStatus(
      'Could not connect to the exchange-rate service. Check your internet connection and try again.',
      'error'
    );


  } finally {

    // Always restore the buttons after the API request.
    setLoading(false);
  }
}


// =========================================================
// FORM SUBMISSION


form.addEventListener('submit', function (event) {

  event.preventDefault();

  convertCurrency();

});


// =========================================================
// SWAP CURRENCIES


swapButton.addEventListener('click', function () {

  const currentFrom = fromCurrency.value;

  fromCurrency.value = toCurrency.value;

  toCurrency.value = currentFrom;


  // Clear the previous result because the currencies changed.
  resultAmount.textContent = '—';

  resultRate.textContent =
    'Click Convert to update the result.';


  setStatus(
    'Currencies swapped. Click Convert to update the result.'
  );

});


// =========================================================
// DARK / LIGHT MODE
// =========================================================

function applyTheme(theme) {

  if (theme === 'dark') {

    document.body.classList.add('dark');

  } else {

    document.body.classList.remove('dark');

  }


  updateThemeButton();
}


// Update the icon and accessibility information.
function updateThemeButton() {

  const isDark =
    document.body.classList.contains('dark');

  const icon =
    themeToggle.querySelector('span');


  if (isDark) {

    if (icon) {
      icon.textContent = '☀️';
    }

    themeToggle.setAttribute(
      'aria-label',
      'Switch to light mode'
    );

    themeToggle.setAttribute(
      'title',
      'Switch to light mode'
    );

  } else {

    if (icon) {
      icon.textContent = '🌙';
    }

    themeToggle.setAttribute(
      'aria-label',
      'Switch to dark mode'
    );

    themeToggle.setAttribute(
      'title',
      'Switch to dark mode'
    );
  }
}


// =========================================================
// THEME BUTTON
// =========================================================

themeToggle.addEventListener('click', function () {

  const currentlyDark =
    document.body.classList.contains('dark');

  const newTheme =
    currentlyDark ? 'light' : 'dark';


  applyTheme(newTheme);


  // Remember the user's preference.
  localStorage.setItem(
    'currencyConverterTheme',
    newTheme
  );

});


// =========================================================
// LOAD SAVED THEME
// =========================================================

const savedTheme =
  localStorage.getItem('currencyConverterTheme');


if (savedTheme === 'dark') {

  applyTheme('dark');

} else {

  applyTheme('light');

}


// =========================================================
// INITIAL CONVERSION
// =========================================================

// Run the converter when the page opens so the user
// immediately sees a working conversion.

convertCurrency();