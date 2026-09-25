'use client'

import React from 'react'

export interface ParticipantFilterProps {
  search: string
  onSearchChange: (value: string) => void
  roleFilter: string
  onRoleFilterChange: (value: string) => void
}

export function ParticipantFilter({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
}: ParticipantFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <input
        type="text"
        placeholder="Search participant name, email..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full sm:w-64 h-9 px-3 text-xs rounded-lg border border-slate-700 bg-slate-900 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
      <select
        value={roleFilter}
        onChange={(e) => onRoleFilterChange(e.target.value)}
        className="w-full sm:w-36 h-9 px-2 text-xs rounded-lg border border-slate-700 bg-slate-900 text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
      >
        <option value="all">All Roles</option>
        <option value="admin">Admin</option>
        <option value="staff">Staff</option>
        <option value="member">Member</option>
      </select>
    </div>
  )
}
