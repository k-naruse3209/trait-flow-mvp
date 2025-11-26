'use client'

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslations, useLocale } from '@/components/translation-provider';
import { useNotifications } from '@/contexts/NotificationContext';
import { createClient } from '@/lib/supabase/client';
import { 
  validatePasswordStrength,
  getPasswordStrengthColor,
  getPasswordStrengthLabel,
  getPasswordRequirementsText,
  getPasswordValidationMessages
} from '@/lib/validation/password-validation';
import { 
  formatValidationErrors, 
  hasFieldError, 
  getFieldError
} from '@/lib/validation/validation-helpers';
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordChangeFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

interface FormState {
  newPassword: string;
  confirmPassword: string;
}

interface ValidationErrors {
  newPassword?: string[];
  confirmPassword?: string[];
  general?: string[];
  [key: string]: string[] | undefined;
}

export function PasswordChangeForm({ onSuccess, onError }: PasswordChangeFormProps) {
  const [formState, setFormState] = useState<FormState>({
    newPassword: '',
    confirmPassword: '',
  });
  
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false,
  });
  const [isDirty, setIsDirty] = useState({
    newPassword: false,
    confirmPassword: false,
  });

  const t = useTranslations();
  const locale = useLocale();
  const supabase = createClient();
  const { addNotification } = useNotifications();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const passwordMessages = getPasswordValidationMessages(locale);

  // Debounced validation function
  const debouncedValidation = useCallback((data: { newPassword: string; confirmPassword: string }) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      // Simple validation for new password form
      const errors: ValidationErrors = {};
      
      // Validate new password strength
      if (data.newPassword) {
        const passwordValidation = validatePasswordStrength(data.newPassword, undefined, locale);
        if (!passwordValidation.isValid) {
          errors.newPassword = passwordValidation.errors;
        }
      }
      
      // Validate confirm password
      if (data.confirmPassword && data.newPassword !== data.confirmPassword) {
        errors.confirmPassword = [passwordMessages.passwordsDoNotMatch];
      }
      
      setValidationErrors(errors);
    }, 300);
  }, [locale, passwordMessages]);

  // Handle input changes
  const handleInputChange = (field: keyof FormState, value: string) => {
    const newFormState = { ...formState, [field]: value };
    setFormState(newFormState);
    
    // Mark field as dirty
    setIsDirty(prev => ({ ...prev, [field]: true }));
    
    // Trigger debounced validation
    debouncedValidation(newFormState);
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field: 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Get password strength for new password
  const getNewPasswordStrength = () => {
    if (!formState.newPassword) return null;
    return validatePasswordStrength(formState.newPassword, undefined, locale);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as dirty
    setIsDirty({
      newPassword: true,
      confirmPassword: true,
    });

    // Validate form
    const errors: ValidationErrors = {};
    
    // Validate new password
    if (!formState.newPassword) {
      errors.newPassword = [passwordMessages.newPasswordRequired];
    } else {
      const passwordValidation = validatePasswordStrength(formState.newPassword, undefined, locale);
      if (!passwordValidation.isValid) {
        errors.newPassword = passwordValidation.errors;
      }
    }
    
    // Validate confirm password
    if (!formState.confirmPassword) {
      errors.confirmPassword = [passwordMessages.confirmPasswordRequired];
    } else if (formState.newPassword !== formState.confirmPassword) {
      errors.confirmPassword = [passwordMessages.passwordsDoNotMatch];
    }

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsLoading(true);

    try {
      // For now, we'll update the password directly
      // In a production app, you'd want to verify the current password first
      const { error: updateError } = await supabase.auth.updateUser({
        password: formState.newPassword
      });

      if (updateError) {
        throw updateError;
      }

      // Success - clear form and show success message
      setFormState({
        newPassword: '',
        confirmPassword: '',
      });
      setValidationErrors({});
      setIsDirty({
        newPassword: false,
        confirmPassword: false,
      });

      // Show success notification
      addNotification({
        type: 'success',
        title: t('settings.password.success', 'Password updated successfully'),
        message: t('settings.password.successMessage', 'Your password has been changed successfully.'),
        duration: 5000,
      });

      onSuccess?.();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : passwordMessages.unexpectedError;
      setValidationErrors({
        general: [t('settings.password.errors.updateFailed', 'Failed to update password. Please try again.')]
      });
      
      // Show error notification
      addNotification({
        type: 'error',
        title: t('settings.password.errors.updateFailed', 'Failed to update password'),
        message: errorMessage,
        duration: 7000,
      });
      
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = getNewPasswordStrength();
  const requirements = getPasswordRequirementsText(undefined, locale);

  return (
    <form 
      onSubmit={handleSubmit} 
      className="space-y-4 sm:space-y-6"
      aria-label={t('settings.password.formLabel', 'Change password form')}
    >
      {/* General errors */}
      {validationErrors.general && validationErrors.general.length > 0 && (
        <div 
          className="p-3 sm:p-4 border border-red-200 bg-red-50 rounded-lg"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span className="text-xs sm:text-sm font-medium">
              {formatValidationErrors(validationErrors.general)}
            </span>
          </div>
        </div>
      )}



      {/* New Password */}
      <div className="space-y-2">
        <Label htmlFor="new-password">
          {t('settings.password.newPassword', 'New Password')}
        </Label>
        <div className="relative">
          <Input
            id="new-password"
            type={showPasswords.new ? 'text' : 'password'}
            value={formState.newPassword}
            onChange={(e) => handleInputChange('newPassword', e.target.value)}
            disabled={isLoading}
            className={cn(
              hasFieldError(validationErrors, 'newPassword') && isDirty.newPassword
                ? 'border-red-500 focus-visible:ring-red-500'
                : ''
            )}
            placeholder={t('settings.password.newPasswordPlaceholder', 'Enter your new password')}
            aria-describedby={`new-password-help ${hasFieldError(validationErrors, 'newPassword') && isDirty.newPassword ? 'new-password-error' : ''}`}
            aria-invalid={hasFieldError(validationErrors, 'newPassword') && isDirty.newPassword}
            autoComplete="new-password"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => togglePasswordVisibility('new')}
            disabled={isLoading}
            aria-label={showPasswords.new 
              ? t('settings.password.hidePassword', 'Hide password') 
              : t('settings.password.showPassword', 'Show password')
            }
          >
            {showPasswords.new ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </div>

        {/* Password Strength Indicator */}
        {formState.newPassword && passwordStrength && (
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm text-muted-foreground">
                {t('settings.password.strength', 'Password strength:')}
              </span>
              <span className={cn('text-xs sm:text-sm font-medium', getPasswordStrengthColor(passwordStrength.strength))}>
                {getPasswordStrengthLabel(passwordStrength.strength, locale)}
              </span>
            </div>
            
            {/* Strength Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
              <div
                className={cn(
                  'h-1.5 sm:h-2 rounded-full transition-all duration-300',
                  passwordStrength.strength === 'weak' && 'w-1/3 bg-red-500',
                  passwordStrength.strength === 'medium' && 'w-2/3 bg-yellow-500',
                  passwordStrength.strength === 'strong' && 'w-full bg-green-500'
                )}
              />
            </div>
          </div>
        )}

        {hasFieldError(validationErrors, 'newPassword') && isDirty.newPassword && (
          <div className="space-y-1" id="new-password-error" role="alert" aria-live="polite">
            {validationErrors.newPassword?.map((error, index) => (
              <p key={index} className="text-sm text-red-600">{error}</p>
            ))}
          </div>
        )}

        {/* Password Requirements */}
        {formState.newPassword && (
          <div className="space-y-2" id="new-password-help">
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t('settings.password.requirements', 'Password requirements:')}
            </p>
            <ul className="space-y-1" role="list" aria-label={t('settings.password.requirementsList', 'Password requirements list')}>
              {requirements.map((requirement, index) => {
                const isValid = passwordStrength?.errors.length === 0 || 
                  !passwordStrength?.errors.some(error => error.includes(requirement.toLowerCase()));
                
                return (
                  <li key={index} className="flex items-start gap-2 text-xs sm:text-sm" role="listitem">
                    {isValid ? (
                      <CheckCircle 
                        className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" 
                        aria-hidden="true"
                      />
                    ) : (
                      <div 
                        className="h-3 w-3 rounded-full border border-gray-300 mt-0.5 flex-shrink-0" 
                        aria-hidden="true"
                      />
                    )}
                    <span 
                      className={cn(isValid ? 'text-green-700' : 'text-muted-foreground')}
                      aria-label={`${requirement} ${isValid ? t('settings.password.satisfied', 'satisfied') : t('settings.password.notSatisfied', 'not satisfied')}`}
                    >
                      {requirement}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirm-password">
          {t('settings.password.confirmPassword', 'Confirm New Password')}
        </Label>
        <div className="relative">
          <Input
            id="confirm-password"
            type={showPasswords.confirm ? 'text' : 'password'}
            value={formState.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            disabled={isLoading}
            className={cn(
              hasFieldError(validationErrors, 'confirmPassword') && isDirty.confirmPassword
                ? 'border-red-500 focus-visible:ring-red-500'
                : ''
            )}
            placeholder={t('settings.password.confirmPasswordPlaceholder', 'Confirm your new password')}
            aria-describedby={hasFieldError(validationErrors, 'confirmPassword') && isDirty.confirmPassword ? 'confirm-password-error' : undefined}
            aria-invalid={hasFieldError(validationErrors, 'confirmPassword') && isDirty.confirmPassword}
            autoComplete="new-password"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => togglePasswordVisibility('confirm')}
            disabled={isLoading}
            aria-label={showPasswords.confirm 
              ? t('settings.password.hideConfirmPassword', 'Hide confirm password') 
              : t('settings.password.showConfirmPassword', 'Show confirm password')
            }
          >
            {showPasswords.confirm ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </div>
        {hasFieldError(validationErrors, 'confirmPassword') && isDirty.confirmPassword && (
          <p className="text-sm text-red-600" id="confirm-password-error" role="alert" aria-live="polite">
            {getFieldError(validationErrors, 'confirmPassword')}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={isLoading || Object.keys(validationErrors).length > 0}
          className="w-full sm:w-auto min-w-[140px]"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              {t('settings.password.updating', 'Updating...')}
            </div>
          ) : (
            t('settings.password.updateButton', 'Update Password')
          )}
        </Button>
      </div>
    </form>
  );
}