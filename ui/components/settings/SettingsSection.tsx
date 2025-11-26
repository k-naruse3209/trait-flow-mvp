'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function SettingsSection({ title, description, children }: SettingsSectionProps) {
  const sectionId = title.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <Card role="region" aria-labelledby={`${sectionId}-title`}>
      <CardHeader>
        <CardTitle className="text-xl" id={`${sectionId}-title`}>
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-base" id={`${sectionId}-description`}>
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent 
        className="space-y-6"
        aria-describedby={description ? `${sectionId}-description` : undefined}
      >
        {children}
      </CardContent>
    </Card>
  );
}