const CANCELLED_BOOKINGS_KEY = 'cancelledBookings'

export function getCancelledBookings() {
  try {
    const saved = JSON.parse(localStorage.getItem(CANCELLED_BOOKINGS_KEY) || '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

export function saveCancelledBooking(booking) {
  const existing = getCancelledBookings()
  const already = existing.find(b => String(b.bookingId) === String(booking.bookingId))
  if (already) return
  existing.push(booking)
  localStorage.setItem(CANCELLED_BOOKINGS_KEY, JSON.stringify(existing))
  window.dispatchEvent(new Event('cancelled-bookings-updated'))
}

export function removeCancelledBooking(bookingId) {
  const existing = getCancelledBookings()
  const updated = existing.filter(b => String(b.bookingId) !== String(bookingId))
  localStorage.setItem(CANCELLED_BOOKINGS_KEY, JSON.stringify(updated))
  window.dispatchEvent(new Event('cancelled-bookings-updated'))
}

export function getCancelledBookingsForTutor(tutorId) {
  if (!tutorId) return []
  return getCancelledBookings().filter(b => String(b.tutorId) === String(tutorId))
}

export function getCancelledBookingsForStudent(studentNumber) {
  if (!studentNumber) return []
  return getCancelledBookings().filter(b => String(b.studentNumber) === String(studentNumber))
}
