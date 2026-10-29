"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { BlockedUsersList } from "@/components/shared/blocked-users-list"
import {
  updateUserSettingsAction,
  updateAccountDetailsAction,
  updatePasswordAction,
  deleteAccountAction,
} from "@/lib/actions/settings"
import { signOutAction } from "@/app/(auth)/actions"
import { toast } from "sonner"
import type { Profile, UserSettings } from "@/types/database"
import {
  User,
  Palette,
  Bell,
  Shield,
  Sparkles,
  Sun,
  Moon,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  LogOut,
  Trash2,
  Lock,
  ExternalLink,
} from "lucide-react"

interface SettingsViewProps {
  initialProfile: Profile
  initialSettings: UserSettings
  userEmail: string
}

export function SettingsView({
  initialProfile,
  initialSettings,
  userEmail,
}: SettingsViewProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  // 1. Account State
  const [fullName, setFullName] = useState(initialProfile.full_name || "")
  const [username, setUsername] = useState(initialProfile.username || "")
  const [email, setEmail] = useState(userEmail)
  const [accountSaving, setAccountSaving] = useState(false)

  // Password State
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordSaving, setPasswordSaving] = useState(false)

  // Delete Account State
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)

  // 2. Preferences & Notifications State
  const [settings, setSettings] = useState<UserSettings>(initialSettings)
  const [savingSettings, setSavingSettings] = useState(false)

  // Handlers for Account Updates
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    setAccountSaving(true)

    const res = await updateAccountDetailsAction({
      fullName,
      username,
      email,
    })

    setAccountSaving(false)

    if (res.success) {
      if (res.emailChangePending) {
        toast.info("Account details updated! A confirmation link was sent to your new email address.")
      } else {
        toast.success("Account profile successfully saved.")
      }
      router.refresh()
    } else {
      toast.error(res.error || "Failed to update account.")
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters.")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.")
      return
    }

    setPasswordSaving(true)
    const res = await updatePasswordAction({ newPassword })
    setPasswordSaving(false)

    if (res.success) {
      toast.success("Password successfully changed.")
      setNewPassword("")
      setConfirmPassword("")
    } else {
      toast.error(res.error || "Failed to update password.")
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE MY ACCOUNT") {
      toast.error('Please type "DELETE MY ACCOUNT" to confirm.')
      return
    }

    setDeleteLoading(true)
    const res = await deleteAccountAction({ confirmation: deleteConfirmation })
    setDeleteLoading(false)

    if (res.success) {
      toast.success("Account deleted. Signing out.")
      router.replace("/")
    } else {
      toast.error(res.error || "Failed to delete account.")
    }
  }

  // Handlers for Appearance & Settings
  const handleThemeChange = async (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme)
    setSettings((prev) => ({ ...prev, theme: newTheme }))

    const res = await updateUserSettingsAction({ theme: newTheme })
    if (res.success) {
      toast.success(`Theme set to ${newTheme}`)
    }
  }

  const handleSettingToggle = async (key: keyof UserSettings, value: any) => {
    const updated = { ...settings, [key]: value }
    setSettings(updated)

    const res = await updateUserSettingsAction({ [key]: value })
    if (res.success) {
      toast.success("Preferences updated.")
    } else {
      toast.error("Failed to update preference.")
      setSettings(settings) // rollback
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Platform Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your account credentials, interface themes, privacy boundaries, and notification alerts
        </p>
      </div>

      {/* Tabbed Navigation Layout */}
      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 rounded-2xl h-auto p-1.5 bg-muted/60">
          <TabsTrigger value="account" className="rounded-xl text-xs font-semibold py-2.5 gap-1.5">
            <User className="h-3.5 w-3.5" />
            <span>Account</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="rounded-xl text-xs font-semibold py-2.5 gap-1.5">
            <Palette className="h-3.5 w-3.5" />
            <span>Appearance</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-xl text-xs font-semibold py-2.5 gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="rounded-xl text-xs font-semibold py-2.5 gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            <span>Privacy &amp; Safety</span>
          </TabsTrigger>
          <TabsTrigger value="skills" className="rounded-xl text-xs font-semibold py-2.5 gap-1.5 col-span-2 sm:col-span-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Skills &amp; Profile</span>
          </TabsTrigger>
        </TabsList>

        {/* ==================================================================== */}
        {/* 1. ACCOUNT TAB                                                       */}
        {/* ==================================================================== */}
        <TabsContent value="account" className="space-y-6 mt-0">
          {/* Profile Details Form */}
          <Card className="card-soft">
            <CardHeader>
              <CardTitle className="text-base font-bold font-heading">
                Personal Credentials
              </CardTitle>
              <CardDescription className="text-xs">
                Update your display name, public username handle, and primary email address
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveAccount} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Full Name</label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className="rounded-xl text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Username</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                        @
                      </span>
                      <Input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="janedoe"
                        className="rounded-xl text-xs pl-7 font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Registered Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@university.edu"
                    className="rounded-xl text-xs"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Modifying your email address will generate a confirmation verification link before updating.
                  </p>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={accountSaving}
                    className="rounded-xl text-xs font-semibold bg-primary text-primary-foreground min-w-[120px]"
                  >
                    {accountSaving ? "Saving..." : "Save Account"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Password Form */}
          <Card className="card-soft">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-secondary" />
                <CardTitle className="text-base font-bold font-heading">
                  Password &amp; Security
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Update your account password with a secure phrase (minimum 8 characters)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">New Password</label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="rounded-xl text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Confirm New Password</label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="rounded-xl text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={passwordSaving || !newPassword}
                    className="rounded-xl text-xs font-semibold"
                  >
                    {passwordSaving ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Session Termination */}
          <Card className="card-soft">
            <CardHeader>
              <CardTitle className="text-base font-bold font-heading">Session Management</CardTitle>
              <CardDescription className="text-xs">
                Terminate active user authentication on this browser
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form action={signOutAction}>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out of Pairly</span>
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Danger Zone: Delete Account */}
          <Card className="card-soft border-destructive/30 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-base font-bold font-heading text-destructive flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                <span>Delete Account (Danger Zone)</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Permanently delete your profile, listings, exchange history, and reviews. This action cannot be reversed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              <p className="text-xs text-muted-foreground">
                To confirm permanent deletion, type <span className="font-mono font-bold text-foreground">DELETE MY ACCOUNT</span> below:
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  className="rounded-xl text-xs font-mono max-w-sm"
                />
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deleteConfirmation !== "DELETE MY ACCOUNT" || deleteLoading}
                  onClick={handleDeleteAccount}
                  className="rounded-xl text-xs font-semibold gap-2 shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{deleteLoading ? "Deleting..." : "Permanently Delete Account"}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================================================================== */}
        {/* 2. APPEARANCE TAB                                                    */}
        {/* ==================================================================== */}
        <TabsContent value="appearance" className="space-y-6 mt-0">
          <Card className="card-soft">
            <CardHeader>
              <CardTitle className="text-base font-bold font-heading">
                Interface Color Scheme
              </CardTitle>
              <CardDescription className="text-xs">
                Select your preferred visual mode. Your preference will be persisted across devices.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Light Theme Card */}
                <div
                  onClick={() => handleThemeChange("light")}
                  className={`cursor-pointer rounded-2xl border-2 p-4 transition-all space-y-3 ${
                    theme === "light"
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:border-primary/40 bg-card"
                  }`}
                >
                  <div className="h-24 rounded-xl bg-[#F8F9FA] border border-border p-2.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="h-3 w-16 bg-[#4B3F72] rounded-full" />
                      <div className="h-3 w-3 bg-[#A78BFA] rounded-full" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-2 w-full bg-slate-200 rounded" />
                      <div className="h-2 w-2/3 bg-slate-200 rounded" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4 text-amber-500" />
                      <span className="text-xs font-bold text-foreground">Light Theme</span>
                    </div>
                    {theme === "light" && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </div>

                {/* Dark Theme Card */}
                <div
                  onClick={() => handleThemeChange("dark")}
                  className={`cursor-pointer rounded-2xl border-2 p-4 transition-all space-y-3 ${
                    theme === "dark"
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:border-primary/40 bg-card"
                  }`}
                >
                  <div className="h-24 rounded-xl bg-[#0F0D15] border border-border/60 p-2.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="h-3 w-16 bg-[#A78BFA] rounded-full" />
                      <div className="h-3 w-3 bg-[#10B981] rounded-full" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-2 w-full bg-slate-800 rounded" />
                      <div className="h-2 w-2/3 bg-slate-800 rounded" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold text-foreground">Dark Theme</span>
                    </div>
                    {theme === "dark" && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </div>

                {/* System Theme Card */}
                <div
                  onClick={() => handleThemeChange("system")}
                  className={`cursor-pointer rounded-2xl border-2 p-4 transition-all space-y-3 ${
                    theme === "system"
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:border-primary/40 bg-card"
                  }`}
                >
                  <div className="h-24 rounded-xl bg-gradient-to-r from-[#F8F9FA] to-[#0F0D15] border border-border p-2.5 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="h-3 w-16 bg-[#4B3F72] rounded-full" />
                      <div className="h-3 w-3 bg-[#A78BFA] rounded-full" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-2 w-full bg-slate-400/50 rounded" />
                      <div className="h-2 w-2/3 bg-slate-400/50 rounded" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Laptop className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-bold text-foreground">System Default</span>
                    </div>
                    {theme === "system" && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================================================================== */}
        {/* 3. NOTIFICATIONS TAB                                                 */}
        {/* ==================================================================== */}
        <TabsContent value="notifications" className="space-y-6 mt-0">
          <Card className="card-soft">
            <CardHeader>
              <CardTitle className="text-base font-bold font-heading">
                Notification Preferences
              </CardTitle>
              <CardDescription className="text-xs">
                Control which activity triggers email messages and in-app bell updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-1 divide-y divide-border">
              {/* Email Notifications */}
              <div className="flex items-center justify-between pt-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    Receive email digests for critical exchange updates and messages
                  </p>
                </div>
                <Switch
                  checked={settings.email_notifications}
                  onCheckedChange={(val) => handleSettingToggle("email_notifications", val)}
                />
              </div>

              {/* Connection Requests */}
              <div className="flex items-center justify-between pt-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">Exchange Requests</p>
                  <p className="text-xs text-muted-foreground">
                    Alert when a peer requests a skill exchange or accepts an offer
                  </p>
                </div>
                <Switch
                  checked={settings.notify_new_request}
                  onCheckedChange={(val) => handleSettingToggle("notify_new_request", val)}
                />
              </div>

              {/* Chat Messages */}
              <div className="flex items-center justify-between pt-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">Direct Messages</p>
                  <p className="text-xs text-muted-foreground">
                    Alert on incoming peer messages in active connection threads
                  </p>
                </div>
                <Switch
                  checked={settings.notify_messages}
                  onCheckedChange={(val) => handleSettingToggle("notify_messages", val)}
                />
              </div>

              {/* Reviews */}
              <div className="flex items-center justify-between pt-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">Post-Exchange Reviews</p>
                  <p className="text-xs text-muted-foreground">
                    Alert when a partner completes an exchange and leaves feedback
                  </p>
                </div>
                <Switch
                  checked={settings.notify_reviews}
                  onCheckedChange={(val) => handleSettingToggle("notify_reviews", val)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================================================================== */}
        {/* 4. PRIVACY & SAFETY TAB                                              */}
        {/* ==================================================================== */}
        <TabsContent value="privacy" className="space-y-6 mt-0">
          {/* Identity & Verification Shortcut Card */}
          <Card className="card-soft border-primary/20 bg-gradient-to-r from-primary/5 via-card to-emerald-500/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base font-bold font-heading">
                    Identity &amp; Scholar Verification
                  </CardTitle>
                </div>
                {initialProfile.is_verified ? (
                  <Badge className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 gap-1 text-xs font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Verified Scholar</span>
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-amber-600 dark:text-amber-400">
                    Not Verified
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs">
                Unlock the Verified Scholar badge, +50 points, and priority placement in Smart Matching
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <p className="text-xs text-muted-foreground">
                Upload your student ID or institutional credentials for quick administrative review.
              </p>
              <Link href="/settings/verification">
                <Button size="sm" className="rounded-xl text-xs font-semibold gap-1.5 bg-primary text-primary-foreground shrink-0">
                  <span>{initialProfile.is_verified ? "View Verification" : "Submit Verification"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Privacy Visibility Settings */}
          <Card className="card-soft">
            <CardHeader>
              <CardTitle className="text-base font-bold font-heading">Profile Visibility</CardTitle>
              <CardDescription className="text-xs">
                Define who can view your profile details and listings in Explore
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-1 divide-y divide-border">
              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">Show City Location</p>
                  <p className="text-xs text-muted-foreground">
                    Display your city ({initialProfile.city || "Not set"}) on your public profile card
                  </p>
                </div>
                <Switch
                  checked={settings.show_city}
                  onCheckedChange={(val) => handleSettingToggle("show_city", val)}
                />
              </div>

              <div className="flex items-center justify-between pt-3">
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">Members-Only Profile</p>
                  <p className="text-xs text-muted-foreground">
                    Restrict profile view strictly to authenticated community scholars
                  </p>
                </div>
                <Switch
                  checked={settings.profile_visibility === "members_only"}
                  onCheckedChange={(val) =>
                    handleSettingToggle("profile_visibility", val ? "members_only" : "public")
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Blocked Accounts Section */}
          <Card className="card-soft">
            <CardHeader>
              <CardTitle className="text-base font-bold font-heading">
                Blocked Accounts
              </CardTitle>
              <CardDescription className="text-xs">
                Manage restricted accounts prevented from matching or contacting you
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-1">
              <BlockedUsersList />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================================================================== */}
        {/* 5. SKILLS & PREFERENCES TAB                                          */}
        {/* ==================================================================== */}
        <TabsContent value="skills" className="space-y-6 mt-0">
          <Card className="card-soft">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-bold font-heading">
                  Skills &amp; Match Profile
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Manage your offered and wanted skill sets used in the Smart Matching algorithm
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your skills determine compatibility percentages with other scholars and teachers on Pairly. Keep them updated to receive the best match suggestions!
              </p>

              <div className="grid gap-3 sm:grid-cols-2 pt-2">
                <Link href="/onboarding/skills" className="block">
                  <Button variant="outline" className="w-full rounded-xl text-xs font-semibold gap-2 h-11 justify-start">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>Edit Skills Catalog (Offered &amp; Wanted)</span>
                  </Button>
                </Link>

                <Link href="/my-listings" className="block">
                  <Button variant="outline" className="w-full rounded-xl text-xs font-semibold gap-2 h-11 justify-start">
                    <ExternalLink className="h-4 w-4 text-secondary" />
                    <span>Manage My Exchange Listings</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
