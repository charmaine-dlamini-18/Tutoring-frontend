<template>
  <div class="reset-shell">
    <div class="auth-card">
      <!-- HERO -->
      <header class="auth-hero">
        <brand-logo :size="68" class="hero-logo" />
        <h1>Reset password</h1>
        <p>Enter your email and choose a new password.</p>
      </header>

      <!-- BODY -->
      <div class="auth-body">
        <form @submit.prevent="submit">
          <label>
            Email address
            <input v-model.trim="email" type="email" placeholder="you@example.com" required>
          </label>
          <label>
            New password
            <div class="password-wrapper">
              <input v-model="newPassword" :type="showNew ? 'text' : 'password'" placeholder="Enter a new password" required minlength="8">
              <button type="button" class="password-toggle" @click="showNew = !showNew" :aria-label="showNew ? 'Hide password' : 'Show password'">
                <svg v-if="!showNew" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              </button>
            </div>
          </label>
          <label>
            Confirm new password
            <div class="password-wrapper">
              <input v-model="confirmPassword" :type="showConfirm ? 'text' : 'password'" placeholder="Repeat the new password" required>
              <button type="button" class="password-toggle" @click="showConfirm = !showConfirm" :aria-label="showConfirm ? 'Hide password' : 'Show password'">
                <svg v-if="!showConfirm" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
              </button>
            </div>
          </label>

          <transition name="fade">
            <p v-if="error" class="banner error-banner">{{ error }}</p>
          </transition>
          <transition name="fade">
            <p v-if="success" class="banner success-banner">{{ success }}</p>
          </transition>

          <button type="submit" class="submit-btn" :disabled="loading">
            {{ loading ? 'Saving...' : 'Save new password' }}
          </button>
        </form>
      </div>

      <!-- FOOTER -->
      <footer class="auth-footer">
        <p>
          Remembered it?
          <router-link :to="{ path: '/login', query: { role: role } }">Back to login</router-link>
        </p>
      </footer>
    </div>
  </div>
</template>

<script>
import { resetPassword } from '@/services/authService'
import BrandLogo from '@/components/BrandLogo.vue'

const VALID_ROLES = ['student', 'tutor', 'admin']

export default {
  name: 'ResetPasswordView',
  components: {
    BrandLogo
  },
  data() {
    return {
      role: this.$route.query.role && VALID_ROLES.includes(this.$route.query.role)
        ? this.$route.query.role
        : 'student',
      email: '',
      newPassword: '',
      confirmPassword: '',
      error: '',
      success: '',
      loading: false,
      showNew: false,
      showConfirm: false
    }
  },
  methods: {
    async submit() {
      this.error = ''
      this.success = ''
      if (this.newPassword !== this.confirmPassword) {
        this.error = 'Passwords do not match'
        return
      }
      this.loading = true
      try {
        await resetPassword(this.email, this.newPassword)
        this.success = 'Password updated. You can now sign in.'
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
.reset-shell {
  min-height: calc(100vh - 58px);
  display: flex;
  justify-content: center;
  padding: 20px 16px;
  background:
    radial-gradient(circle at 12% 18%, rgba(66, 185, 131, 0.14), transparent 42%),
    radial-gradient(circle at 88% 82%, rgba(44, 62, 80, 0.12), transparent 45%),
    #f5f7fa;
}

.auth-card {
  display: flex;
  flex-direction: column;
  width: 560px;
  max-width: 100%;
  min-height: calc(100vh - 98px);
  background: #fff;
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 18px 48px rgba(31, 59, 83, 0.22);
}

/* HERO */
.auth-hero {
  background: linear-gradient(120deg, #24435c 0%, #2c3e50 55%, #256d51 100%);
  color: #fff;
  text-align: center;
  padding: 40px 32px 36px;
  position: relative;
}

.auth-hero::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 26px;
  background: #fff;
  border-radius: 26px 26px 0 0;
}

.hero-logo {
  display: block;
  margin: 0 auto 18px;
  border-radius: 18px;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.35);
}

.auth-hero h1 {
  margin: 0 0 8px;
  font-size: 30px;
}

.auth-hero p {
  margin: 0;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.78);
  position: relative;
  z-index: 1;
}

/* BODY */
.auth-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 10px 48px 34px;
}

/* FORM */
form {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #55657a;
  text-align: left;
}

input {
  padding: 14px 16px;
  border: 1px solid #c5cfdc;
  border-radius: 9px;
  font-size: 15.5px;
  font-weight: normal;
  letter-spacing: normal;
  text-transform: none;
  color: #2c3e50;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

input::placeholder {
  color: #a5b1bf;
  letter-spacing: normal;
  text-transform: none;
  font-weight: normal;
}

input:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.18);
}

.password-wrapper {
  position: relative;
  display: flex;
  align-items: center;
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

/* BANNERS */
.banner {
  margin: 0;
  padding: 12px 16px;
  border-radius: 9px;
  font-size: 14.5px;
  text-align: left;
}

.error-banner {
  background: #fce8e6;
  color: #96281b;
  border: 1px solid #f2b8b5;
}

.success-banner {
  background: #e7f7ee;
  color: #1e7a58;
  border: 1px solid #b8e4cd;
}

/* SUBMIT */
.submit-btn {
  margin-top: 8px;
  padding: 15px;
  border: none;
  border-radius: 9px;
  background: linear-gradient(120deg, #2f9e69, #256d51);
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.15s ease;
  box-shadow: 0 4px 14px rgba(37, 109, 81, 0.28);
}

.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 7px 18px rgba(37, 109, 81, 0.38);
}

.submit-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* FOOTER */
.auth-footer {
  background: #f2f6f9;
  border-top: 1px solid #e4e9ef;
  padding: 18px;
  text-align: center;
}

.auth-footer p {
  margin: 0;
  font-size: 14.5px;
  color: #6b7a89;
}

.auth-footer a {
  color: #1e7a58;
  font-weight: bold;
  text-decoration: none;
}

.auth-footer a:hover {
  text-decoration: underline;
}

/* TRANSITION */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
