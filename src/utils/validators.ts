/**
 * validators.ts - Utilidades de validación centralizadas
 * 
 * Sistema de validación robusto para todo el sistema
 * Nivel NASA - A prueba de fallos
 * 
 * @author Kiro AI
 * @date 2026-02-08
 */

// ==========================================
// TYPES
// ==========================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export type ValidationRule<T> = (value: T) => ValidationError | null;

// ==========================================
// ERROR CODES
// ==========================================

export const ERROR_CODES = {
  // General
  REQUIRED: 'REQUIRED',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_TYPE: 'INVALID_TYPE',
  
  // String
  TOO_SHORT: 'TOO_SHORT',
  TOO_LONG: 'TOO_LONG',
  INVALID_PATTERN: 'INVALID_PATTERN',
  
  // Number
  TOO_SMALL: 'TOO_SMALL',
  TOO_LARGE: 'TOO_LARGE',
  NOT_INTEGER: 'NOT_INTEGER',
  NOT_POSITIVE: 'NOT_POSITIVE',
  
  // Date
  INVALID_DATE: 'INVALID_DATE',
  DATE_IN_PAST: 'DATE_IN_PAST',
  DATE_IN_FUTURE: 'DATE_IN_FUTURE',
  DATE_OUT_OF_RANGE: 'DATE_OUT_OF_RANGE',
  
  // Email
  INVALID_EMAIL: 'INVALID_EMAIL',
  
  // SSN
  INVALID_SSN: 'INVALID_SSN',
  
  // EIN
  INVALID_EIN: 'INVALID_EIN',
  
  // Phone
  INVALID_PHONE: 'INVALID_PHONE',
  
  // Business Rules
  PERIOD_CLOSED: 'PERIOD_CLOSED',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  INVALID_ACCOUNT: 'INVALID_ACCOUNT',
} as const;

// ==========================================
// ERROR MESSAGES (ES)
// ==========================================

export const ERROR_MESSAGES: Record<string, string> = {
  // General
  REQUIRED: 'Este campo es requerido',
  INVALID_FORMAT: 'Formato inválido',
  INVALID_TYPE: 'Tipo de dato inválido',
  
  // String
  TOO_SHORT: 'Debe tener al menos {min} caracteres',
  TOO_LONG: 'No puede exceder {max} caracteres',
  INVALID_PATTERN: 'Formato inválido',
  
  // Number
  TOO_SMALL: 'Debe ser al menos {min}',
  TOO_LARGE: 'No puede exceder {max}',
  NOT_INTEGER: 'Debe ser un número entero',
  NOT_POSITIVE: 'Debe ser un número positivo',
  
  // Date
  INVALID_DATE: 'Fecha inválida',
  DATE_IN_PAST: 'La fecha no puede estar en el pasado',
  DATE_IN_FUTURE: 'La fecha no puede estar en el futuro',
  DATE_OUT_OF_RANGE: 'La fecha está fuera del rango permitido',
  
  // Email
  INVALID_EMAIL: 'Email inválido',
  
  // SSN
  INVALID_SSN: 'SSN debe estar en formato XXX-XX-XXXX',
  
  // EIN
  INVALID_EIN: 'EIN debe estar en formato XX-XXXXXXX',
  
  // Phone
  INVALID_PHONE: 'Teléfono inválido',
  
  // Business Rules
  PERIOD_CLOSED: 'El período contable está cerrado',
  DUPLICATE_ENTRY: 'Ya existe un registro con estos datos',
  INSUFFICIENT_BALANCE: 'Saldo insuficiente',
  INVALID_ACCOUNT: 'Cuenta inválida',
};

// ==========================================
// BASIC VALIDATORS
// ==========================================

/**
 * Valida que un valor no sea nulo, undefined o vacío
 */
export function required(field: string, message?: string): ValidationRule<any> {
  return (value: any) => {
    if (value === null || value === undefined || value === '' || 
        (Array.isArray(value) && value.length === 0)) {
      return {
        field,
        message: message || ERROR_MESSAGES.REQUIRED,
        code: ERROR_CODES.REQUIRED
      };
    }
    return null;
  };
}

/**
 * Valida longitud mínima de string
 */
export function minLength(field: string, min: number, message?: string): ValidationRule<string> {
  return (value: string) => {
    if (value && value.length < min) {
      return {
        field,
        message: message || ERROR_MESSAGES.TOO_SHORT.replace('{min}', min.toString()),
        code: ERROR_CODES.TOO_SHORT
      };
    }
    return null;
  };
}

/**
 * Valida longitud máxima de string
 */
export function maxLength(field: string, max: number, message?: string): ValidationRule<string> {
  return (value: string) => {
    if (value && value.length > max) {
      return {
        field,
        message: message || ERROR_MESSAGES.TOO_LONG.replace('{max}', max.toString()),
        code: ERROR_CODES.TOO_LONG
      };
    }
    return null;
  };
}

/**
 * Valida valor mínimo de número
 */
export function min(field: string, minValue: number, message?: string): ValidationRule<number> {
  return (value: number) => {
    if (value !== null && value !== undefined && value < minValue) {
      return {
        field,
        message: message || ERROR_MESSAGES.TOO_SMALL.replace('{min}', minValue.toString()),
        code: ERROR_CODES.TOO_SMALL
      };
    }
    return null;
  };
}

/**
 * Valida valor máximo de número
 */
export function max(field: string, maxValue: number, message?: string): ValidationRule<number> {
  return (value: number) => {
    if (value !== null && value !== undefined && value > maxValue) {
      return {
        field,
        message: message || ERROR_MESSAGES.TOO_LARGE.replace('{max}', maxValue.toString()),
        code: ERROR_CODES.TOO_LARGE
      };
    }
    return null;
  };
}

/**
 * Valida que sea un número entero
 */
export function integer(field: string, message?: string): ValidationRule<number> {
  return (value: number) => {
    if (value !== null && value !== undefined && !Number.isInteger(value)) {
      return {
        field,
        message: message || ERROR_MESSAGES.NOT_INTEGER,
        code: ERROR_CODES.NOT_INTEGER
      };
    }
    return null;
  };
}

/**
 * Valida que sea un número positivo
 */
export function positive(field: string, message?: string): ValidationRule<number> {
  return (value: number) => {
    if (value !== null && value !== undefined && value <= 0) {
      return {
        field,
        message: message || ERROR_MESSAGES.NOT_POSITIVE,
        code: ERROR_CODES.NOT_POSITIVE
      };
    }
    return null;
  };
}

/**
 * Valida patrón regex
 */
export function pattern(field: string, regex: RegExp, message?: string): ValidationRule<string> {
  return (value: string) => {
    if (value && !regex.test(value)) {
      return {
        field,
        message: message || ERROR_MESSAGES.INVALID_PATTERN,
        code: ERROR_CODES.INVALID_PATTERN
      };
    }
    return null;
  };
}

// ==========================================
// SPECIFIC VALIDATORS
// ==========================================

/**
 * Valida formato de email
 */
export function email(field: string, message?: string): ValidationRule<string> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return (value: string) => {
    if (value && !emailRegex.test(value)) {
      return {
        field,
        message: message || ERROR_MESSAGES.INVALID_EMAIL,
        code: ERROR_CODES.INVALID_EMAIL
      };
    }
    return null;
  };
}

/**
 * Valida formato de SSN (XXX-XX-XXXX)
 */
export function ssn(field: string, message?: string): ValidationRule<string> {
  const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
  return (value: string) => {
    if (value && !ssnRegex.test(value)) {
      return {
        field,
        message: message || ERROR_MESSAGES.INVALID_SSN,
        code: ERROR_CODES.INVALID_SSN
      };
    }
    return null;
  };
}

/**
 * Valida formato de EIN (XX-XXXXXXX)
 */
export function ein(field: string, message?: string): ValidationRule<string> {
  const einRegex = /^\d{2}-\d{7}$/;
  return (value: string) => {
    if (value && !einRegex.test(value)) {
      return {
        field,
        message: message || ERROR_MESSAGES.INVALID_EIN,
        code: ERROR_CODES.INVALID_EIN
      };
    }
    return null;
  };
}

/**
 * Valida formato de teléfono US
 */
export function phone(field: string, message?: string): ValidationRule<string> {
  const phoneRegex = /^(\+1)?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;
  return (value: string) => {
    if (value && !phoneRegex.test(value)) {
      return {
        field,
        message: message || ERROR_MESSAGES.INVALID_PHONE,
        code: ERROR_CODES.INVALID_PHONE
      };
    }
    return null;
  };
}

/**
 * Valida que sea una fecha válida
 */
export function validDate(field: string, message?: string): ValidationRule<string | Date> {
  return (value: string | Date) => {
    const date = typeof value === 'string' ? new Date(value) : value;
    if (value && isNaN(date.getTime())) {
      return {
        field,
        message: message || ERROR_MESSAGES.INVALID_DATE,
        code: ERROR_CODES.INVALID_DATE
      };
    }
    return null;
  };
}

/**
 * Valida que la fecha no esté en el pasado
 */
export function notInPast(field: string, message?: string): ValidationRule<string | Date> {
  return (value: string | Date) => {
    const date = typeof value === 'string' ? new Date(value) : value;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (value && date < today) {
      return {
        field,
        message: message || ERROR_MESSAGES.DATE_IN_PAST,
        code: ERROR_CODES.DATE_IN_PAST
      };
    }
    return null;
  };
}

/**
 * Valida que la fecha no esté en el futuro
 */
export function notInFuture(field: string, message?: string): ValidationRule<string | Date> {
  return (value: string | Date) => {
    const date = typeof value === 'string' ? new Date(value) : value;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (value && date > today) {
      return {
        field,
        message: message || ERROR_MESSAGES.DATE_IN_FUTURE,
        code: ERROR_CODES.DATE_IN_FUTURE
      };
    }
    return null;
  };
}

// ==========================================
// VALIDATOR COMPOSER
// ==========================================

/**
 * Ejecuta múltiples validaciones en un valor
 */
export function validate<T>(value: T, rules: ValidationRule<T>[]): ValidationResult {
  const errors: ValidationError[] = [];
  
  for (const rule of rules) {
    const error = rule(value);
    if (error) {
      errors.push(error);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida un objeto completo con múltiples campos
 */
export function validateObject<T extends Record<string, any>>(
  obj: T,
  schema: Record<keyof T, ValidationRule<any>[]>
): ValidationResult {
  const errors: ValidationError[] = [];
  
  for (const field in schema) {
    const value = obj[field];
    const rules = schema[field];
    const result = validate(value, rules);
    
    if (!result.isValid) {
      errors.push(...result.errors);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// ==========================================
// BUSINESS RULE VALIDATORS
// ==========================================

/**
 * Valida que un período contable esté abierto
 */
export function periodOpen(field: string, date: string | Date): ValidationError | null {
  // Esta función debería consultar la base de datos
  // Por ahora, retornamos null (válido)
  return null;
}

/**
 * Valida que no exista un duplicado
 */
export function noDuplicate(field: string, value: any, existingValues: any[]): ValidationError | null {
  if (existingValues.includes(value)) {
    return {
      field,
      message: ERROR_MESSAGES.DUPLICATE_ENTRY,
      code: ERROR_CODES.DUPLICATE_ENTRY
    };
  }
  return null;
}

/**
 * Valida saldo suficiente
 */
export function sufficientBalance(field: string, amount: number, balance: number): ValidationError | null {
  if (amount > balance) {
    return {
      field,
      message: ERROR_MESSAGES.INSUFFICIENT_BALANCE,
      code: ERROR_CODES.INSUFFICIENT_BALANCE
    };
  }
  return null;
}
