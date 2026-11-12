import { request, saveCredentials, clearCredentials, verifyCredentials } from './http'

const SESSION_KEY = 'tutoring_session'

export function getSession() {
  const raw = localStorage.getItem(SESSION_KEY)
  return raw ? JSON.parse(raw) : null
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function updateSession(changes) {
  const session = getSession()
  if (!session) {
    return null
  }
  const updated = { ...session, ...changes }
  localStorage.setItem(SESSION_KEY, JSON.stringify(updated))
  return updated
}

export function isLoggedIn() {
  return getSession() !== null
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
  clearCredentials()
}

function roleLabel(role) {
  if (!role) return 'different'
  return role.charAt(0).toUpperCase() + role.slice(1)
}

async function login(email, password, expectedRole) {
  const me = await verifyCredentials(email, password)
  const role = String(me.role || '').toLowerCase()

  if (expectedRole && role !== expectedRole) {
    throw new Error(
      `This email belongs to a ${roleLabel(role)} account, so you cannot sign in as a ${roleLabel(expectedRole)}. ` +
      `Please switch to the ${roleLabel(role)} tab.`
    )
  }

  saveCredentials(email, password)
  const session = {
    role,
    id: me.id,
    name: me.name,
    email: me.email
  }
  saveSession(session)
  return session
}

export function loginStudent(email, password) {
  return login(email, password, 'student')
}

export function loginTutor(email, password) {
  return login(email, password, 'tutor')
}

export function loginAdmin(email, password) {
  return login(email, password, 'admin')
}

function refreshCredentials(newPassword) {
  const session = getSession()
  if (session && session.email) {
    saveCredentials(session.email, newPassword)
  }
}

export async function resetPassword() {
  throw new Error('Password reset is not available. Please contact an administrator.')
}

export async function changeStudentPassword(studentNumber, currentPassword, newPassword) {
  await request('/tutoring/student/change-password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword })
  })
  refreshCredentials(newPassword)
}

export async function changeTutorPassword(tutorId, currentPassword, newPassword) {
  await request('/tutoring/tutor/change-password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword })
  })
  refreshCredentials(newPassword)
}
