import { request } from './http'

const BASE_URL = '/tutoring/subject'

export function getAllSubjects() {
  return request(`${BASE_URL}/getAll`, { label: 'Subject' })
}

export function getSubjectById(subjectCode) {
  return request(`${BASE_URL}/read/${encodeURIComponent(subjectCode)}`, { label: 'Subject' })
}

export function createSubject(subject) {
  return request(`${BASE_URL}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subject),
    label: 'Subject'
  })
}

export function updateSubject(subject) {
  return request(`${BASE_URL}/update`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subject),
    label: 'Subject'
  })
}

export function deleteSubject(subjectCode) {
  return request(`${BASE_URL}/delete/${encodeURIComponent(subjectCode)}`, {
    method: 'DELETE',
    label: 'Subject'
  }).then(() => true)
}
