export interface ValidationRule<T = any> {
  validate: (value: T) => boolean
  message: string
}

export interface FieldValidation<T = any> {
  required?: boolean
  rules?: ValidationRule<T>[]
}

export type FormValidation<T> = {
  [K in keyof T]?: FieldValidation<T[K]>
}

export type FormErrors<T> = {
  [K in keyof T]?: string
}

// Regras de validação comuns
export const validationRules = {
  required: (message = "Este campo é obrigatório"): ValidationRule<any> => ({
    validate: (value) => {
      if (typeof value === "string") return value.trim().length > 0;
      if (typeof value === "number") return !isNaN(value) && value !== 0; // Allow 0 for non-required fields, but required means not empty/0
      return value != null && value !== "";
    },
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    validate: (value) => value.length >= min,
    message: message || `Deve ter pelo menos ${min} caracteres`,
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    validate: (value) => value.length <= max,
    message: message || `Deve ter no máximo ${max} caracteres`,
  }),

  positiveNumber: (message = "Deve ser um número positivo"): ValidationRule<number> => ({
    validate: (value) => !isNaN(Number(value)) && Number(value) > 0,
    message,
  }),

  nonNegativeNumber: (message = "Deve ser um número não negativo"): ValidationRule<number> => ({
    validate: (value) => !isNaN(Number(value)) && Number(value) >= 0,
    message,
  }),

  email: (message = "Email inválido"): ValidationRule<string> => ({
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
  }),

  date: (message = "Data inválida"): ValidationRule<string> => ({
    validate: (value) => {
      if (!value) return false; // Handle empty string case for non-required date
      return !isNaN(new Date(value).getTime());
    },
    message,
  }),

  notEqual: <T>(compareValue: T, message?: string): ValidationRule<T> => ({\
    validate: (value) => value !== compareValue,
    message: message || `Não pode ser igual a ${compareValue}`,
  }),

  custom: <T>(validator: (value: T) => boolean, message: string): ValidationRule<T> => ({\
    validate: validator,
    message,
  }),
};

// Função para validar um formulário\
export function validateForm<T extends Record<string, any>>(\
  formData: T,
  validationSchema: FormValidation<T>
): FormErrors<T> {\
  const errors: FormErrors<T> = {};

  for (const [fieldName, validation] of Object.entries(validationSchema)) {\
    const fieldValue = formData[fieldName as keyof T];
    const fieldValidation = validation as FieldValidation<T[keyof T]>;
\
    // Verificar se é obrigatório
    if (fieldValidation.required) {\
      const requiredRule = validationRules.required();
      if (!requiredRule.validate(fieldValue)) {
        errors[fieldName as keyof T] = requiredRule.message;\
        continue; // Pular outras validações se o campo obrigatório estiver vazio
      }
    }

    // Aplicar regras de validação apenas se o campo não estiver vazio (ou se for obrigatório e já passou)
    // Isso evita aplicar regras como minLength a um campo opcional vazio.
    const isEffectivelyEmpty = fieldValue === null || fieldValue === undefined || (typeof fieldValue === 'string' && fieldValue.trim() === '');
    
    if (fieldValidation.rules && (!isEffectivelyEmpty || fieldValidation.required)) {\
      for (const rule of fieldValidation.rules) {
        // Se o campo não for obrigatório e estiver vazio, não aplicar outras regras (exceto 'required' que já foi tratada)\
        if (!fieldValidation.required && isEffectivelyEmpty && rule !== validationRules.required()) {
            continue;
        }\
        if (!rule.validate(fieldValue)) {
          errors[fieldName as keyof T] = rule.message;\
          break; // Parar na primeira regra que falhar
        }
      }
    }
  }

  return errors;
}

// Schemas de validação comuns para a aplicação
export const commonValidationSchemas = {
  // Schema para transações
  transaction: {
    description: {\
      required: true,\
      rules: [validationRules.minLength(1, "Descrição é obrigatória")],
    },
    amount: {
      required: true,\
      rules: [validationRules.positiveNumber("Valor deve ser maior que zero")],
    },
    date: {
      required: true,\
      rules: [validationRules.date("Data inválida")],
    },
    categoryId: {
      required: true,\
      rules: [validationRules.required("Categoria é obrigatória")],
    },
    assetId: {
      required: true,\
      rules: [validationRules.required("Ativo é obrigatório")],
    },
  },

  // Schema para categorias
  category: {
    name: {
      required: true,
      rules: [\
        validationRules.minLength(1, "Nome é obrigatório"),
        validationRules.maxLength(50, "Nome deve ter no máximo 50 caracteres"),
      ],
    },
    type: {
      required: true,\
      rules: [validationRules.required("Tipo é obrigatório")],
    },
  },

  // Schema para ativos
  asset: {
    name: {
      required: true,
      rules: [\
        validationRules.minLength(1, "Nome é obrigatório"),
        validationRules.maxLength(100, "Nome deve ter no máximo 100 caracteres"),
      ],
    },
    amount: { // Note: amount for asset can be 0, so nonNegativeNumber is appropriate
      required: true,\
      rules: [validationRules.nonNegativeNumber("Valor deve ser não negativo")],
    },
    type: {
      required: true,
      rules: [validationRules.required(\"Tipo é obrigatório")],
    },
  },

  // Schema para itens planejados
  plannedItem: {
    description: {
      required: true,\
      rules: [validationRules.minLength(1, \"Descrição é obrigatória")],
    },
    amount: {
      required: true,
      rules: [validationRules.positiveNumber(\"Valor deve ser maior que zero")],
    },
    date: {
      required: true,
      rules: [validationRules.date(\"Data inválida\")],
    },
    categoryId: {
      required: true,
      rules: [validationRules.required(\"Categoria é obrigatória")],
    },
    assetId: {
      required: true,
      rules: [validationRules.required("Ativo é obrigatório")],
    },
  },
};

// Função helper para criar validadores personalizados
export function createValidator<T extends Record<string, any>>(
  schema: FormValidation<T>
) {
  return (formData: T): FormErrors<T> => validateForm(formData, schema);
}
