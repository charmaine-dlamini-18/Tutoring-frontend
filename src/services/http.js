const AUTH_KEY = 'tutoring_auth'

export function saveCredentials(email, password) {
  localStorage.setItem(AUTH_KEY, `Basic ${btoa(`${email}:${password}`)}`)
}

export function clearCredentials() {
  localStorage.removeItem(AUTH_KEY)
}

export function hasCredentials() {
  return Boolean(localStorage.getItem(AUTH_KEY))
}

function authHeader() {
  const value = localStorage.getItem(AUTH_KEY)
  return value ? { Authorization: value } : {}
}

async function errorMessage(response) {
  let text = ''
  try {
    text = await response.text()
  } catch (e) {
    text = ''
  }

  if (text) {
    try {
      const body = JSON.parse(text)
      if (body && (body.message || body.detail || body.error)) {
        return body.message || body.detail || body.error
      }
    } catch (e) {
      return text
    }
  }

  if (response.status === 401) {
    return 'The email or password is not correct.'
  }
  if (response.status === 403) {
    return 'You do not have permission to perform this action.'
  }
  return `Request failed: ${response.status} ${response.statusText}`
}

async function parseJson(response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch (e) {
    throw new Error('Invalid response from server')
  }
}

export async function request(path, options = {}) {
  const { headers: extraHeaders, ...rest } = options
  const response = await fetch(path, {
    ...rest,
    headers: {
      ...authHeader(),
      ...(extraHeaders || {})
    }
  })

  if (!response.ok) {
    const error = new Error(await errorMessage(response))
    error.status = response.status
    throw error
  }

  return parseJson(response)
}

export async function verifyCredentials(email, password) {
  const response = await fetch('/tutoring/auth/me', {
    headers: { Authorization: `Basic ${btoa(`${email}:${password}`)}` }
  })

  if (!response.ok) {
    const error = new Error(await errorMessage(response))
    error.status = response.status
    throw error
  }

  return parseJson(response)
}
