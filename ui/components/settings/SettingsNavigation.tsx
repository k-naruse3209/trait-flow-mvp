'use client'

import { useTranslations } from '@/components/translation-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Key, User, Settings, Shield } from 'lucide-react';
import { useRef } from 'react';

export type SettingsSectionType = 'password' | 'profile' | 'preferences' | 'security';

interface SettingsNavigationProps {
  activeSection: SettingsSectionType;
  onSectionChange: (section: SettingsSectionType) => void;
}

interface NavigationItem {
  id: SettingsSectionType;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultLabel: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'password',
    labelKey: 'settings.navigation.password',
    icon: Key,
    defaultLabel: 'Password'
  },
  {
    id: 'profile',
    labelKey: 'settings.navigation.profile',
    icon: User,
    defaultLabel: 'Profile'
  },
  {
    id: 'preferences',
    labelKey: 'settings.navigation.preferences',
    icon: Settings,
    defaultLabel: 'Preferences'
  },
  {
    id: 'security',
    labelKey: 'settings.navigation.security',
    icon: Shield,
    defaultLabel: 'Security'
  }
];

export function SettingsNavigation({ 
  activeSection, 
  onSectionChange 
}: SettingsNavigationProps) {
  const t = useTranslations();
  const mobileNavRef = useRef<HTMLDivElement>(null);

  // Handle keyboard navigation for mobile tabs
  const handleKeyDown = (event: React.KeyboardEvent, currentIndex: number) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const direction = event.key === 'ArrowLeft' ? -1 : 1;
      const newIndex = (currentIndex + direction + navigationItems.length) % navigationItems.length;
      const newSection = navigationItems[newIndex].id;
      onSectionChange(newSection);
      
      // Focus the new tab
      setTimeout(() => {
        const buttons = mobileNavRef.current?.querySelectorAll('button');
        if (buttons && buttons[newIndex]) {
          buttons[newIndex].focus();
        }
      }, 0);
    }
  };

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <div className="hidden md:block">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t('settings.navigation.title', 'Settings')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <nav role="navigation" aria-label={t('settings.navigation.ariaLabel', 'Settings navigation')}>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? 'default' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-2',
                      isActive && 'bg-primary text-primary-foreground'
                    )}
                    onClick={() => onSectionChange(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={`${t(item.labelKey, item.defaultLabel)} ${isActive ? t('settings.navigation.currentSection', '(current section)') : ''}`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {t(item.labelKey, item.defaultLabel)}
                  </Button>
                );
              })}
            </nav>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="md:hidden">
        <Card>
          <CardContent className="p-2">
            <nav role="navigation" aria-label={t('settings.navigation.ariaLabel', 'Settings navigation')}>
              <div className="flex space-x-1 overflow-x-auto" role="tablist" ref={mobileNavRef}>
                {navigationItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  
                  return (
                    <Button
                      key={item.id}
                      variant={isActive ? 'default' : 'ghost'}
                      size="sm"
                      className={cn(
                        'flex-shrink-0 gap-1 text-xs',
                        isActive && 'bg-primary text-primary-foreground'
                      )}
                      onClick={() => onSectionChange(item.id)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={`settings-panel-${item.id}`}
                      tabIndex={isActive ? 0 : -1}
                      id={`${item.id}-tab`}
                    >
                      <Icon className="h-3 w-3" aria-hidden="true" />
                      {t(item.labelKey, item.defaultLabel)}
                    </Button>
                  );
                })}
              </div>
            </nav>
          </CardContent>
        </Card>
      </div>
    </>
  );
}