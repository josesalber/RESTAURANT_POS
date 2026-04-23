export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone) {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
}

export function isValidRFC(rfc) {
  const rfcRegex = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/i;
  return rfcRegex.test(rfc);
}

export function isRequired(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function minLength(value, min) {
  if (!value) return false;
  return value.toString().length >= min;
}

export function maxLength(value, max) {
  if (!value) return true;
  return value.toString().length <= max;
}

export function isNumber(value) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

export function isPositive(value) {
  return isNumber(value) && parseFloat(value) > 0;
}

export function inRange(value, min, max) {
  if (!isNumber(value)) return false;
  const num = parseFloat(value);
  return num >= min && num <= max;
}

export function validate(value, rules) {
  const errors = [];

  for (const rule of rules) {
    const { validator, message, params = [] } = rule;

    let isValid = false;
    switch (validator) {
      case 'required':
        isValid = isRequired(value);
        break;
      case 'email':
        isValid = !value || isValidEmail(value);
        break;
      case 'phone':
        isValid = !value || isValidPhone(value);
        break;
      case 'rfc':
        isValid = !value || isValidRFC(value);
        break;
      case 'minLength':
        isValid = !value || minLength(value, params[0]);
        break;
      case 'maxLength':
        isValid = maxLength(value, params[0]);
        break;
      case 'number':
        isValid = !value || isNumber(value);
        break;
      case 'positive':
        isValid = !value || isPositive(value);
        break;
      case 'range':
        isValid = !value || inRange(value, params[0], params[1]);
        break;
      case 'custom':
        isValid = params[0](value);
        break;
      default:
        isValid = true;
    }

    if (!isValid) {
      errors.push(message);
    }
  }

  return errors;
}

export function validateForm(formData, schema) {
  const errors = {};

  for (const [field, rules] of Object.entries(schema)) {
    const fieldErrors = validate(formData[field], rules);
    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors[0];
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
