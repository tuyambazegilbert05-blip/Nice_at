'use client'

import React from 'react'
import { Modal } from '../ui/Modal'
import { Badge } from '../ui/Badge'
import { User } from '../../types'
import { formatInitials } from '../../utils/format'

export interface ParticipantDetailModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
}

export function ParticipantDetailModal({ user, isOpen, onClose }: ParticipantDetailModalProps) {
  if (!user) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Team Member Details">
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-nice-blue-50 border border-nice-blue-200 text-nice-blue-700 font-bold flex items-center justify-center text-base">
            {formatInitials(user.name)}
          </div>
          <div>
            <h4 className="text-base font-semibold text-slate-900">{user.name}</h4>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500 uppercase tracking-wider block mb-1">Role</span>
            <Badge variant="info">{user.role}</Badge>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500 uppercase tracking-wider block mb-1">Status</span>
            <Badge variant={user.isActive ? 'success' : 'neutral'}>
              {user.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 col-span-2">
            <span className="text-slate-500 uppercase tracking-wider block mb-1">Member Since</span>
            <span className="text-slate-700 font-medium">
              {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  )
}
