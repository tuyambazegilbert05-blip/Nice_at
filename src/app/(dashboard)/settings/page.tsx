'use client'

import React, { useState } from 'react'
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
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table'
import { ROLE_DESCRIPTIONS, ROLE_PERMISSIONS } from '../../../lib/permissions/roles'
import { SEED_USERS } from '../../../lib/auth/constants'
import { formatInitials } from '../../../utils/format'
import { UserRole } from '../../../types/user'

type SettingsTab = 'team' | 'permissions' | 'organization'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('team')

  const capabilities = [
    { key: 'session:create', label: 'Create & Publish Sessions', description: 'Schedule new lectures, workshops, and youth outreach' },
    { key: 'session:edit', label: 'Edit Active Sessions', description: 'Update venues, dates, Kigali timings, and descriptions' },
    { key: 'session:delete', label: 'Archive / Delete Sessions', description: 'Retire sessions and close participation windows' },
    { key: 'attendance:view', label: 'View Attendee Rosters', description: 'Inspect real-time check-in entries and attendee reflections' },
    { key: 'attendance:record', label: 'Conduct Attendee Check-In', description: 'Assist participants with mobile attendance registration' },
    { key: 'attendance:export', label: 'Export Data (CSV / Excel)', description: 'Download complete participant records and contact information' },
    { key: 'qr:generate', label: 'Generate Branded QR & Flyers', description: 'Produce 1200x1650 print-ready promotional posters' },
    { key: 'users:manage', label: 'Manage Team & Assign Roles', description: 'Invite staff members and adjust authorization levels' },
    { key: 'settings:manage', label: 'Platform & Security Settings', description: 'Configure organization defaults and security policies' },
  ]

  const roles: UserRole[] = ['ADMIN', 'MANAGER', 'STAFF', 'VIEWER']

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3.5 pb-4 border-b border-slate-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/NiCE-Logo-Animated.gif"
          alt="NiCE Club Rwanda"
          className="w-12 h-12 rounded-xl object-contain bg-white shadow-subtle p-0.5 border border-slate-200/80"
        />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Settings & Access Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage organization settings, staff accounts, and role-based permissions (RBAC).
          </p>
        </div>
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
          <span>Staff Directory ({SEED_USERS.length})</span>
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
          <span>Organization Profile</span>
        </button>
      </div>

      {/* Tab 1: Staff Directory */}
      {activeTab === 'team' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Authorized Staff Accounts</CardTitle>
                <CardDescription>
                  Verified NiCE Club team members with access to the operations platform.
                </CardDescription>
              </div>
              <Badge variant="info" size="sm">
                4 Active Accounts
              </Badge>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Email Address</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Permissions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SEED_USERS.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-nice-blue-50 border border-nice-blue-200 text-nice-blue-700 font-bold text-xs flex items-center justify-center">
                            {formatInitials(user.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-xs">{user.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{user.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 font-mono text-xs">{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === 'ADMIN'
                              ? 'info'
                              : user.role === 'MANAGER'
                              ? 'default'
                              : user.role === 'STAFF'
                              ? 'success'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="success" size="sm" dot>
                          Active
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
          </Card>
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

      {/* Tab 3: Organization Profile */}
      {activeTab === 'organization' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>Canonical organizational attributes and defaults</CardDescription>
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
    </div>
  )
}
