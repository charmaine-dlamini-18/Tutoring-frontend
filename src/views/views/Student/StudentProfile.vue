<template>
    <!-- edit form for the students details -->
    <div class="page-layout" :class="{ embedded: embedded }">

        <main class="page-content narrow">

            <section class="page-header">
                <div>
                    <p class="header-label">STUDENT</p>
                    <h1>Profile</h1>
                    <p class="header-description">
                        Keep your details up to date.
                    </p>
                </div>
            </section>

            <!-- the form with all the editable details -->
            <div class="dashboard-card">

                <div class="card-header">
                    <div>
                        <h2>Your Details</h2>
                        <p>Update your student information</p>
                    </div>

                    <div class="profile-summary">

                        <div class="profile-avatar">
                            {{ initials }}
                        </div>

                        <div class="profile-name">
                            <h3>{{ fullName }}</h3>
                            <p>Student</p>
                        </div>

                    </div>
                </div>

                <form @submit.prevent="saveProfile">
                    <label>Student Number<input v-model="profileForm.studentNumber" type="text" disabled></label>
                    <div class="grid-2">
                        <label>First Name<input v-model.trim="profileForm.firstName" type="text" required></label>
                        <label>Last Name<input v-model.trim="profileForm.lastName" type="text" required></label>
                    </div>
                    <label>Email<input v-model.trim="profileForm.email" type="email" required></label>
                    <div class="grid-2">
                        <label>Phone Number<input v-model.trim="profileForm.phoneNumber" type="text" required></label>
                        <label>Level of Study<input v-model.trim="profileForm.levelOfStudy" type="text" required></label>
                    </div>
                    <button type="submit" class="action-button block" :disabled="loading">
                        {{ loading ? 'Saving...' : 'Update Profile' }}
                    </button>
                    <button type="button" class="outline-button block pw-btn" @click="$router.push('/change-password')">
                        Change Password
                    </button>
                </form>

            </div>

            <!-- danger zone, deleting the account cannot be undone -->
            <div class="danger-zone">
                <h3>Danger Zone</h3>
                <p>Permanently delete your account and sign out. Your booking history will be removed.</p>
                <button type="button" class="small-button danger" @click="deleteMyAccount">Delete My Account</button>
            </div>

        </main>

    </div>
</template>

<script>
import { getSession, saveSession, logout } from '@/services/authService'
import { updateStudent, deleteStudent } from '@/services/studentService'

export default {
    name: "StudentProfile",

    props: {
        me: {
            type: Object,
            default: () => ({})
        },

        embedded: {
            type: Boolean,
            default: false
        }
    },

    data() {
        return {
            session: getSession(),
            loading: false,
            profileForm: {}
        }
    },

    computed: {
        fullName() {
            const name = `${this.me.firstName || ''} ${this.me.lastName || ''}`.trim()

            if (name) {
                return name
            }

            return this.session ? this.session.name : "Student"
        },

        initials() {
            const words = this.fullName.trim().split(" ").filter(Boolean)

            if (words.length === 0) {
                return "S"
            }

            if (words.length === 1) {
                return words[0].charAt(0).toUpperCase()
            }

            return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
        }
    },

    // once the students info arrives we fill the form with it
    watch: {
        me: {
            immediate: true,
            handler(me) {
                if (!me || !me.studentNumber) {
                    return
                }

                this.profileForm = {
                    studentNumber: me.studentNumber,
                    firstName: me.firstName,
                    lastName: me.lastName,
                    email: me.email,
                    phoneNumber: me.phoneNumber,
                    levelOfStudy: me.levelOfStudy
                }
            }
        }
    },

    methods: {
        notify(type, message) {
            this.$emit("notify", { type, message })
        },

        // saves the changes and updates the stored session name
        async saveProfile() {
            this.loading = true
            try {
                await updateStudent({
                    ...this.profileForm,
                    password: this.me.password
                })
                this.session.name = `${this.profileForm.firstName} ${this.profileForm.lastName}`
                saveSession(this.session)
                this.$emit("refresh")
                this.notify('success', 'Profile updated.')
            } catch (e) {
                this.notify('error', e.message)
            } finally {
                this.loading = false
            }
        },

        // warns the student first, then deletes the account and logs out
        async deleteMyAccount() {
            const ok = window.confirm('This will permanently delete your account. Continue?')
            if (!ok) return

            try {
                await deleteStudent(this.me.studentNumber)
                logout()
                this.$router.push('/login')
            } catch (e) {
                this.notify('error', e.message)
            }
        }
    }
}
</script>

<style scoped>
.page-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f7f8fa;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  color: #2c3e50;
  text-align: left;
}

.page-content {
  flex: 1;
  padding: 30px;
  box-sizing: border-box;
}

.page-content.narrow {
  max-width: 820px;
}

.page-header {
  background-color: #2c3e50;
  color: #ffffff;
  padding: 32px;
  border-radius: 12px;
  margin-bottom: 22px;
}

.header-label {
  color: #f28c28;
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 1.5px;
  margin: 0 0 7px;
}

.page-header h1 {
  font-size: 30px;
  margin: 0;
}

.header-description {
  color: #d7dde3;
  font-size: 14px;
  margin: 7px 0 0;
}

.dashboard-card {
  background-color: #ffffff;
  border-top: 4px solid #f28c28;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 26px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
  padding-bottom: 14px;
  border-bottom: 1px solid #e5e7eb;
}

.card-header h2 {
  font-size: 18px;
  margin: 0;
}

.profile-summary {
  display: flex;
  align-items: center;
  gap: 12px;
}

.profile-avatar {
  width: 45px;
  height: 45px;
  background-color: #2c3e50;
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.profile-name h3 {
  margin: 0;
  font-size: 14px;
}

.profile-name p {
  margin: 3px 0 0;
  color: #8a94a3;
  font-size: 11px;
}

form {
  margin-top: 20px;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 600px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}

label {
  display: flex;
  flex-direction: column;
  gap: 7px;
  font-size: 13px;
  font-weight: bold;
  color: #55657a;
  text-align: left;
  margin-bottom: 16px;
}

input {
  padding: 11px 13px;
  border: 1px solid #c5cfdc;
  border-radius: 7px;
  font-size: 14px;
  font-weight: normal;
  font-family: inherit;
  color: #2c3e50;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

input:focus {
  outline: none;
  border-color: #f28c28;
  box-shadow: 0 0 0 3px rgba(242, 140, 40, 0.18);
}

input[disabled] {
  background: #f0f3f7;
  color: #7f8c8d;
}

.action-button {
  background-color: #2c3e50;
  color: #ffffff;
  border: none;
  border-radius: 7px;
  padding: 12px 18px;
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;
}

.action-button:hover {
  background-color: #f28c28;
}

.action-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-button.block,
.outline-button.block {
  display: block;
  width: 100%;
}

.outline-button {
  background-color: #ffffff;
  color: #b35c10;
  border: 1px solid #f28c28;
  border-radius: 7px;
  padding: 12px 18px;
  font-family: inherit;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
}

.outline-button:hover {
  background-color: #fff7ef;
}

.pw-btn {
  margin-top: 12px;
}

.danger-zone {
  background-color: #fdf4f3;
  border: 1px solid #eec7c3;
  border-radius: 10px;
  padding: 24px 26px;
  margin-bottom: 30px;
}

.danger-zone h3 {
  margin: 0 0 8px;
  font-size: 17px;
  color: #96281b;
}

.danger-zone p {
  font-size: 13px;
  margin: 0 0 16px;
  color: #55657a;
}

.small-button {
  background-color: #c0392b;
  color: #ffffff;
  border: none;
  border-radius: 7px;
  padding: 10px 16px;
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
}

.small-button:hover {
  background-color: #96281b;
}

/* EMBEDDED (modal) MODE */
.page-layout.embedded {
  min-height: auto;
  background: transparent;
}

.page-layout.embedded .page-content {
  padding: 0;
  max-width: none;
}

.page-layout.embedded .page-header {
  display: none;
}

</style>
