/**
 * Utilitários para validação e formatação de telefone
 */

/**
 * Remove caracteres não numéricos do telefone
 */
export const cleanPhone = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

/**
 * Formata telefone com máscara (XX) X XXXX-XXXX ou (XX) XXXX-XXXX
 */
export const formatPhone = (phone: string): string => {
  const cleaned = cleanPhone(phone);
  
  if (cleaned.length <= 2) {
    return cleaned;
  } else if (cleaned.length <= 3) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  } else if (cleaned.length <= 7) {
    // Para números com 10 dígitos (fixo): (XX) XXXX-XXXX
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    // Para números com 11 dígitos (celular): (XX) X XXXX-XXXX
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 3)} ${cleaned.slice(3)}`;
  } else if (cleaned.length <= 11) {
    if (cleaned.length === 10) {
      // Fixo: (XX) XXXX-XXXX
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    } else {
      // Celular: (XX) X XXXX-XXXX
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 3)} ${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }
  } else {
    // Limitar a 11 dígitos
    const limited = cleaned.slice(0, 11);
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 3)} ${limited.slice(3, 7)}-${limited.slice(7)}`;
  }
};

/**
 * Verifica se o telefone é válido (10 ou 11 dígitos)
 */
export const isValidPhone = (phone: string): boolean => {
  const cleaned = cleanPhone(phone);
  return cleaned.length === 10 || cleaned.length === 11;
};

/**
 * Valida telefone e retorna mensagem de erro se inválido
 */
export const validatePhone = (phone: string): string | null => {
  if (!phone || phone.trim() === '') {
    return 'Telefone é obrigatório';
  }
  
  const cleaned = cleanPhone(phone);
  
  if (cleaned.length < 10) {
    return 'Telefone deve ter pelo menos 10 dígitos';
  }
  
  if (cleaned.length > 11) {
    return 'Telefone deve ter no máximo 11 dígitos';
  }
  
  if (!isValidPhone(phone)) {
    return 'Telefone inválido';
  }
  
  return null;
};

/**
 * Máscara para input de telefone (celular)
 */
export const phoneMask = '(99) 9 9999-9999';

/**
 * Máscara para input de telefone (fixo)
 */
export const landlineMask = '(99) 9999-9999';

/**
 * Regex para validação de formato de telefone celular
 */
export const phoneRegex = /^\(\d{2}\)\s\d{1}\s\d{4}-\d{4}$/;

/**
 * Regex para validação de formato de telefone fixo
 */
export const landlineRegex = /^\(\d{2}\)\s\d{4}-\d{4}$/;
