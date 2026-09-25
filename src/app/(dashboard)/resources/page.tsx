import React from 'react'
import { BookOpen, FileText, QrCode, Shield, Sparkles } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'

export default function ResourcesPage() {
  const resources = [
    {
      title: 'NiCE Event Organizer Handbook',
      category: 'Operations',
      description: 'Comprehensive guidelines on running effective nuclear energy outreach workshops in Rwanda.',
      icon: BookOpen,
    },
    {
      title: 'QR Projection & Scanning Guidelines',
      category: 'Technical',
      description: 'Standard procedures for projector display, lighting calibration, and mobile attendee assistance.',
      icon: QrCode,
    },
    {
      title: 'Data Privacy & Ethics Policy',
      category: 'Compliance',
      description: 'Institutional protocols for handling attendee contact details, student records, and participant feedback.',
      icon: Shield,
    },
    {
      title: 'Nuclear Clean Energy Factsheets',
      category: 'Scientific Education',
      description: 'Verified scientific data on nuclear safety, small modular reactors (SMRs), and African clean transitions.',
      icon: Sparkles,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Knowledge & Resources
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Standard operating procedures, educational scientific references, and event templates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {resources.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.title} className="hover:border-nice-blue-300 transition-all">
              <CardHeader className="flex flex-row items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-nice-blue-50 text-nice-blue-600 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-nice-blue-600 uppercase tracking-wider">
                    {item.category}
                  </span>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="outline" size="sm" leftIcon={<FileText className="w-4 h-4" />}>
                  View Document
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
