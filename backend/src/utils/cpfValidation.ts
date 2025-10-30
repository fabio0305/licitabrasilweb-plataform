/**
 * Utilitários para validação de CPF no backend
 * Implementa o mesmo algoritmo usado no frontend para garantir consistência
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
 * Mascara CPF para logs (mostra apenas os primeiros 3 e últimos 2 dígitos)
 * Exemplo: 123.456.789-09 -> 123.***.***-09
 */
export const maskCpfForLog = (cpf: string): string => {
  const cleaned = cleanCpf(cpf);
  
  if (cleaned.length !== 11) {
    return '***.***.***-**';
  }
  
  return `${cleaned.slice(0, 3)}.***.***-${cleaned.slice(9, 11)}`;
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
 * Valida CPF e retorna objeto com resultado detalhado
 */
export const validateCpf = (cpf: string): {
  isValid: boolean;
  error?: string;
  cleaned?: string;
  formatted?: string;
} => {
  if (!cpf || cpf.trim() === '') {
    return {
      isValid: false,
      error: 'CPF é obrigatório'
    };
  }
  
  const cleaned = cleanCpf(cpf);
  
  if (cleaned.length !== 11) {
    return {
      isValid: false,
      error: 'CPF deve ter 11 dígitos',
      cleaned
    };
  }
  
  if (!isValidCpf(cpf)) {
    return {
      isValid: false,
      error: 'CPF inválido',
      cleaned
    };
  }
  
  return {
    isValid: true,
    cleaned,
    formatted: formatCpf(cpf)
  };
};

/**
 * Lista de CPFs conhecidos como inválidos (para testes)
 */
export const INVALID_CPFS = [
  '00000000000',
  '11111111111',
  '22222222222',
  '33333333333',
  '44444444444',
  '55555555555',
  '66666666666',
  '77777777777',
  '88888888888',
  '99999999999',
  '12345678901',
  '10987654321'
];

/**
 * Verifica se o CPF está na lista de CPFs conhecidos como inválidos
 */
export const isKnownInvalidCpf = (cpf: string): boolean => {
  const cleaned = cleanCpf(cpf);
  return INVALID_CPFS.includes(cleaned);
};

/**
 * Regex para validação de formato de CPF
 */
export const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
