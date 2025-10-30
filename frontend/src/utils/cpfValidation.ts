/**
 * Utilitários para validação de CPF
 */

/**
 * Remove caracteres não numéricos do CPF
 */
export const cleanCpf = (cpf: string): string => {
  return cpf.replace(/\D/g, '');
};

/**
 * Formata CPF com máscara XXX.XXX.XXX-XX
 */
export const formatCpf = (cpf: string): string => {
  const cleaned = cleanCpf(cpf);
  
  if (cleaned.length <= 3) {
    return cleaned;
  } else if (cleaned.length <= 6) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  } else if (cleaned.length <= 9) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  } else {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
  }
};

/**
 * Verifica se todos os dígitos são iguais (CPFs inválidos)
 */
const hasAllSameDigits = (cpf: string): boolean => {
  const cleaned = cleanCpf(cpf);
  return cleaned.split('').every(digit => digit === cleaned[0]);
};

/**
 * Calcula o dígito verificador do CPF
 */
const calculateDigit = (cpf: string, position: number): number => {
  const digits = cpf.slice(0, position - 1).split('').map(Number);
  let sum = 0;
  
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i] * (position - i);
  }
  
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
};

/**
 * Valida CPF usando o algoritmo oficial da Receita Federal
 */
export const isValidCpf = (cpf: string): boolean => {
  const cleaned = cleanCpf(cpf);
  
  // Verifica se tem 11 dígitos
  if (cleaned.length !== 11) {
    return false;
  }
  
  // Verifica se todos os dígitos são iguais
  if (hasAllSameDigits(cleaned)) {
    return false;
  }
  
  // Calcula o primeiro dígito verificador
  const firstDigit = calculateDigit(cleaned, 10);
  if (firstDigit !== parseInt(cleaned[9])) {
    return false;
  }
  
  // Calcula o segundo dígito verificador
  const secondDigit = calculateDigit(cleaned, 11);
  if (secondDigit !== parseInt(cleaned[10])) {
    return false;
  }
  
  return true;
};

/**
 * Valida CPF e retorna mensagem de erro se inválido
 */
export const validateCpf = (cpf: string): string | null => {
  if (!cpf || cpf.trim() === '') {
    return 'CPF é obrigatório';
  }
  
  const cleaned = cleanCpf(cpf);
  
  if (cleaned.length < 11) {
    return 'CPF deve ter 11 dígitos';
  }
  
  if (!isValidCpf(cpf)) {
    return 'CPF inválido';
  }
  
  return null;
};

/**
 * Máscara para input de CPF
 */
export const cpfMask = '999.999.999-99';

/**
 * Regex para validação de formato de CPF
 */
export const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
