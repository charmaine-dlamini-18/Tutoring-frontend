import { request } from './http'
import { getAllStudents } from './studentService'

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
  const [tutor, students] = await Promise.all([
    getTutorById(tutorId),
    getAllStudents().catch(() => [])
  ])

  const bookings = (tutor && tutor.bookings) || []
  const studentList = students || []

  const studentByBooking = new Map()
  for (const s of studentList) {
    for (const b of s.bookings || []) {
      if (!b || !b.bookingId) continue
      studentByBooking.set(b.bookingId, {
        studentNumber: s.studentNumber,
        studentName: `${s.firstName || ''} ${s.lastName || ''}`.trim() || `Student ${s.studentNumber}`
      })
    }
  }

  return bookings.map((b) => {
    const student = studentByBooking.get(b.bookingId)
    return {
      ...b,
      studentNumber: b.studentNumber || (student ? student.studentNumber : ''),
      studentName: b.studentName || (student ? student.studentName : '')
    }
  })
}
