/**
 * Helper functions for validation error handling and message formatting
 */

/**
 * Formats validation errors for display in forms
 */
export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0];
  
  return errors.join('. ');
}

/**
 * Checks if a field has validation errors
 */
export function hasFieldError(
  errors: Record<string, string[] | undefined>,
  fieldName: string
): boolean {
  return Boolean(errors[fieldName] && errors[fieldName]!.length > 0);
}

/**
 * Gets the first error message for a field
 */
export function getFieldError(
  errors: Record<string, string[] | undefined>,
  fieldName: string
): string | undefined {
  const fieldErrors = errors[fieldName];
  return fieldErrors && fieldErrors.length > 0 ? fieldErrors[0] : undefined;
}

/**
 * Gets all error messages for a field
 */
export function getFieldErrors(
  errors: Record<string, string[] | undefined>,
  fieldName: string
): string[] {
  return errors[fieldName] || [];
}

/**
 * Debounce function for validation to avoid excessive validation calls
 */
export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Creates a validation state object for form fields
 */
export interface ValidationState {
  isValid: boolean;
  isDirty: boolean;
  errors: string[];
}

export function createValidationState(
  isValid = true,
  isDirty = false,
  errors: string[] = []
): ValidationState {
  return {
    isValid,
    isDirty,
    errors,
  };
}

/**
 * Updates validation state with new validation results
 */
export function updateValidationState(
  currentState: ValidationState,
  isValid: boolean,
  errors: string[] = []
): ValidationState {
  return {
    ...currentState,
    isValid,
    errors,
    isDirty: true,
  };
}