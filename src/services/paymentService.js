import { request } from './http'

const BASE_URL = '/tutoring/payment'

export function getAllPayments() {
  return request(`${BASE_URL}/getAll`, { label: 'Payment' })
}

export function getPaymentById(paymentRef) {
  return request(`${BASE_URL}/read/${encodeURIComponent(paymentRef)}`, { label: 'Payment' })
}

export function createPayment(payment, bookingId) {
  const id = bookingId || (payment.booking && payment.booking.bookingId)
  const query = id ? `?bookingId=${encodeURIComponent(id)}` : ''
  return request(`${BASE_URL}/create${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payment),
    label: 'Payment'
  })
}

export function updatePayment(payment) {
  return request(`${BASE_URL}/update`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payment),
    label: 'Payment'
  })
}

export function deletePayment(paymentRef) {
  return request(`${BASE_URL}/delete/${encodeURIComponent(paymentRef)}`, {
    method: 'DELETE',
    label: 'Payment'
  }).then(() => true)
}
