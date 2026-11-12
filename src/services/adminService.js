import { getSession, saveSession } from '@/services/authService'
import { request } from '@/services/http'
import { getAllStudents, deleteStudent } from '@/services/studentService'
import { getAllTutors, deleteTutor } from '@/services/tutorService'
import { getAllSubjects, createSubject, updateSubject, deleteSubject } from '@/services/subjectService'
import { getAllBookings, updateBooking, deleteBooking } from '@/services/bookingService'
import { getAllPayments } from '@/services/paymentService'

const BASE_URL = '/tutoring/admin'

function personName(firstName, lastName) {
  return `${firstName || ''} ${lastName || ''}`.trim()
}

function buildBookingPeopleIndex(students, tutors) {
  const studentByBooking = new Map()
  const tutorByBooking = new Map()

  for (const s of students || []) {
    for (const b of s.bookings || []) {
      if (!b || !b.bookingId) continue
      studentByBooking.set(b.bookingId, {
        studentNumber: s.studentNumber,
        studentName: personName(s.firstName, s.lastName) || `Student ${s.studentNumber}`
      })
    }
  }

  for (const t of tutors || []) {
    for (const b of t.bookings || []) {
      if (!b || !b.bookingId) continue
      tutorByBooking.set(b.bookingId, {
        tutorId: t.tutorId,
        tutorName: personName(t.firstName, t.lastName) || `Tutor ${t.tutorId}`
      })
    }
  }

  return { studentByBooking, tutorByBooking }
}

function enrichBookings(bookings, students, tutors) {
  const { studentByBooking, tutorByBooking } = buildBookingPeopleIndex(students, tutors)

  return (bookings || []).map((b) => {
    const student = studentByBooking.get(b.bookingId)
    const tutor = tutorByBooking.get(b.bookingId)

    return {
      ...b,
      studentNumber:
        b.studentNumber ||
        (b.student && b.student.studentNumber) ||
        (student ? student.studentNumber : ''),
      studentName:
        b.studentName ||
        (b.student ? personName(b.student.firstName, b.student.lastName) : '') ||
        (student ? student.studentName : ''),
      tutorId:
        b.tutorId ||
        (b.tutor && b.tutor.tutorId) ||
        (tutor ? tutor.tutorId : ''),
      tutorName:
        b.tutorName ||
        (b.tutor ? personName(b.tutor.firstName, b.tutor.lastName) : '') ||
        (tutor ? tutor.tutorName : '')
    }
  })
}

function paidBookingIds(payments) {
  return new Set(
    (payments || [])
      .filter(p => String(p.status || '').trim().toUpperCase() === 'PAID')
      .map(p => String(p.booking && p.booking.bookingId))
      .filter(Boolean)
  )
}

function isPaidBooking(booking, paidIds) {
  const status = booking && booking.payment
    ? String(booking.payment.status || '').trim().toUpperCase()
    : ''

  return status === 'PAID' || paidIds.has(String(booking.bookingId))
}

// Money that is really coming in: completed payments, plus card/online payments
// that are still marked pending. Cash and EFT stay out until they are confirmed.
function countsTowardsRevenue(payment) {
  const status = String(payment.status || '').trim().toUpperCase()
  const method = String(payment.paymentMethod || '').trim().toUpperCase()

  if (['CANCELLED', 'CANCELED', 'FAILED', 'DECLINED', 'REFUNDED'].includes(status)) {
    return false
  }
  if (status === 'PAID' || status.includes('COMPLETE')) {
    return true
  }
  return !['CASH', 'EFT', 'BANK TRANSFER', 'BANK_TRANSFER'].includes(method)
}

export function getAdminSession() {
  return getSession()
}

export async function getDashboard() {
  const [allTutors, allStudents, subjects, bookings, payments] = await Promise.all([
    getAllTutors(),
    getAllStudents(),
    getAllSubjects(),
    getAllBookings(),
    getAllPayments()
  ])

  const tutors = allTutors || []
  const students = allStudents || []
  const subjectList = subjects || []
  const paymentList = payments || []
  const paidIds = paidBookingIds(paymentList)
  const bookingList = enrichBookings(bookings, students, tutors)
    .filter(b => isPaidBooking(b, paidIds))

  const stats = {
    totalStudents: students.length,
    totalTutors: tutors.length,
    totalSubjects: subjectList.length,
    totalBookings: bookingList.length,
    pendingPayments: paymentList.filter(p => String(p.status).toUpperCase().includes('PEND')).length,
    totalRevenue: paymentList
      .filter(countsTowardsRevenue)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0)
  }

  const tutorSubjectMap = new Map()
  for (const t of tutors) {
    tutorSubjectMap.set(t.tutorId, {
      tutorId: t.tutorId,
      tutorName: `${t.firstName || ''} ${t.lastName || ''}`.trim() || `Tutor ${t.tutorId}`,
      email: t.email || '',
      phone: t.phoneNumber || '',
      hourlyRate: t.hourlyRate || 0,
      subjectsTaught: []
    })
  }

  let tutorSubjectRecords = []
  try {
    tutorSubjectRecords = (await request('/tutoring/tutorsubject/getAll', { label: 'Tutor subject' })) || []
  } catch (e) { /* ignore */ }

  for (const ts of tutorSubjectRecords) {
    const entry = tutorSubjectMap.get(ts.tutorId)
    if (entry && ts.subjectCode && !entry.subjectsTaught.includes(ts.subjectCode)) {
      entry.subjectsTaught.push(ts.subjectCode)
    }
  }

  const studentMap = new Map()
  for (const s of students) {
    studentMap.set(s.studentNumber, {
      studentNumber: s.studentNumber,
      studentName: `${s.firstName || ''} ${s.lastName || ''}`.trim() || `Student ${s.studentNumber}`,
      email: s.email || '',
      levelOfStudy: s.levelOfStudy || '',
      bookings: []
    })
  }
  for (const b of bookingList) {
    if (b.studentNumber && studentMap.has(b.studentNumber)) {
      studentMap.get(b.studentNumber).bookings.push({
        bookingId: b.bookingId,
        subjectName: b.subjectName || '',
        subjectCode: b.subjectCode || '',
        tutorName: b.tutorName || '',
        sessionType: b.sessionType || '',
        duration: b.duration || '',
        date: b.date || '',
        paymentStatus: b.payment ? 'PAID' : 'UNPAID',
        paymentAmount: b.payment ? b.payment.amount : 0
      })
    }
  }

  return {
    stats,
    bookings: bookingList,
    tutorSubjectSummaries: Array.from(tutorSubjectMap.values()),
    studentBookingSummaries: Array.from(studentMap.values())
  }
}

export async function getBookingsWithPeople() {
  const [bookings, students, tutors, payments] = await Promise.all([
    getAllBookings(),
    getAllStudents(),
    getAllTutors(),
    getAllPayments()
  ])
  const paidIds = paidBookingIds(payments)
  return enrichBookings(bookings, students, tutors)
    .filter(b => isPaidBooking(b, paidIds))
}

export function getAllAdmins() {
  return request(`${BASE_URL}/getAll`, { label: 'Admin' })
}

export function getAdminById(adminId) {
  return request(`${BASE_URL}/read/${encodeURIComponent(adminId)}`, { label: 'Admin' })
}

export function createAdmin(admin) {
  return request(`${BASE_URL}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(admin),
    label: 'Admin'
  })
}

export function updateAdmin(admin) {
  return request(`${BASE_URL}/update`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(admin),
    label: 'Admin'
  })
}

export function deleteAdmin(adminId) {
  return request(`${BASE_URL}/delete/${encodeURIComponent(adminId)}`, {
    method: 'DELETE',
    label: 'Admin'
  }).then(() => true)
}

export { getAllStudents as getStudents, deleteStudent, getAllTutors as getTutors, deleteTutor, getAllSubjects as getSubjects, createSubject, updateSubject, deleteSubject, getAllBookings as getBookings, updateBooking, deleteBooking, getAllPayments as getPayments, saveSession }
