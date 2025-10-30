"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cpfRegex = exports.isKnownInvalidCpf = exports.INVALID_CPFS = exports.validateCpf = exports.isValidCpf = exports.maskCpfForLog = exports.formatCpf = exports.cleanCpf = void 0;
const cleanCpf = (cpf) => {
    return cpf.replace(/\D/g, '');
};
exports.cleanCpf = cleanCpf;
const formatCpf = (cpf) => {
    const cleaned = (0, exports.cleanCpf)(cpf);
    if (cleaned.length <= 3) {
        return cleaned;
    }
    else if (cleaned.length <= 6) {
        return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
    }
    else if (cleaned.length <= 9) {
        return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
    }
    else {
        return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
    }
};
exports.formatCpf = formatCpf;
const maskCpfForLog = (cpf) => {
    const cleaned = (0, exports.cleanCpf)(cpf);
    if (cleaned.length !== 11) {
        return '***.***.***-**';
    }
    return `${cleaned.slice(0, 3)}.***.***-${cleaned.slice(9, 11)}`;
};
exports.maskCpfForLog = maskCpfForLog;
const hasAllSameDigits = (cpf) => {
    const cleaned = (0, exports.cleanCpf)(cpf);
    return cleaned.split('').every(digit => digit === cleaned[0]);
};
const calculateDigit = (cpf, position) => {
    const digits = cpf.slice(0, position - 1).split('').map(Number);
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
        sum += digits[i] * (position - i);
    }
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
};
const isValidCpf = (cpf) => {
    const cleaned = (0, exports.cleanCpf)(cpf);
    if (cleaned.length !== 11) {
        return false;
    }
    if (hasAllSameDigits(cleaned)) {
        return false;
    }
    const firstDigit = calculateDigit(cleaned, 10);
    if (firstDigit !== parseInt(cleaned[9])) {
        return false;
    }
    const secondDigit = calculateDigit(cleaned, 11);
    if (secondDigit !== parseInt(cleaned[10])) {
        return false;
    }
    return true;
};
exports.isValidCpf = isValidCpf;
const validateCpf = (cpf) => {
    if (!cpf || cpf.trim() === '') {
        return {
            isValid: false,
            error: 'CPF é obrigatório'
        };
    }
    const cleaned = (0, exports.cleanCpf)(cpf);
    if (cleaned.length !== 11) {
        return {
            isValid: false,
            error: 'CPF deve ter 11 dígitos',
            cleaned
        };
    }
    if (!(0, exports.isValidCpf)(cpf)) {
        return {
            isValid: false,
            error: 'CPF inválido',
            cleaned
        };
    }
    return {
        isValid: true,
        cleaned,
        formatted: (0, exports.formatCpf)(cpf)
    };
};
exports.validateCpf = validateCpf;
exports.INVALID_CPFS = [
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
const isKnownInvalidCpf = (cpf) => {
    const cleaned = (0, exports.cleanCpf)(cpf);
    return exports.INVALID_CPFS.includes(cleaned);
};
exports.isKnownInvalidCpf = isKnownInvalidCpf;
exports.cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
//# sourceMappingURL=cpfValidation.js.map