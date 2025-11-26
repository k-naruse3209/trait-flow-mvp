/**
 * Password validation utilities for the settings page
 * Implements security requirements for password strength and validation
 */

import { Locale } from '../i18n';

export interface PasswordValidationRules {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export interface PasswordChangeValidation {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordChangeValidationResult {
  isValid: boolean;
  errors: {
    currentPassword?: string[];
    newPassword?: string[];
    confirmPassword?: string[];
    general?: string[];
  };
}

// Default password validation rules
export const DEFAULT_PASSWORD_RULES: PasswordValidationRules = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

// Multilingual error messages
const PASSWORD_MESSAGES = {
  en: {
    minLength: (length: number) => `Password must be at least ${length} characters long`,
    requireUppercase: 'Password must contain at least one uppercase letter',
    requireLowercase: 'Password must contain at least one lowercase letter',
    requireNumbers: 'Password must contain at least one number',
    requireSpecialChars: 'Password must contain at least one special character',
    currentPasswordRequired: 'Current password is required',
    confirmPasswordRequired: 'Please confirm your new password',
    passwordsDoNotMatch: 'Passwords do not match',
    newPasswordMustBeDifferent: 'New password must be different from current password',
    strengthWeak: 'Weak',
    strengthMedium: 'Medium',
    strengthStrong: 'Strong',
    requirementsTitle: 'Password requirements:',
    requirementMinLength: (length: number) => `At least ${length} characters long`,
    requirementUppercase: 'At least one uppercase letter',
    requirementLowercase: 'At least one lowercase letter',
    requirementNumbers: 'At least one number',
    requirementSpecialChars: 'At least one special character',
    newPasswordRequired: 'New password is required',
    unexpectedError: 'An unexpected error occurred'
  },
  vi: {
    minLength: (length: number) => `Mật khẩu phải có ít nhất ${length} ký tự`,
    requireUppercase: 'Mật khẩu phải chứa ít nhất một chữ cái viết hoa',
    requireLowercase: 'Mật khẩu phải chứa ít nhất một chữ cái viết thường',
    requireNumbers: 'Mật khẩu phải chứa ít nhất một số',
    requireSpecialChars: 'Mật khẩu phải chứa ít nhất một ký tự đặc biệt',
    currentPasswordRequired: 'Mật khẩu hiện tại là bắt buộc',
    confirmPasswordRequired: 'Vui lòng xác nhận mật khẩu mới',
    passwordsDoNotMatch: 'Mật khẩu không khớp',
    newPasswordMustBeDifferent: 'Mật khẩu mới phải khác với mật khẩu hiện tại',
    strengthWeak: 'Yếu',
    strengthMedium: 'Trung bình',
    strengthStrong: 'Mạnh',
    requirementsTitle: 'Yêu cầu mật khẩu:',
    requirementMinLength: (length: number) => `Ít nhất ${length} ký tự`,
    requirementUppercase: 'Ít nhất một chữ cái viết hoa',
    requirementLowercase: 'Ít nhất một chữ cái viết thường',
    requirementNumbers: 'Ít nhất một số',
    requirementSpecialChars: 'Ít nhất một ký tự đặc biệt',
    newPasswordRequired: 'Mật khẩu mới là bắt buộc',
    unexpectedError: 'Đã xảy ra lỗi không mong muốn'
  },
  ja: {
    minLength: (length: number) => `パスワードは少なくとも${length}文字である必要があります`,
    requireUppercase: 'パスワードには少なくとも1つの大文字が含まれている必要があります',
    requireLowercase: 'パスワードには少なくとも1つの小文字が含まれている必要があります',
    requireNumbers: 'パスワードには少なくとも1つの数字が含まれている必要があります',
    requireSpecialChars: 'パスワードには少なくとも1つの特殊文字が含まれている必要があります',
    currentPasswordRequired: '現在のパスワードが必要です',
    confirmPasswordRequired: '新しいパスワードを確認してください',
    passwordsDoNotMatch: 'パスワードが一致しません',
    newPasswordMustBeDifferent: '新しいパスワードは現在のパスワードと異なる必要があります',
    strengthWeak: '弱い',
    strengthMedium: '中程度',
    strengthStrong: '強い',
    requirementsTitle: 'パスワード要件:',
    requirementMinLength: (length: number) => `少なくとも${length}文字`,
    requirementUppercase: '少なくとも1つの大文字',
    requirementLowercase: '少なくとも1つの小文字',
    requirementNumbers: '少なくとも1つの数字',
    requirementSpecialChars: '少なくとも1つの特殊文字',
    newPasswordRequired: '新しいパスワードが必要です',
    unexpectedError: '予期しないエラーが発生しました'
  }
};

/**
 * Validates password strength based on defined rules
 */
export function validatePasswordStrength(
  password: string,
  rules: PasswordValidationRules = DEFAULT_PASSWORD_RULES,
  locale: Locale = 'en'
): PasswordValidationResult {
  const errors: string[] = [];
  let strengthScore = 0;
  const messages = PASSWORD_MESSAGES[locale] || PASSWORD_MESSAGES.en;

  // Check minimum length
  if (password.length < rules.minLength) {
    errors.push(messages.minLength(rules.minLength));
  } else {
    strengthScore += 1;
  }

  // Check for uppercase letters
  if (rules.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push(messages.requireUppercase);
  } else if (/[A-Z]/.test(password)) {
    strengthScore += 1;
  }

  // Check for lowercase letters
  if (rules.requireLowercase && !/[a-z]/.test(password)) {
    errors.push(messages.requireLowercase);
  } else if (/[a-z]/.test(password)) {
    strengthScore += 1;
  }

  // Check for numbers
  if (rules.requireNumbers && !/\d/.test(password)) {
    errors.push(messages.requireNumbers);
  } else if (/\d/.test(password)) {
    strengthScore += 1;
  }

  // Check for special characters
  if (rules.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push(messages.requireSpecialChars);
  } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    strengthScore += 1;
  }

  // Additional strength checks
  if (password.length >= 12) {
    strengthScore += 1;
  }

  // Determine strength level
  let strength: 'weak' | 'medium' | 'strong';
  if (strengthScore <= 2) {
    strength = 'weak';
  } else if (strengthScore <= 4) {
    strength = 'medium';
  } else {
    strength = 'strong';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

/**
 * Validates password change form data
 */
export function validatePasswordChange(
  data: PasswordChangeValidation,
  rules: PasswordValidationRules = DEFAULT_PASSWORD_RULES,
  locale: Locale = 'en'
): PasswordChangeValidationResult {
  const errors: PasswordChangeValidationResult['errors'] = {};
  const messages = PASSWORD_MESSAGES[locale] || PASSWORD_MESSAGES.en;

  // Validate current password (basic presence check)
  if (!data.currentPassword || data.currentPassword.trim().length === 0) {
    errors.currentPassword = [messages.currentPasswordRequired];
  }

  // Validate new password strength
  const newPasswordValidation = validatePasswordStrength(data.newPassword, rules, locale);
  if (!newPasswordValidation.isValid) {
    errors.newPassword = newPasswordValidation.errors;
  }

  // Validate confirm password
  if (!data.confirmPassword || data.confirmPassword.trim().length === 0) {
    errors.confirmPassword = [messages.confirmPasswordRequired];
  } else if (data.newPassword !== data.confirmPassword) {
    errors.confirmPassword = [messages.passwordsDoNotMatch];
  }

  // Check if new password is different from current password
  if (data.currentPassword && data.newPassword && data.currentPassword === data.newPassword) {
    errors.general = [messages.newPasswordMustBeDifferent];
  }

  const hasErrors = Object.keys(errors).length > 0;

  return {
    isValid: !hasErrors,
    errors,
  };
}

/**
 * Gets password strength color for UI display
 */
export function getPasswordStrengthColor(strength: 'weak' | 'medium' | 'strong'): string {
  switch (strength) {
    case 'weak':
      return 'text-red-500';
    case 'medium':
      return 'text-yellow-500';
    case 'strong':
      return 'text-green-500';
    default:
      return 'text-gray-500';
  }
}

/**
 * Gets password strength label for UI display
 */
export function getPasswordStrengthLabel(strength: 'weak' | 'medium' | 'strong', locale: Locale = 'en'): string {
  const messages = PASSWORD_MESSAGES[locale] || PASSWORD_MESSAGES.en;
  
  switch (strength) {
    case 'weak':
      return messages.strengthWeak;
    case 'medium':
      return messages.strengthMedium;
    case 'strong':
      return messages.strengthStrong;
    default:
      return 'Unknown';
  }
}

/**
 * Gets password validation messages for a specific locale
 */
export function getPasswordValidationMessages(locale: Locale = 'en') {
  return PASSWORD_MESSAGES[locale] || PASSWORD_MESSAGES.en;
}

/**
 * Generates password requirements text for UI display
 */
export function getPasswordRequirementsText(rules: PasswordValidationRules = DEFAULT_PASSWORD_RULES, locale: Locale = 'en'): string[] {
  const requirements: string[] = [];
  const messages = PASSWORD_MESSAGES[locale] || PASSWORD_MESSAGES.en;

  requirements.push(messages.requirementMinLength(rules.minLength));
  
  if (rules.requireUppercase) {
    requirements.push(messages.requirementUppercase);
  }
  
  if (rules.requireLowercase) {
    requirements.push(messages.requirementLowercase);
  }
  
  if (rules.requireNumbers) {
    requirements.push(messages.requirementNumbers);
  }
  
  if (rules.requireSpecialChars) {
    requirements.push(messages.requirementSpecialChars);
  }

  return requirements;
}