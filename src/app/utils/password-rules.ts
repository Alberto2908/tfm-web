export interface PasswordRule {
  key: string;
  label: string;
  test: (password: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  {
    key: 'length',
    label: 'Mínimo 8 caracteres',
    test: (password) => password.length >= 8,
  },
  {
    key: 'upper',
    label: 'Una letra mayúscula',
    test: (password) => /[A-Z]/.test(password),
  },
  {
    key: 'lower',
    label: 'Una letra minúscula',
    test: (password) => /[a-z]/.test(password),
  },
  {
    key: 'number',
    label: 'Un número',
    test: (password) => /\d/.test(password),
  },
  {
    key: 'special',
    label: 'Un carácter especial',
    test: (password) => /[^A-Za-z0-9]/.test(password),
  },
];

export function isStrongPassword(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}
