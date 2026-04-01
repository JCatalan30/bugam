const sanitizeString = (value) => {
  if (typeof value !== 'string') return value;
  return value.trim().replace(/<[^>]*>/g, '');
};

const validateNumber = (value, fieldName) => {
  if (value === undefined || value === null) return null;
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`${fieldName} debe ser un número válido`);
  }
  return num;
};

const validatePositiveNumber = (value, fieldName) => {
  const num = validateNumber(value, fieldName);
  if (num === null) return null;
  if (num <= 0) {
    throw new Error(`${fieldName} debe ser un número positivo`);
  }
  return num;
};

const validateNonNegativeNumber = (value, fieldName) => {
  const num = validateNumber(value, fieldName);
  if (num === null) return null;
  if (num < 0) {
    throw new Error(`${fieldName} debe ser un número no negativo`);
  }
  return num;
};

const validateLength = (value, fieldName, min, max) => {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} debe ser una cadena de texto`);
  }
  if (min && value.length < min) {
    throw new Error(`${fieldName} debe tener al menos ${min} caracteres`);
  }
  if (max && value.length > max) {
    throw new Error(`${fieldName} debe tener como máximo ${max} caracteres`);
  }
  return value;
};

const validateRequiredFields = (obj, requiredFields) => {
  const missing = requiredFields.filter(field => {
    const value = obj[field];
    return value === undefined || value === null || value === '';
  });
  if (missing.length > 0) {
    throw new Error(`Campos requeridos faltantes: ${missing.join(', ')}`);
  }
};

const validateBoolean = (value, fieldName) => {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'boolean') {
    throw new Error(`${fieldName} debe ser un valor booleano`);
  }
  return value;
};

module.exports = {
  sanitizeString,
  validateNumber,
  validatePositiveNumber,
  validateNonNegativeNumber,
  validateLength,
  validateRequiredFields,
  validateBoolean
};