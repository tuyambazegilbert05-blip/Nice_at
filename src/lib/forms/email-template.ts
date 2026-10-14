export interface FormEmailTemplate {
  subject: string
  heading: string
  body: string
}

export const DEFAULT_FORM_EMAIL_TEMPLATE: FormEmailTemplate = {
  subject: 'Attendance Confirmed — {{sessionTitle}} | NiCE Club Rwanda',
  heading: 'Thank you for being with us, {{firstName}}',
  body: 'Thank you for participating in {{sessionTitle}} with NiCE Club Rwanda. Your attendance has been successfully recorded.\n\nSession details\nDate: {{sessionDate}}\nTime: {{sessionTime}} CAT\nLocation: {{sessionLocation}}\n\nWe are glad to have you as part of a community exploring nuclear science, clean energy, and the opportunities these fields create for Rwanda and Africa.\n\nA message from our outreach team\nThank you for learning and engaging with NiCE Club Rwanda. We believe informed conversations and youth participation are essential to building a better understanding of nuclear science and its peaceful applications.\n\nWe invite you to stay connected, take part in future learning opportunities, and continue exploring how science and innovation can contribute to our shared future.\n\nWe look forward to seeing you at another NiCE activity.\n\nWarm regards,\nNiCE Club Rwanda Outreach Team\nNuclear is Clean Energy',
}
