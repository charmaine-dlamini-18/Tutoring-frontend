import { request } from './http'

const BASE_URL = '/tutoring/booking'

export function getAllBookings() {
  return request(`${BASE_URL}/getAll`, { label: 'Booking' })
}

export function getBookingById(bookingId) {
  return request(`${BASE_URL}/read/${encodeURIComponent(bookingId)}`, { label: 'Booking' })
}

export function createBooking(booking, tutorId) {
  const query = tutorId ? `?tutorId=${encodeURIComponent(tutorId)}` : ''
  return request(`${BASE_URL}/create${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking),
    label: 'Booking'
  })
}

export function updateBooking(booking) {
  return request(`${BASE_URL}/update`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking),
    label: 'Booking'
  })
}

export function deleteBooking(bookingId) {
  return request(`${BASE_URL}/delete/${encodeURIComponent(bookingId)}`, {
    method: 'DELETE',
    label: 'Booking'
  }).then(() => true)
}
