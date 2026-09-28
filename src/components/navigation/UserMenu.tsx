'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, Settings, LogOut, ChevronDown, ShieldCheck } from 'lucide-react'
import { formatInitials } from '../../utils/format'
import { AuthUser } from '../../types/user'

export function UserMenu() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch live authenticated user
    fetch('/api/auth')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setUser(data.user)
        }
      })
      .catch((err) => console.error('Failed to fetch auth session:', err))

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' })
      setIsOpen(false)
      router.push('/login')
    } catch (err) {
      console.error('Failed to sign out:', err)
      router.push('/login')
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="User profile menu"
        className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
      >
        <div className="w-8 h-8 rounded-lg bg-nice-blue-100 border border-nice-blue-200 text-nice-blue-700 font-bold text-xs flex items-center justify-center overflow-hidden">
          {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" /> : user ? formatInitials(user.name) : '…'}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-xs font-semibold text-slate-800 leading-none">{user?.name || 'Loading profile'}</p>
          <span className="text-[10px] text-slate-500 font-medium">{user?.role || ''}</span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
      </button>

      {isOpen && user && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-slate-200 shadow-elevated py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-4 py-2 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-900">{user.name}</p>
            <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
            <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-nice-blue-50 text-nice-blue-700 border border-nice-blue-100">
              <ShieldCheck className="w-3 h-3 text-nice-blue-600" />
              {user.role}
            </span>
          </div>

          <div className="py-1">
            <Link
              href="/account"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <User className="w-4 h-4 text-slate-400" />
              <span>Account Profile</span>
            </Link>

            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </Link>
          </div>

          <div className="pt-1 border-t border-slate-100">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors text-left"
            >
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
