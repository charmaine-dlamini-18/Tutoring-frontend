<template>
  <div class="auth-page">
    <h1>Change Password</h1>

    <p v-if="session.role === 'admin'" class="card error">
      Admin accounts do not have a password in the current system.
    </p>

    <form v-else class="card" @submit.prevent="submit">
      <div class="password-wrapper">
        <input v-model="currentPassword" :type="showCurrent ? 'text' : 'password'" placeholder="Current Password" required>
        <button type="button" class="password-toggle" @click="showCurrent = !showCurrent" :aria-label="showCurrent ? 'Hide password' : 'Show password'">
          <svg v-if="!showCurrent" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
        </button>
      </div>
      <div class="password-wrapper">
        <input v-model="newPassword" :type="showNew ? 'text' : 'password'" placeholder="New Password" minlength="8" required>
        <button type="button" class="password-toggle" @click="showNew = !showNew" :aria-label="showNew ? 'Hide password' : 'Show password'">
          <svg v-if="!showNew" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
        </button>
      </div>
      <div class="password-wrapper">
        <input v-model="confirmPassword" :type="showConfirm ? 'text' : 'password'" placeholder="Confirm New Password" required>
        <button type="button" class="password-toggle" @click="showConfirm = !showConfirm" :aria-label="showConfirm ? 'Hide password' : 'Show password'">
          <svg v-if="!showConfirm" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
        </button>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">Password changed successfully.</p>
      <button type="submit" :disabled="loading">{{ loading ? 'Saving...' : 'Save New Password' }}</button>
    </form>

    <p class="switch">
      <router-link to="/">Back to home</router-link>
    </p>
  </div>
</template>

<script>
import { getSession, changeStudentPassword, changeTutorPassword } from '@/services/authService'

export default {
  name: 'ChangePasswordView',
  data() {
    return {
      session: getSession(),
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      error: '',
      success: false,
      loading: false,
      showCurrent: false,
      showNew: false,
      showConfirm: false
    }
  },
  methods: {
    async submit() {
      this.error = ''
      this.success = false
      if (this.newPassword !== this.confirmPassword) {
        this.error = 'New passwords do not match'
        return
      }
      this.loading = true
      try {
        if (this.session.role === 'student') {
          await changeStudentPassword(this.session.id, this.currentPassword, this.newPassword)
        } else {
          await changeTutorPassword(this.session.id, this.currentPassword, this.newPassword)
        }
        this.success = true
        this.currentPassword = ''
        this.newPassword = ''
        this.confirmPassword = ''
      } catch (e) {
        this.error = e.message
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.auth-page {
  min-height: calc(100vh - 58px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  padding: 40px 16px;
  background: linear-gradient(180deg, #f7fafc 0%, #f5f7fa 100%);
}

h1 {
  margin: 0;
  color: #2c3e50;
}

.card {
  width: min(420px, 100%);
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #fff;
  border-radius: 14px;
  padding: 28px;
  box-shadow: 0 18px 40px rgba(31, 59, 83, 0.16);
}

.card.error {
  color: #96281b;
  background: #fce8e6;
  border: 1px solid #f2b8b5;
}

input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #d7dfe8;
  border-radius: 10px;
  font-size: 15px;
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.password-wrapper input {
  width: 100%;
  padding-right: 48px;
}

.password-toggle {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7a89;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px;
}

.password-toggle:hover {
  color: #2f9e69;
}

button {
  padding: 12px 16px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(120deg, #2f9e69, #256d51);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  margin: 0;
  color: #96281b;
}

.success {
  margin: 0;
  color: #1e7a58;
}

.switch {
  margin: 0;
}

.switch a {
  color: #1e7a58;
  font-weight: 600;
  text-decoration: none;
}

.switch a:hover {
  text-decoration: underline;
}
</style>
