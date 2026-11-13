import { request } from './http'
import { getAllStudents } from './studentService'
import { getAllBookings } from './bookingService'

const BASE_URL = '/tutoring/tutor'

export function getAllTutors() {
  return request(`${BASE_URL}/getAll`, { label: 'Tutor' })
}

export function getTutorById(tutorId) {
  return request(`${BASE_URL}/read/${encodeURIComponent(tutorId)}`, { label: 'Tutor' })
}

export function createTutor(tutor) {
  return request(`${BASE_URL}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tutor),
    label: 'Register'
  })
}

export function updateTutor(tutor) {
  return request(`${BASE_URL}/update`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tutor),
    label: 'Tutor'
  })
}

export function deleteTutor(tutorId) {
  return request(`${BASE_URL}/delete/${encodeURIComponent(tutorId)}`, {
    method: 'DELETE',
    label: 'Tutor'
  }).then(() => true)
}

export async function getTutorSessions(tutorId) {
  const [allBookings, students] = await Promise.all([
    getAllBookings().catch(() => []),
    getAllStudents().catch(() => [])
  ])

  const studentList = students || []

  const studentByNumber = new Map()
  for (const s of studentList) {
    if (!s || !s.studentNumber) continue
    studentByNumber.set(String(s.studentNumber), {
      studentNumber: s.studentNumber,
      studentName: `${s.firstName || ''} ${s.lastName || ''}`.trim() || `Student ${s.studentNumber}`
    })
  }

  const bookings = (Array.isArray(allBookings) ? allBookings : [])
    .filter(b => b && String(b.tutorId) === String(tutorId))

  return bookings.map((b) => {
    const byNumber = studentByNumber.get(String(b.studentNumber))
    const student = byNumber || (b.student || {})
    return {
      ...b,
      studentNumber:
        b.studentNumber ||
        (b.student && b.student.studentNumber) ||
        (student && student.studentNumber) ||
        '',
      studentName:
        b.studentName ||
        (b.student && b.student.studentName) ||
        (student && student.studentName) ||
        ''
    }
  })
}
