import { SettingsForm } from './settings-form';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings, preferences, and integrations.
        </p>
      </div>
      <SettingsForm />
    </div>
  )
}
