import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createAttendanceFormTemplate,
  createDefaultAttendanceForm,
  parseAttendanceFormConfig,
  validateAttendanceResponses,
} from '../../src/lib/forms/attendance-form.ts'
import { buildCustomFormAnalytics } from '../../src/lib/forms/form-analytics.ts'
import { fromKigaliDateTimeInput, getResponseWindowState, toKigaliDateTimeInput } from '../../src/lib/forms/response-window.ts'

function basicResponses() {
  return { full_name: ' Aline Uwase ', email: 'ALINE@example.rw' }
}

test('every starter form keeps Full Name and Email visible and required', () => {
  for (const template of ['Standard Attendance', 'Workshop Feedback', 'School Outreach', 'Conference Registration']) {
    const config = createAttendanceFormTemplate(template)
    const parsed = parseAttendanceFormConfig(config)
    assert.equal(parsed.fields.find((field) => field.id === 'full_name')?.required, true)
    assert.equal(parsed.fields.find((field) => field.id === 'full_name')?.visible, true)
    assert.equal(parsed.fields.find((field) => field.id === 'email')?.required, true)
    assert.equal(parsed.fields.find((field) => field.id === 'email')?.visible, true)
  }
})

test('labels and ordering can change without changing stable field IDs', () => {
  const config = createDefaultAttendanceForm()
  config.fields.find((field) => field.id === 'faculty').label = 'School'
  config.fields.find((field) => field.id === 'faculty').order = 9
  const parsed = parseAttendanceFormConfig(config)
  assert.equal(parsed.fields.find((field) => field.id === 'faculty')?.label, 'School')
  assert.equal(parsed.fields.find((field) => field.id === 'faculty')?.id, 'faculty')
  assert.equal(parsed.fields.at(-1)?.id, 'faculty')
})

test('protected system fields cannot be removed, hidden, or made optional', () => {
  for (const change of [
    (config) => { config.fields = config.fields.filter((field) => field.id !== 'full_name') },
    (config) => { config.fields.find((field) => field.id === 'email').required = false },
    (config) => { config.fields.find((field) => field.id === 'full_name').visible = false },
    (config) => { config.fields.find((field) => field.id === 'email').type = 'SHORT_TEXT' },
  ]) {
    const config = createDefaultAttendanceForm()
    change(config)
    assert.throws(() => parseAttendanceFormConfig(config))
  }
})

test('optional fields do not become mandatory until configured as required', () => {
  const config = createDefaultAttendanceForm()
  const validated = validateAttendanceResponses(config, basicResponses())
  assert.deepEqual(validated, { full_name: 'Aline Uwase', email: 'aline@example.rw' })
  config.fields.find((field) => field.id === 'faculty').required = true
  assert.throws(() => validateAttendanceResponses(config, basicResponses()), /Faculty is required/)
})

test('server validation enforces allowed options and keeps custom values under stable IDs', () => {
  const config = createDefaultAttendanceForm()
  const validated = validateAttendanceResponses(config, { ...basicResponses(), participant_type: 'Student', key_takeaway: 'Safety and science' })
  assert.equal(validated.participant_type, 'Student')
  assert.equal(validated.key_takeaway, 'Safety and science')
  assert.throws(() => validateAttendanceResponses(config, { ...basicResponses(), participant_type: 'Unknown' }), /valid option/)
  assert.throws(() => validateAttendanceResponses(config, { ...basicResponses(), email: 'not-an-email' }), /valid email/)
  assert.throws(() => validateAttendanceResponses(config, { ...basicResponses(), unknown_field: 'value' }), /form changed/)
})

test('Conference Registration adds editable sections and category-specific questions', () => {
  const config = parseAttendanceFormConfig(createAttendanceFormTemplate('Conference Registration'))
  assert.deepEqual(config.sections.map((section) => section.label), [
    'Personal Information',
    'Academic and Professional Background',
    'Participant Category',
    'Event Participation',
    'Additional Questions',
    'Consent and Confirmation',
  ])
  assert.equal(config.fields.find((field) => field.id === 'institution')?.sectionId, 'background')
  assert.deepEqual(config.fields.find((field) => field.id === 'volunteer_interest')?.condition, {
    fieldId: 'participant_type', operator: 'equals', value: 'Volunteer',
  })
  assert.equal(config.fields.find((field) => field.id === 'registration_consent')?.required, true)
  assert.equal(config.fields.find((field) => field.id === 'communications_consent')?.required, false)
})

test('conditional responses are checked against the selected category on the server', () => {
  const config = createAttendanceFormTemplate('Conference Registration')
  const base = { ...basicResponses(), participant_type: 'Student', registration_consent: true }
  assert.throws(() => validateAttendanceResponses(config, { ...base, volunteer_interest: 'Welcome desk' }), /form changed/)
  const volunteer = validateAttendanceResponses(config, {
    ...base,
    participant_type: 'Volunteer',
    volunteer_interest: 'Welcome desk',
  })
  assert.equal(volunteer.volunteer_interest, 'Welcome desk')
  assert.throws(() => validateAttendanceResponses(config, { ...base, participant_type: 'Unknown' }), /valid option/)
})

test('legacy flat forms remain readable without section metadata', () => {
  const legacy = createDefaultAttendanceForm()
  assert.equal('sections' in legacy, false)
  const parsed = parseAttendanceFormConfig(legacy)
  assert.equal(parsed.sections, undefined)
  assert.equal(parsed.fields.length, legacy.fields.length)
})

test('multi-choice values, consent, numbers, and calendar dates are validated by type', () => {
  const config = createDefaultAttendanceForm()
  config.fields.push(
    { id: 'topics', type: 'CHECKBOX', label: 'Topics', order: 9, required: true, visible: true, options: ['Safety', 'Energy'] },
    { id: 'consent', type: 'CONSENT', label: 'Agree to conduct', order: 10, required: true, visible: true },
    { id: 'rating', type: 'NUMBER', label: 'Rating', order: 11, required: false, visible: true, validation: { min: 1, max: 5 } },
    { id: 'event_day', type: 'DATE', label: 'Event day', order: 12, required: false, visible: true },
  )
  const accepted = validateAttendanceResponses(config, { ...basicResponses(), topics: ['Safety'], consent: true, rating: '4', event_day: '2026-10-14' })
  assert.deepEqual(accepted.topics, ['Safety'])
  assert.equal(accepted.consent, true)
  assert.equal(accepted.rating, 4)
  assert.throws(() => validateAttendanceResponses(config, { ...basicResponses(), topics: ['Unknown'], consent: true }), /invalid selection/)
  assert.throws(() => validateAttendanceResponses(config, { ...basicResponses(), topics: ['Safety'], consent: false }), /Agree to conduct is required/)
  assert.throws(() => validateAttendanceResponses(config, { ...basicResponses(), topics: ['Safety'], consent: true, rating: 6 }), /no more than 5/)
  assert.throws(() => validateAttendanceResponses(config, { ...basicResponses(), topics: ['Safety'], consent: true, event_day: '2026-02-30' }), /valid date/)
})

test('form analytics counts attendees, email outcomes, Kigali-day trends, and custom choice answers', () => {
  const config = createDefaultAttendanceForm()
  const analytics = buildCustomFormAnalytics([
    { submittedAt: '2026-10-14T01:30:00.000Z', emailStatus: 'ACCEPTED', responses: { participant_type: 'Student' } },
    { submittedAt: '2026-10-13T22:30:00.000Z', emailStatus: 'FAILED', responses: { participant_type: 'Teacher' } },
    { submittedAt: '2026-10-12T10:00:00.000Z', emailStatus: 'PENDING', responses: { participant_type: 'Student' } },
  ], config.fields)

  assert.equal(analytics.attendeeCount, 3)
  assert.equal(analytics.acceptedEmailCount, 1)
  assert.equal(analytics.failedEmailCount, 1)
  assert.equal(analytics.pendingEmailCount, 1)
  assert.deepEqual(analytics.timeline.map((point) => point.value), [1, 0, 2])
  assert.deepEqual(analytics.distributions.find((item) => item.id === 'participant_type')?.items, [
    { label: 'Student', count: 2, percentage: 67 },
    { label: 'Teacher', count: 1, percentage: 33 },
  ])
  assert.deepEqual([analytics.hourlyHistogram[0].value, analytics.hourlyHistogram[3].value, analytics.hourlyHistogram[12].value], [1, 1, 1])
})

test('response scheduling converts Kigali wall time to UTC and reports its operating state', () => {
  const iso = fromKigaliDateTimeInput('2026-10-14T09:00')
  assert.equal(iso, '2026-10-14T07:00:00.000Z')
  assert.equal(toKigaliDateTimeInput(iso), '2026-10-14T09:00')
  assert.throws(() => fromKigaliDateTimeInput('2026-02-30T09:00'), /valid Kigali date and time/)

  const form = { status: 'PUBLISHED', responseOpensAt: '2026-10-14T07:00:00.000Z', responseClosesAt: '2026-10-14T10:00:00.000Z' }
  assert.equal(getResponseWindowState(form, new Date('2026-10-14T06:59:59.000Z')), 'SCHEDULED')
  assert.equal(getResponseWindowState(form, new Date('2026-10-14T08:00:00.000Z')), 'ACCEPTING')
  assert.equal(getResponseWindowState(form, new Date('2026-10-14T10:00:01.000Z')), 'ENDED')
  assert.equal(getResponseWindowState({ ...form, status: 'CLOSED' }, new Date('2026-10-14T08:00:00.000Z')), 'CLOSED')
})
