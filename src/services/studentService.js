import { request } from './http'

const BASE_URL = '/tutoring/student'

export function getAllStudents() {
  return request(`${BASE_URL}/getAll`, { label: 'Student' })
}

export function getStudentById(studentNumber) {
  return request(`${BASE_URL}/read/${encodeURIComponent(studentNumber)}`, { label: 'Student' })
}

export function createStudent(student) {
  return request(`${BASE_URL}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(student),
    label: 'Register'
  })
}

export function updateStudent(student) {
  return request(`${BASE_URL}/update`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(student),
    label: 'Student'
  })
}

export function deleteStudent(studentNumber) {
  return request(`${BASE_URL}/delete/${encodeURIComponent(studentNumber)}`, {
    method: 'DELETE',
    label: 'Student'
  }).then(() => true)
}
