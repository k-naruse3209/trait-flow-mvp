'use client'

import { useState } from 'react';
import { useTranslations } from '@/components/translation-provider';
import { SettingsNavigation } from './SettingsNavigation';
import { SettingsSection } from './SettingsSection';
import { PasswordChangeForm } from './PasswordChangeForm';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { NotificationContainer } from '@/components/NotificationContainer';

export type SettingsSectionType = 'password' | 'profile' | 'preferences' | 'security';

export function SettingsClient() {
  const [activeSection, setActiveSection] = useState<SettingsSectionType>('password');
  const t = useTranslations();

  const handleSectionChange = (section: SettingsSectionType) => {
    setActiveSection(section);
  };

  return (
    <NotificationProvider>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1">
          <SettingsNavigation
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
          />
        </div>

        {/* Content Area */}
        <div className="md:col-span-3">
          {activeSection === 'password' && (
            <SettingsSection
              title={t('settings.password.title', 'Change Password')}
              description={t('settings.password.description', 'Update your account password')}
            >
              <div id="settings-panel-password" role="tabpanel" aria-labelledby="password-tab">
                <PasswordChangeForm />
              </div>
            </SettingsSection>
          )}
          
          {activeSection === 'profile' && (
            <SettingsSection
              title={t('settings.profile.title', 'Profile Settings')}
              description={t('settings.profile.description', 'Manage your profile information')}
            >
              <div id="settings-panel-profile" role="tabpanel" aria-labelledby="profile-tab">
                <div className="space-y-4">
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                    <p className="text-muted-foreground">
                      {t('settings.profile.comingSoon', 'Profile settings coming soon...')}
                    </p>
                  </div>
                </div>
              </div>
            </SettingsSection>
          )}
          
          {activeSection === 'preferences' && (
            <SettingsSection
              title={t('settings.preferences.title', 'Preferences')}
              description={t('settings.preferences.description', 'Customize your experience')}
            >
              <div id="settings-panel-preferences" role="tabpanel" aria-labelledby="preferences-tab">
                <div className="space-y-4">
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                    <p className="text-muted-foreground">
                      {t('settings.preferences.comingSoon', 'Preferences coming soon...')}
                    </p>
                  </div>
                </div>
              </div>
            </SettingsSection>
          )}
          
          {activeSection === 'security' && (
            <SettingsSection
              title={t('settings.security.title', 'Security Settings')}
              description={t('settings.security.description', 'Manage your account security')}
            >
              <div id="settings-panel-security" role="tabpanel" aria-labelledby="security-tab">
                <div className="space-y-4">
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                    <p className="text-muted-foreground">
                      {t('settings.security.comingSoon', 'Security settings coming soon...')}
                    </p>
                  </div>
                </div>
              </div>
            </SettingsSection>
          )}
        </div>
      </div>
      
      {/* Notification Container */}
      <NotificationContainer />
    </NotificationProvider>
  );
}