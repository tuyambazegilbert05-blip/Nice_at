import { z } from 'zod'

export const ATTENDANCE_FIELD_TYPES = [
  'SHORT_TEXT', 'LONG_TEXT', 'EMAIL', 'PHONE', 'NUMBER', 'SELECT', 'RADIO', 'CHECKBOX', 'DATE', 'CONSENT',
] as const

export type AttendanceFieldType = typeof ATTENDANCE_FIELD_TYPES[number]
export type AttendanceResponseValue = string | string[] | number | boolean

export interface AttendanceFormSection {
  id: string
  label: string
  description?: string
  order: number
}

export interface AttendanceFormCondition {
  fieldId: string
  operator: 'equals' | 'includes'
  value: string
}

export interface AttendanceFormField {
  id: string
  type: AttendanceFieldType
  label: string
  description?: string
  order: number
  required: boolean
  visible: boolean
  options?: string[]
  placeholder?: string
  validation?: { minLength?: number; maxLength?: number; min?: number; max?: number }
  sectionId?: string
  condition?: AttendanceFormCondition
}

export interface AttendanceFormConfig {
  version: number
  fields: AttendanceFormField[]
  sections?: AttendanceFormSection[]
}

export const ATTENDANCE_FORM_TEMPLATES = ['Standard Attendance', 'Workshop Feedback', 'School Outreach', 'Conference Registration'] as const
export type AttendanceFormTemplate = typeof ATTENDANCE_FORM_TEMPLATES[number]

const validationSchema = z.object({
  minLength: z.number().int().min(0).max(6000).optional(),
  maxLength: z.number().int().min(1).max(6000).optional(),
  min: z.number().finite().optional(),
  max: z.number().finite().optional(),
}).strict().optional()

const conditionSchema = z.object({
  fieldId: z.string().regex(/^[a-z0-9][a-z0-9_-]{1,63}$/),
  operator: z.enum(['equals', 'includes']),
  value: z.string().trim().min(1).max(120),
}).strict()

const sectionSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9_-]{1,63}$/),
  label: z.string().trim().min(1).max(100),
  description: z.string().max(500).optional(),
  order: z.number().int().min(0).max(100),
}).strict()

const fieldSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9_-]{1,63}$/),
  type: z.enum(ATTENDANCE_FIELD_TYPES),
  label: z.string().trim().min(1).max(120),
  description: z.string().max(500).optional(),
  order: z.number().int().min(0).max(1000),
  required: z.boolean(),
  visible: z.boolean(),
  options: z.array(z.string().trim().min(1).max(120)).max(50).optional(),
  placeholder: z.string().max(200).optional(),
  validation: validationSchema,
  sectionId: z.string().regex(/^[a-z0-9][a-z0-9_-]{1,63}$/).optional(),
  condition: conditionSchema.optional(),
}).strict().superRefine((field, context) => {
  if (['SELECT', 'RADIO', 'CHECKBOX'].includes(field.type) && (!field.options || field.options.length < 1)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Add at least one option to selection fields.', path: ['options'] })
  }
  if (field.options && new Set(field.options.map((option) => option.toLowerCase())).size !== field.options.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Options must be unique.', path: ['options'] })
  }
  if (field.validation?.minLength !== undefined && field.validation.maxLength !== undefined && field.validation.minLength > field.validation.maxLength) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Minimum length must not exceed maximum length.', path: ['validation', 'minLength'] })
  }
  if (field.validation?.min !== undefined && field.validation.max !== undefined && field.validation.min > field.validation.max) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Minimum value must not exceed maximum value.', path: ['validation', 'min'] })
  }
})

export const attendanceFormConfigSchema = z.object({
  version: z.number().int().min(1).max(1_000_000),
  fields: z.array(fieldSchema).min(2).max(40),
  sections: z.array(sectionSchema).max(12).optional(),
}).strict().superRefine((config, context) => {
  const ids = config.fields.map((field) => field.id)
  if (new Set(ids).size !== ids.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Every field must have a unique ID.', path: ['fields'] })
  }
  const orders = config.fields.map((field) => field.order)
  if (new Set(orders).size !== orders.length) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Every field must have a unique display order.', path: ['fields'] })
  const byId = new Map(config.fields.map((field) => [field.id, field]))
  const sections = config.sections ?? []
  const sectionIds = sections.map((section) => section.id)
  if (new Set(sectionIds).size !== sectionIds.length) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Every section must have a unique ID.', path: ['sections'] })
  if (new Set(sections.map((section) => section.order)).size !== sections.length) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Every section must have a unique display order.', path: ['sections'] })
  const sectionById = new Map(sections.map((section) => [section.id, section]))
  for (const field of config.fields) {
    if (field.sectionId && !sectionById.has(field.sectionId)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: `Choose a valid section for ${field.label}.`, path: ['fields'] })
    }
    if (!field.condition) continue
    const parent = byId.get(field.condition.fieldId)
    if (!parent || parent.id === field.id) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: `Choose a different existing field to control ${field.label}.`, path: ['fields'] })
      continue
    }
    if (parent.condition || !parent.visible || !['SELECT', 'RADIO', 'CHECKBOX'].includes(parent.type)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: `Conditional questions must depend on a visible choice field without its own condition.`, path: ['fields'] })
      continue
    }
    if (field.condition.operator === 'includes' && parent.type !== 'CHECKBOX') {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Use “includes” only with a multiple-choice field.', path: ['fields'] })
    } else if (!parent.options?.includes(field.condition.value)) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: `Choose a current option from ${parent.label} for ${field.label}.`, path: ['fields'] })
    }
  }
  const name = byId.get('full_name')
  const email = byId.get('email')
  if (!name || name.type !== 'SHORT_TEXT' || !name.required || !name.visible) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Full Name must stay visible and required.', path: ['fields'] })
  }
  if (!email || email.type !== 'EMAIL' || !email.required || !email.visible) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Email Address must stay visible and required.', path: ['fields'] })
  }
})

export function createDefaultAttendanceForm(): AttendanceFormConfig {
  return {
    version: 1,
    fields: [
      { id: 'full_name', type: 'SHORT_TEXT', label: 'Full Name', description: 'Your name as you would like it recorded.', order: 0, required: true, visible: true, placeholder: 'e.g. Marie Claire Uwase', validation: { maxLength: 180 } },
      { id: 'email', type: 'EMAIL', label: 'Email Address', description: 'We will send your attendance confirmation to this address.', order: 1, required: true, visible: true, placeholder: 'you@example.rw', validation: { maxLength: 254 } },
      { id: 'phone', type: 'PHONE', label: 'Phone Number', order: 2, required: false, visible: true, placeholder: '+250 788 000 000', validation: { maxLength: 40 } },
      { id: 'faculty', type: 'SHORT_TEXT', label: 'Faculty', order: 3, required: false, visible: true, placeholder: 'Faculty or school', validation: { maxLength: 180 } },
      { id: 'program', type: 'SHORT_TEXT', label: 'Program / Major', order: 4, required: false, visible: true, placeholder: 'Program or area of study', validation: { maxLength: 180 } },
      { id: 'year_of_study', type: 'SELECT', label: 'Year of Study', order: 5, required: false, visible: true, options: ['Secondary School', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Postgraduate', 'Other'] },
      { id: 'participant_type', type: 'SELECT', label: 'Participant Type', order: 6, required: false, visible: true, options: ['Student', 'Researcher', 'Lecturer', 'Professional', 'School Student', 'Guest', 'Partner', 'Other'] },
      { id: 'key_takeaway', type: 'LONG_TEXT', label: 'Key Takeaway', description: 'Share a key idea or question from this session.', order: 7, required: false, visible: true, placeholder: 'What stood out to you?', validation: { maxLength: 3000 } },
      { id: 'feedback', type: 'LONG_TEXT', label: 'Feedback', order: 8, required: false, visible: true, placeholder: 'Suggestions for future sessions', validation: { maxLength: 3000 } },
    ],
  }
}

export function createAttendanceFormTemplate(template: AttendanceFormTemplate): AttendanceFormConfig {
  switch (template) {
    case 'Standard Attendance':
      return createDefaultAttendanceForm()
    case 'Workshop Feedback':
      return createWorkshopFeedbackForm()
    case 'School Outreach':
      return createSchoolOutreachForm()
    case 'Conference Registration':
      return createConferenceRegistrationForm()
  }
  return createDefaultAttendanceForm()
}

function createConferenceRegistrationForm(): AttendanceFormConfig {
  const sections: AttendanceFormSection[] = [
    { id: 'personal_information', label: 'Personal Information', order: 0 },
    { id: 'background', label: 'Academic and Professional Background', order: 1 },
    { id: 'participant_category', label: 'Participant Category', order: 2 },
    { id: 'event_participation', label: 'Event Participation', order: 3 },
    { id: 'additional_questions', label: 'Additional Questions', order: 4 },
    { id: 'consent_confirmation', label: 'Consent and Confirmation', order: 5 },
  ]
  const fields: AttendanceFormField[] = [
    { id: 'full_name', type: 'SHORT_TEXT', label: 'Full Name', description: 'Your name as you would like it recorded.', order: 0, required: true, visible: true, placeholder: 'e.g. Marie Claire Uwase', validation: { maxLength: 180 }, sectionId: 'personal_information' },
    { id: 'email', type: 'EMAIL', label: 'Email Address', description: 'We will use this address for registration updates.', order: 1, required: true, visible: true, placeholder: 'you@example.rw', validation: { maxLength: 254 }, sectionId: 'personal_information' },
    { id: 'phone', type: 'PHONE', label: 'Phone Number', order: 2, required: false, visible: true, placeholder: '+250 788 000 000', validation: { maxLength: 40 }, sectionId: 'personal_information' },
    { id: 'country_of_residence', type: 'SHORT_TEXT', label: 'Country of Residence', order: 3, required: false, visible: true, placeholder: 'Country', validation: { maxLength: 100 }, sectionId: 'personal_information' },
    { id: 'preferred_name', type: 'SHORT_TEXT', label: 'Preferred Name', description: 'Optional name to use when addressing you.', order: 4, required: false, visible: true, validation: { maxLength: 120 }, sectionId: 'personal_information' },
    { id: 'institution', type: 'SHORT_TEXT', label: 'Institution or Organization', order: 5, required: false, visible: true, placeholder: 'University, school, or organization', validation: { maxLength: 180 }, sectionId: 'background' },
    { id: 'faculty', type: 'SHORT_TEXT', label: 'Faculty or School', order: 6, required: false, visible: true, validation: { maxLength: 180 }, sectionId: 'background' },
    { id: 'department', type: 'SHORT_TEXT', label: 'Department', order: 7, required: false, visible: true, validation: { maxLength: 180 }, sectionId: 'background' },
    { id: 'program', type: 'SHORT_TEXT', label: 'Program, Major, or Field of Study', order: 8, required: false, visible: true, validation: { maxLength: 180 }, sectionId: 'background' },
    { id: 'year_of_study', type: 'SELECT', label: 'Year of Study', order: 9, required: false, visible: true, options: ['Secondary School', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Postgraduate', 'Other'], sectionId: 'background' },
    { id: 'professional_role', type: 'SHORT_TEXT', label: 'Professional or Academic Role', order: 10, required: false, visible: true, validation: { maxLength: 160 }, sectionId: 'background' },
    { id: 'organization_type', type: 'SELECT', label: 'Organization Type', order: 11, required: false, visible: true, options: ['University or college', 'School', 'Research institution', 'Government', 'Private sector', 'Youth organization', 'Nonprofit', 'Other'], sectionId: 'background' },
    { id: 'participant_type', type: 'SELECT', label: 'Participant Category', description: 'Choose the category that best describes your participation.', order: 12, required: true, visible: true, options: ['Student', 'Researcher', 'Educator', 'Professional', 'Speaker', 'Volunteer', 'Organizer', 'Partner or Exhibitor', 'Other'], sectionId: 'participant_category' },
    { id: 'conference_track', type: 'SELECT', label: 'Preferred Conference Track', order: 13, required: false, visible: true, options: ['Clean energy and society', 'Nuclear science and technology', 'Education and youth engagement', 'Policy and public dialogue', 'No preference'], sectionId: 'event_participation' },
    { id: 'areas_of_interest', type: 'CHECKBOX', label: 'Areas of Interest', description: 'Select any topics you would like to explore.', order: 14, required: false, visible: true, options: ['Clean energy', 'Nuclear science', 'Climate and sustainability', 'Education', 'Policy', 'Youth leadership', 'Networking'], sectionId: 'event_participation' },
    { id: 'participation_format', type: 'SELECT', label: 'Preferred Participation Format', order: 15, required: false, visible: true, options: ['In person', 'Online', 'Hybrid'], sectionId: 'event_participation' },
    { id: 'accessibility_needs', type: 'LONG_TEXT', label: 'Accessibility or Participation Accommodations', description: 'Share only what the organizers need to support your participation.', order: 16, required: false, visible: true, validation: { maxLength: 1000 }, sectionId: 'event_participation' },
    { id: 'volunteer_interest', type: 'LONG_TEXT', label: 'How would you like to volunteer?', order: 17, required: false, visible: true, placeholder: 'Optional volunteer interests', validation: { maxLength: 1000 }, sectionId: 'event_participation', condition: { fieldId: 'participant_type', operator: 'equals', value: 'Volunteer' } },
    { id: 'speaker_topic', type: 'LONG_TEXT', label: 'Presentation or Speaker Topic', order: 18, required: false, visible: true, placeholder: 'Briefly describe your proposed topic', validation: { maxLength: 1500 }, sectionId: 'event_participation', condition: { fieldId: 'participant_type', operator: 'equals', value: 'Speaker' } },
    { id: 'learning_goals', type: 'LONG_TEXT', label: 'What do you hope to learn or contribute?', order: 19, required: false, visible: true, placeholder: 'Tell us what you would like to take away from this event.', validation: { maxLength: 2000 }, sectionId: 'additional_questions' },
    { id: 'referral_source', type: 'SELECT', label: 'How did you hear about this event?', order: 20, required: false, visible: true, options: ['NiCE Club Rwanda', 'School or university', 'Colleague or friend', 'Social media', 'Email invitation', 'Other'], sectionId: 'additional_questions' },
    { id: 'registration_consent', type: 'CONSENT', label: 'I agree that NiCE Club Rwanda may use these details to manage my registration and event participation.', description: 'This is required to process your registration.', order: 21, required: true, visible: true, sectionId: 'consent_confirmation' },
    { id: 'communications_consent', type: 'CONSENT', label: 'I would like to receive future NiCE event announcements.', description: 'Optional. This choice is separate from registration processing.', order: 22, required: false, visible: true, sectionId: 'consent_confirmation' },
  ]
  return { version: 1, sections, fields }
}

function createWorkshopFeedbackForm(): AttendanceFormConfig {
  const sections: AttendanceFormSection[] = [
    { id: 'workshop_participant', label: 'Participant Details', description: 'Tell us who took part in the workshop.', order: 0 },
    { id: 'workshop_experience', label: 'Workshop Experience', description: 'Rate the session and how well it supported your learning.', order: 1 },
    { id: 'workshop_reflection', label: 'Learning and Feedback', description: 'Share what you learned and what could make future workshops better.', order: 2 },
    { id: 'workshop_follow_up', label: 'Future Engagement', description: 'Choose whether you would like to hear about related NiCE activities.', order: 3 },
  ]
  const fields: AttendanceFormField[] = [
    { id: 'full_name', type: 'SHORT_TEXT', label: 'Full Name', description: 'Your name as you would like it recorded.', order: 0, required: true, visible: true, placeholder: 'e.g. Marie Claire Uwase', validation: { maxLength: 180 }, sectionId: 'workshop_participant' },
    { id: 'email', type: 'EMAIL', label: 'Email Address', description: 'We will use this address for your workshop follow-up.', order: 1, required: true, visible: true, placeholder: 'you@example.rw', validation: { maxLength: 254 }, sectionId: 'workshop_participant' },
    { id: 'phone', type: 'PHONE', label: 'Phone Number', order: 2, required: false, visible: true, placeholder: '+250 788 000 000', validation: { maxLength: 40 }, sectionId: 'workshop_participant' },
    { id: 'organization', type: 'SHORT_TEXT', label: 'School, Organization, or Institution', order: 3, required: false, visible: true, placeholder: 'Where you study or work', validation: { maxLength: 180 }, sectionId: 'workshop_participant' },
    { id: 'workshop_role', type: 'SELECT', label: 'Your Role', order: 4, required: false, visible: true, options: ['Student', 'Educator', 'Researcher', 'Professional', 'Community member', 'Other'], sectionId: 'workshop_participant' },
    { id: 'overall_rating', type: 'RADIO', label: 'Overall Workshop Rating', description: 'Choose a rating from 1 (poor) to 5 (excellent).', order: 5, required: true, visible: true, options: ['1 — Poor', '2 — Fair', '3 — Good', '4 — Very good', '5 — Excellent'], sectionId: 'workshop_experience' },
    { id: 'objectives_met', type: 'SELECT', label: 'How well did the workshop meet its objectives?', order: 6, required: false, visible: true, options: ['Fully', 'Mostly', 'Partly', 'Not yet'], sectionId: 'workshop_experience' },
    { id: 'facilitator_clarity', type: 'RADIO', label: 'How clear were the explanations?', order: 7, required: false, visible: true, options: ['Very clear', 'Clear', 'Somewhat clear', 'Unclear'], sectionId: 'workshop_experience' },
    { id: 'workshop_pace', type: 'SELECT', label: 'How was the workshop pace?', order: 8, required: false, visible: true, options: ['Too slow', 'About right', 'Too fast'], sectionId: 'workshop_experience' },
    { id: 'key_takeaway', type: 'LONG_TEXT', label: 'What is the most useful thing you learned?', order: 9, required: true, visible: true, placeholder: 'Share a key idea, skill, or question you are taking away.', validation: { maxLength: 3000 }, sectionId: 'workshop_reflection' },
    { id: 'confidence_after', type: 'RADIO', label: 'How confident do you feel about this topic now?', description: 'Choose a rating from 1 (not confident yet) to 5 (very confident).', order: 10, required: false, visible: true, options: ['1 — Not confident', '2 — Slightly confident', '3 — Somewhat confident', '4 — Confident', '5 — Very confident'], sectionId: 'workshop_reflection' },
    { id: 'future_topics', type: 'CHECKBOX', label: 'Which topics would you like to explore in a future workshop?', order: 11, required: false, visible: true, options: ['Clean energy', 'Nuclear science', 'Climate and sustainability', 'Radiation and safety', 'STEM careers', 'Public dialogue'], sectionId: 'workshop_reflection' },
    { id: 'additional_feedback', type: 'LONG_TEXT', label: 'What should we improve for next time?', order: 12, required: false, visible: true, placeholder: 'Share any suggestions about the content, activities, or format.', validation: { maxLength: 3000 }, sectionId: 'workshop_reflection' },
    { id: 'recommend_workshop', type: 'SELECT', label: 'Would you recommend this workshop to a colleague or classmate?', order: 13, required: false, visible: true, options: ['Definitely', 'Probably', 'Not sure', 'Probably not'], sectionId: 'workshop_follow_up' },
    { id: 'communications_consent', type: 'CONSENT', label: 'I would like to receive updates about related workshops and learning activities.', order: 14, required: false, visible: true, sectionId: 'workshop_follow_up' },
  ]
  return { version: 1, sections, fields }
}

function createSchoolOutreachForm(): AttendanceFormConfig {
  const sections: AttendanceFormSection[] = [
    { id: 'outreach_participant', label: 'Participant and School', description: 'Help us understand which school or community joined the outreach activity.', order: 0 },
    { id: 'outreach_learning', label: 'Learning and Interests', description: 'Tell us what was useful and what you would like to explore next.', order: 1 },
    { id: 'outreach_follow_up', label: 'Questions and Follow-up', description: 'Share questions or request another learning activity.', order: 2 },
  ]
  const fields: AttendanceFormField[] = [
    { id: 'full_name', type: 'SHORT_TEXT', label: 'Full Name', description: 'Your name as you would like it recorded.', order: 0, required: true, visible: true, placeholder: 'e.g. Marie Claire Uwase', validation: { maxLength: 180 }, sectionId: 'outreach_participant' },
    { id: 'email', type: 'EMAIL', label: 'Email Address', description: 'We will use this address for outreach follow-up.', order: 1, required: true, visible: true, placeholder: 'you@example.rw', validation: { maxLength: 254 }, sectionId: 'outreach_participant' },
    { id: 'phone', type: 'PHONE', label: 'Phone Number', order: 2, required: false, visible: true, placeholder: '+250 788 000 000', validation: { maxLength: 40 }, sectionId: 'outreach_participant' },
    { id: 'school_name', type: 'SHORT_TEXT', label: 'School or Community Organization', order: 3, required: true, visible: true, placeholder: 'Name of your school or organization', validation: { maxLength: 180 }, sectionId: 'outreach_participant' },
    { id: 'district', type: 'SHORT_TEXT', label: 'District', order: 4, required: false, visible: true, placeholder: 'District', validation: { maxLength: 100 }, sectionId: 'outreach_participant' },
    { id: 'outreach_role', type: 'SELECT', label: 'Your Role', order: 5, required: true, visible: true, options: ['Student or learner', 'Teacher or educator', 'School leader', 'Parent or guardian', 'Community member', 'Other'], sectionId: 'outreach_participant' },
    { id: 'school_level', type: 'SELECT', label: 'School or Group Level', order: 6, required: false, visible: true, options: ['Primary', 'Lower secondary', 'Upper secondary', 'TVET', 'University or college', 'Community group', 'Other'], sectionId: 'outreach_participant' },
    { id: 'class_or_year', type: 'SHORT_TEXT', label: 'Class or Year', order: 7, required: false, visible: true, placeholder: 'e.g. Senior 2 or Year 1', validation: { maxLength: 100 }, sectionId: 'outreach_participant', condition: { fieldId: 'outreach_role', operator: 'equals', value: 'Student or learner' } },
    { id: 'teaching_subject', type: 'SHORT_TEXT', label: 'Subject or Area You Teach', order: 8, required: false, visible: true, placeholder: 'e.g. Physics or General Science', validation: { maxLength: 160 }, sectionId: 'outreach_participant', condition: { fieldId: 'outreach_role', operator: 'equals', value: 'Teacher or educator' } },
    { id: 'topics_of_interest', type: 'CHECKBOX', label: 'Which topics interested you most?', order: 9, required: false, visible: true, options: ['Clean energy', 'Electricity and energy access', 'Nuclear science', 'Radiation and safety', 'Climate and sustainability', 'STEM studies and careers'], sectionId: 'outreach_learning' },
    { id: 'prior_topic_knowledge', type: 'RADIO', label: 'Before this activity, how familiar were you with the topic?', order: 10, required: false, visible: true, options: ['This was new to me', 'I knew a little', 'I knew some of it', 'I was already familiar'], sectionId: 'outreach_learning' },
    { id: 'learning_takeaway', type: 'LONG_TEXT', label: 'What is one thing you learned or will remember?', order: 11, required: true, visible: true, placeholder: 'Share an idea, fact, or question from the activity.', validation: { maxLength: 3000 }, sectionId: 'outreach_learning' },
    { id: 'topic_confidence', type: 'RADIO', label: 'How confident do you feel discussing this topic now?', description: 'Choose a rating from 1 (not confident yet) to 5 (very confident).', order: 12, required: false, visible: true, options: ['1 — Not confident', '2 — Slightly confident', '3 — Somewhat confident', '4 — Confident', '5 — Very confident'], sectionId: 'outreach_learning' },
    { id: 'outreach_questions', type: 'LONG_TEXT', label: 'What questions would you like NiCE to answer?', order: 13, required: false, visible: true, placeholder: 'Optional questions for a future discussion.', validation: { maxLength: 3000 }, sectionId: 'outreach_follow_up' },
    { id: 'follow_up_interest', type: 'RADIO', label: 'Would your school or group be interested in another learning activity?', order: 14, required: false, visible: true, options: ['Yes', 'No'], sectionId: 'outreach_follow_up' },
    { id: 'follow_up_details', type: 'LONG_TEXT', label: 'What kind of follow-up would be helpful?', order: 15, required: false, visible: true, placeholder: 'For example, a school visit, a science activity, or a discussion.', validation: { maxLength: 1500 }, sectionId: 'outreach_follow_up', condition: { fieldId: 'follow_up_interest', operator: 'equals', value: 'Yes' } },
    { id: 'communications_consent', type: 'CONSENT', label: 'I would like to receive information about future NiCE school and community activities.', order: 16, required: false, visible: true, sectionId: 'outreach_follow_up' },
  ]
  return { version: 1, sections, fields }
}

export function parseAttendanceFormConfig(value: unknown): AttendanceFormConfig {
  const parsed = attendanceFormConfigSchema.parse(value)
  return {
    ...parsed,
    fields: [...parsed.fields].sort((left, right) => left.order - right.order),
    sections: parsed.sections ? [...parsed.sections].sort((left, right) => left.order - right.order) : undefined,
  }
}

export function isAttendanceFieldVisible(field: AttendanceFormField, config: AttendanceFormConfig, responses: Record<string, unknown>): boolean {
  if (!field.visible) return false
  if (!field.condition) return true
  const parent = config.fields.find((candidate) => candidate.id === field.condition?.fieldId)
  if (!parent || !parent.visible) return false
  const answer = responses[parent.id]
  return field.condition.operator === 'includes'
    ? Array.isArray(answer) && answer.includes(field.condition.value)
    : answer === field.condition.value
}

export function getVisibleAttendanceFields(config: AttendanceFormConfig, responses: Record<string, unknown>): AttendanceFormField[] {
  return [...config.fields].filter((field) => isAttendanceFieldVisible(field, config, responses)).sort((left, right) => left.order - right.order)
}

export function getAttendanceFormFieldGroups(config: AttendanceFormConfig, responses: Record<string, unknown>) {
  const visibleFields = getVisibleAttendanceFields(config, responses)
  if (!config.sections?.length) return [{ id: 'all_fields', label: '', description: undefined, fields: visibleFields }]
  const groups = [...config.sections].sort((left, right) => left.order - right.order).map((section) => ({
    ...section,
    fields: visibleFields.filter((field) => field.sectionId === section.id),
  })).filter((section) => section.fields.length > 0)
  const unassigned = visibleFields.filter((field) => !field.sectionId)
  if (unassigned.length) groups.push({ id: 'additional_fields', label: 'Additional Questions', description: undefined, order: 999, fields: unassigned })
  return groups
}

export function validateAttendanceResponses(config: AttendanceFormConfig, input: unknown): Record<string, AttendanceResponseValue> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Enter your responses before submitting.')
  const values = input as Record<string, unknown>
  const potentiallyVisibleFields = config.fields.filter((field) => field.visible)
  const allowed = new Set(potentiallyVisibleFields.map((field) => field.id))
  if (Object.keys(values).some((key) => !allowed.has(key))) throw new Error('The form changed. Refresh this page and review your answers.')
  const result: Record<string, AttendanceResponseValue> = {}
  const visibleFields = getVisibleAttendanceFields(config, values)
  if (Object.keys(values).some((key) => !visibleFields.some((field) => field.id === key))) throw new Error('The form changed. Refresh this page and review your answers.')

  for (const field of visibleFields) {
    const raw = values[field.id]
    if (raw === undefined || raw === null || raw === '') {
      if (field.required) throw new Error(`${field.label} is required.`)
      continue
    }

    if (field.type === 'CONSENT') {
      if (typeof raw !== 'boolean') throw new Error(`${field.label} has an invalid response.`)
      if (field.required && !raw) throw new Error(`${field.label} is required.`)
      result[field.id] = raw
      continue
    }

    if (field.type === 'CHECKBOX') {
      if (!Array.isArray(raw) || raw.some((item) => typeof item !== 'string' || !field.options?.includes(item))) {
        throw new Error(`${field.label} has an invalid selection.`)
      }
      if (field.required && raw.length === 0) throw new Error(`${field.label} is required.`)
      result[field.id] = raw as string[]
      continue
    }

    if (field.type === 'NUMBER') {
      const numeric = typeof raw === 'number' ? raw : typeof raw === 'string' && raw.trim() ? Number(raw) : NaN
      if (!Number.isFinite(numeric)) throw new Error(`${field.label} must be a valid number.`)
      if (field.validation?.min !== undefined && numeric < field.validation.min) throw new Error(`${field.label} must be at least ${field.validation.min}.`)
      if (field.validation?.max !== undefined && numeric > field.validation.max) throw new Error(`${field.label} must be no more than ${field.validation.max}.`)
      result[field.id] = numeric
      continue
    }

    if (typeof raw !== 'string') throw new Error(`${field.label} has an invalid response.`)
    const value = raw.trim()
    if (!value) {
      if (field.required) throw new Error(`${field.label} is required.`)
      continue
    }
    if (value.length > 6000 || (field.validation?.maxLength !== undefined && value.length > field.validation.maxLength)) throw new Error(`${field.label} is too long.`)
    if (field.validation?.minLength !== undefined && value.length < field.validation.minLength) throw new Error(`${field.label} is too short.`)
    if ((field.type === 'SELECT' || field.type === 'RADIO') && !field.options?.includes(value)) throw new Error(`Choose a valid option for ${field.label}.`)
    if (field.type === 'EMAIL' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error('Enter a valid email address.')
    if (field.type === 'DATE') {
      const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
      if (!match) throw new Error(`Enter a valid date for ${field.label}.`)
      const [, year, month, day] = match.map(Number)
      const parsedDate = new Date(Date.UTC(year, month - 1, day))
      if (parsedDate.getUTCFullYear() !== year || parsedDate.getUTCMonth() !== month - 1 || parsedDate.getUTCDate() !== day) throw new Error(`Enter a valid date for ${field.label}.`)
    }
    result[field.id] = field.id === 'email' ? value.toLowerCase() : value
  }

  return result
}
