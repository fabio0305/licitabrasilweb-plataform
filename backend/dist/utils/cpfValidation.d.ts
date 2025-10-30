export declare const cleanCpf: (cpf: string) => string;
export declare const formatCpf: (cpf: string) => string;
export declare const maskCpfForLog: (cpf: string) => string;
export declare const isValidCpf: (cpf: string) => boolean;
export declare const validateCpf: (cpf: string) => {
    isValid: boolean;
    error?: string;
    cleaned?: string;
    formatted?: string;
};
export declare const INVALID_CPFS: string[];
export declare const isKnownInvalidCpf: (cpf: string) => boolean;
export declare const cpfRegex: RegExp;
//# sourceMappingURL=cpfValidation.d.ts.map