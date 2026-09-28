'use client'

import React, { useEffect, useState } from 'react'
import {
  ShieldCheck,
  Users,
  CheckCircle,
  XCircle,
  KeyRound,
  Building,
  Clock,
  Sparkles,
  Lock,
  UserPlus,
  Pencil,
  Save,
  X,
  ClipboardList,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card'
import { RestrictedActionPanel } from '../../../components/ui/RestrictedAction'
import { Badge } from '../../../components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table'
import { ROLE_DESCRIPTIONS, ROLE_PERMISSIONS } from '../../../lib/permissions/roles'
import { formatInitials } from '../../../utils/format'
import { User, UserRole } from '../../../types/user'
import ActivityLogPanel from '../../../components/settings/ActivityLogPanel'
import { SettingsTourReplayButton } from '../../../components/onboarding/OnboardingTour'

type SettingsTab = 'team' | 'permissions' | 'organization' | 'activity'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('team')
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [teamLoading, setTeamLoading] = useState(true)
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null)
  const [roleDrafts, setRoleDrafts] = useState<Record<string, UserRole>>({})
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null)
  const [roleMessages, setRoleMessages] = useState<Record<string, { kind: 'success' | 'error'; text: string }>>({})
  const [teamError, setTeamError] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('STAFF')
  const [inviteStatus, setInviteStatus] = useState('')
  const [inviting, setInviting] = useState(false)

  async function sendInvitation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (currentRole !== 'ADMIN') {
      setInviteStatus('Only administrators can invite staff.')
      return
    }
    setInviteStatus('')
    setInviting(true)
    try {
      const response = await fetch('/api/invitations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, name: inviteName, role: inviteRole }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Invitation could not be sent.')
      setInviteStatus(result.message)
      setInviteEmail('')
      setInviteName('')
    } catch (error) {
      setInviteStatus(error instanceof Error ? error.message : 'Invitation could not be sent.')
    } finally { setInviting(false) }
  }

  async function saveUserRole(userId: string) {
    if (currentRole !== 'ADMIN') {
      setRoleMessages((current) => ({ ...current, [userId]: { kind: 'error', text: 'Access denied: only administrators can change staff roles.' } }))
      return
    }
    const role = roleDrafts[userId]
    if (!role) return
    setSavingRoleId(userId)
    setRoleMessages((current) => ({ ...current, [userId]: { kind: 'success', text: '' } }))
    try {
      const response = await fetch('/api/team', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not update staff role.')
      if (result.data) setUsers((current) => current.map((user) => user.id === userId ? result.data as User : user))
      setEditingRoleId(null)
      setRoleMessages((current) => ({ ...current, [userId]: { kind: 'success', text: result.message || 'Staff role updated.' } }))
    } catch (error) {
      setRoleMessages((current) => ({ ...current, [userId]: { kind: 'error', text: error instanceof Error ? error.message : 'Could not update staff role.' } }))
    } finally {
      setSavingRoleId(null)
    }
  }

  useEffect(() => {
    document.querySelector<HTMLElement>('[data-tour="platform-settings"]')?.setAttribute('data-tour-ready', 'true')
    let cancelled = false
    async function loadSettingsAccess() {
      try {
        const authResponse = await fetch('/api/auth')
        const auth = await authResponse.json()
        if (!authResponse.ok || !auth.user) throw new Error('Unable to verify account permissions.')
        const role = auth.user.role as UserRole
        if (cancelled) return
        setCurrentRole(role)
        setCurrentUserId(auth.user.id as string)

        const teamResponse = await fetch('/api/team')
        const result = await teamResponse.json()
        if (!teamResponse.ok) throw new Error(result.error || 'Unable to load staff directory')
        if (!cancelled) setUsers(result.data)
      } catch (error) {
        if (!cancelled) setTeamError(error instanceof Error ? error.message : 'Unable to load settings access')
      }
    }
    void loadSettingsAccess().finally(() => { if (!cancelled) setTeamLoading(false) })
    return () => { cancelled = true }
  }, [])

  const capabilities = [
    { key: 'session:create', label: 'Create & Publish Sessions', description: 'Schedule new lectures, workshops, and youth outreach' },
    { key: 'session:edit', label: 'Edit Active Sessions', description: 'Update venues, dates, Kigali timings, and descriptions' },
    { key: 'session:delete', label: 'Delete Sessions & Attendee Data (Admin only)', description: 'Permanently remove a session, its check-in records, and session questions' },
    { key: 'session:override', label: 'Extend Check-in Window (Admin only)', description: 'Temporarily accept attendance outside scheduled check-in hours' },
    { key: 'attendance:view', label: 'View Attendee Rosters', description: 'Inspect real-time check-in entries and attendee reflections' },
    { key: 'attendance:record', label: 'Conduct Attendee Check-In', description: 'Assist participants with mobile attendance registration' },
    { key: 'attendance:export', label: 'Export Data (CSV / Excel)', description: 'Download complete participant records and contact information' },
    { key: 'qr:generate', label: 'Generate Branded QR & Flyers', description: 'Produce 1200x1650 print-ready promotional posters' },
    { key: 'users:manage', label: 'Manage Team & Assign Roles (Admin only)', description: 'Invite staff members and adjust authorization levels' },
    { key: 'communications:send', label: 'Use Full Communications', description: 'Manage recipients, preview messages, and send branded updates' },
    { key: 'activity:view', label: 'View Staff Activity Log (Admin only)', description: 'Review who performed staff actions and when' },
    { key: 'settings:manage', label: 'Platform & Security Settings', description: 'Configure organization defaults and security policies' },
  ]

  const roles: UserRole[] = ['ADMIN', 'MANAGER', 'STAFF', 'VIEWER']

  return (
    <div data-tour="platform-settings" aria-busy={currentRole === null} className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3.5 pb-4 border-b border-slate-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/NiCE-Logo-Animated.gif"
          alt="NiCE Club Rwanda"
          className="w-12 h-12 rounded-xl object-contain bg-white shadow-subtle p-0.5 border border-slate-200/80"
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Settings & Access Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage organization settings, staff accounts, and role-based permissions (RBAC).
          </p>
        </div>
        <SettingsTourReplayButton />
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('team')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'team'
              ? 'border-nice-blue-600 text-nice-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{currentRole === 'ADMIN' ? `Staff Directory (${users.length})` : 'Team Access'}</span>
        </button>

        <button
          onClick={() => setActiveTab('permissions')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'permissions'
              ? 'border-nice-blue-600 text-nice-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Role Permissions (RBAC)</span>
        </button>

        <button
          onClick={() => setActiveTab('organization')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'organization'
              ? 'border-nice-blue-600 text-nice-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Platform Defaults</span>
        </button>

        {currentRole === 'ADMIN' && <button
          onClick={() => setActiveTab('activity')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'activity'
              ? 'border-nice-blue-600 text-nice-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Activity Log</span>
        </button>}
      </div>

      {/* Tab 1: Staff Directory */}
      {activeTab === 'team' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {currentRole === null && <p className={teamError ? 'text-sm text-rose-700' : 'text-sm text-slate-500'} role={teamError ? 'alert' : 'status'}>{teamError || 'Checking staff directory access…'}</p>}
          {currentRole !== null && currentRole !== 'ADMIN' && <Card>
            <CardHeader>
              <CardTitle>Invite a team member</CardTitle>
              <CardDescription>Staff invitations are restricted to administrators.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RestrictedActionPanel message={`Access denied: your ${ROLE_DESCRIPTIONS[currentRole].title} role cannot invite staff. Ask an administrator to send the invitation.`}>
              <fieldset disabled aria-disabled="true" className="grid grid-cols-1 gap-3 opacity-70 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
                <label className="text-xs font-semibold text-slate-700">Email address<input type="email" readOnly placeholder="Admin access required" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm" /></label>
                <label className="text-xs font-semibold text-slate-700">Name (optional)<input readOnly placeholder="Admin access required" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm" /></label>
                <label className="text-xs font-semibold text-slate-700">Role<select disabled defaultValue="STAFF" className="mt-1.5 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm"><option value="STAFF">Field Coordinator / Staff</option></select></label>
                <button type="button" disabled className="rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white opacity-50">Send invitation</button>
              </fieldset>
              </RestrictedActionPanel>
            </CardContent>
          </Card>}
          {currentRole === 'ADMIN' && <Card>
            <CardHeader>
              <CardTitle>Invite a team member</CardTitle>
              <CardDescription>Administrator-only. The invitation link expires after seven days.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={sendInvitation} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
                <label className="text-xs font-semibold text-slate-700">Email address<input required type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" placeholder="colleague@example.rw" /></label>
                <label className="text-xs font-semibold text-slate-700">Name (optional)<input value={inviteName} onChange={(event) => setInviteName(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" placeholder="Colleague name" /></label>
                <label className="text-xs font-semibold text-slate-700">Role<select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as UserRole)} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm">{(['ADMIN', 'MANAGER', 'STAFF', 'VIEWER'] as UserRole[]).map((role) => <option key={role} value={role}>{ROLE_DESCRIPTIONS[role].title}</option>)}</select></label>
                <button disabled={inviting} className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-60"><UserPlus className="h-4 w-4" />{inviting ? 'Sending…' : 'Send invitation'}</button>
              </form>
              {inviteStatus && <p role="status" className="mt-3 text-sm text-slate-700">{inviteStatus}</p>}
            </CardContent>
          </Card>}
          {currentRole !== null && <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>{currentRole === 'ADMIN' ? 'Authorized Staff Accounts' : 'Current Staff Members'}</CardTitle>
                <CardDescription>
                  {currentRole === 'ADMIN' ? 'Verified NiCE Club team members with access to the operations platform.' : 'Read-only directory of staff accounts currently registered on the platform.'}
                </CardDescription>
              </div>
              <Badge variant="info" size="sm">
                {teamLoading ? 'Loading…' : `${users.filter((user) => user.isActive).length} Active Accounts`}
              </Badge>
            </CardHeader>
            <CardContent>
              {teamError && <p role="alert" className="mb-3 text-sm text-rose-700">{teamError}</p>}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    {currentRole === 'ADMIN' && <TableHead>Email Address</TableHead>}
                    <TableHead>Role</TableHead>
                    {currentRole === 'ADMIN' && <TableHead>Role Actions</TableHead>}
                    <TableHead>Status</TableHead>
                    <TableHead>Permissions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamLoading && <TableRow><TableCell colSpan={currentRole === 'ADMIN' ? 6 : 4} className="py-8 text-center text-sm text-slate-500">Loading staff members…</TableCell></TableRow>}
                  {!teamLoading && users.length === 0 && !teamError && <TableRow><TableCell colSpan={currentRole === 'ADMIN' ? 6 : 4} className="py-8 text-center text-sm text-slate-500">No staff accounts have been created.</TableCell></TableRow>}
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-nice-blue-200 bg-nice-blue-50 text-xs font-bold text-nice-blue-700">
                            <span aria-hidden="true">{formatInitials(user.name)}</span>
                            {user.avatarUrl && (
                              <img
                                src={user.avatarUrl}
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover"
                                onError={(event) => { event.currentTarget.style.display = 'none' }}
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-xs">{user.name}</p>
                            {currentRole === 'ADMIN' && <p className="text-[10px] text-slate-400 font-mono">{user.id}</p>}
                          </div>
                        </div>
                      </TableCell>
                      {currentRole === 'ADMIN' && <TableCell className="text-slate-600 font-mono text-xs">{user.email}</TableCell>}
                      <TableCell>
                        {editingRoleId === user.id ? <select
                          aria-label={`New role for ${user.name}`}
                          value={roleDrafts[user.id] ?? user.role}
                          onChange={(event) => setRoleDrafts((current) => ({ ...current, [user.id]: event.target.value as UserRole }))}
                          className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100"
                        >{(['ADMIN', 'MANAGER', 'STAFF', 'VIEWER'] as UserRole[]).map((role) => <option key={role} value={role}>{role}</option>)}</select> : <Badge
                          variant={user.role === 'ADMIN' ? 'info' : user.role === 'MANAGER' ? 'default' : user.role === 'STAFF' ? 'success' : 'neutral'}
                          size="sm"
                        >{user.role}</Badge>}
                      </TableCell>
                      {currentRole === 'ADMIN' && <TableCell>
                        {user.id === currentUserId ? <span className="text-xs text-slate-400">Your account</span> : editingRoleId === user.id ? <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => void saveUserRole(user.id)} disabled={savingRoleId !== null} className="inline-flex items-center gap-1 rounded-md bg-sky-700 px-2 py-1.5 text-xs font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"><Save className="h-3.5 w-3.5" />{savingRoleId === user.id ? 'Saving…' : 'Save'}</button>
                          <button type="button" onClick={() => setEditingRoleId(null)} disabled={savingRoleId !== null} aria-label="Cancel role change" className="rounded-md border border-slate-300 p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-50"><X className="h-3.5 w-3.5" /></button>
                        </div> : <button type="button" onClick={() => { setRoleDrafts((current) => ({ ...current, [user.id]: user.role })); setEditingRoleId(user.id); setRoleMessages((current) => ({ ...current, [user.id]: { kind: 'success', text: '' } })) }} disabled={savingRoleId !== null} className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2 py-1.5 text-xs font-semibold text-sky-800 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"><Pencil className="h-3.5 w-3.5" />Change role</button>}
                        {roleMessages[user.id]?.text && <p role={roleMessages[user.id].kind === 'error' ? 'alert' : 'status'} className={`mt-1 max-w-44 text-[11px] ${roleMessages[user.id].kind === 'error' ? 'text-rose-700' : 'text-emerald-700'}`}>{roleMessages[user.id].text}</p>}
                      </TableCell>}
                      <TableCell>
                        <Badge variant={user.isActive ? 'success' : 'neutral'} size="sm" dot>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {ROLE_DESCRIPTIONS[user.role].title}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>}
        </div>
      )}

      {/* Tab 2: RBAC Matrix */}
      {activeTab === 'permissions' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <Card>
            <CardHeader>
              <CardTitle>Role-Based Access Control (RBAC) Matrix</CardTitle>
              <CardDescription>
                Server-side enforced capabilities across the four platform operational roles.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">System Capability</TableHead>
                    <TableHead className="text-center">ADMIN</TableHead>
                    <TableHead className="text-center">MANAGER</TableHead>
                    <TableHead className="text-center">STAFF</TableHead>
                    <TableHead className="text-center">VIEWER</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {capabilities.map((cap) => (
                    <TableRow key={cap.key}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-slate-800 text-xs">{cap.label}</p>
                          <p className="text-[11px] text-slate-400">{cap.description}</p>
                        </div>
                      </TableCell>
                      {roles.map((r) => {
                        const has = ROLE_PERMISSIONS[r].includes(cap.key as any)
                        return (
                          <TableCell key={r} className="text-center">
                            {has ? (
                              <CheckCircle className="w-4 h-4 text-emerald-600 mx-auto" />
                            ) : (
                              <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Role Profiles Descriptions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {roles.map((r) => (
              <Card key={r} className="border-slate-200">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{ROLE_DESCRIPTIONS[r].title}</span>
                    <Badge variant={r === 'ADMIN' ? 'info' : 'default'} size="sm">
                      {r}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {ROLE_DESCRIPTIONS[r].description}
                  </p>
                  <div className="text-[10px] text-slate-400 font-medium pt-1">
                    {ROLE_PERMISSIONS[r].length} granted capabilities
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Platform Defaults */}
      {activeTab === 'organization' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <Card>
            <CardHeader>
              <CardTitle>Platform Defaults</CardTitle>
              <CardDescription>Read-only configuration values currently enforced by the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Organization Name</span>
                  <p className="font-bold text-slate-900 text-sm">NiCE Club Rwanda</p>
                  <p className="text-slate-500">Nuclear is Clean Energy</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Canonical Timezone</span>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <Clock className="w-4 h-4 text-nice-blue-600" />
                    <span className="font-bold text-slate-900 text-sm">Africa/Kigali (UTC+2)</span>
                  </div>
                  <p className="text-slate-500">All session check-in windows evaluate in CAT</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Security Architecture</span>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-900 text-sm">HMAC-SHA256 & PBKDF2</span>
                  </div>
                  <p className="text-slate-500">HTTP-only SameSite session cookies</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Visual Identity</span>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <Sparkles className="w-4 h-4 text-nice-blue-600" />
                    <span className="font-bold text-slate-900 text-sm">NiCE Scientific Design</span>
                  </div>
                  <p className="text-slate-500">Bright, modern energy typography & branded flyer engine</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'activity' && currentRole === 'ADMIN' && <ActivityLogPanel />}
    </div>
  )
}
