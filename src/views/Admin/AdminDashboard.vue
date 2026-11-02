<template>
  <div class="admin-page">
    <header class="admin-hero">
      <div class="hero-glow"></div>
      <div class="admin-heading">
        <span class="eyebrow">Admin Dashboard</span>
        <h1>Welcome back<span v-if="admin">, {{ admin.name }}</span></h1>
        <p class="hero-sub">
          Manage tutors, students, bookings and payments all in one place.
        </p>
      </div>
      <button type="button" class="refresh-btn" @click="loadAll" :disabled="loading">
        <span class="refresh-dot" :class="{ spinning: loading }"></span>
        {{ loading ? 'Refreshing...' : 'Refresh' }}
      </button>
    </header>

    <p v-if="error" class="error alert">{{ error }}</p>

    <section class="stat-grid">
      <div
        class="stat stat--students"
        :class="{ 'is-active': tab === 'Students' }"
        role="button"
        tabindex="0"
        @click="tab = 'Students'"
        @keydown.enter="tab = 'Students'"
        @keydown.space.prevent="tab = 'Students'"
      >
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13A4 4 0 0 1 16 11" />
          </svg>
        </div>
        <div class="stat-body">
          <span class="stat-label">Students</span>
          <strong>{{ stats.totalStudents }}</strong>
        </div>
      </div>
      <div
        class="stat stat--tutors"
        :class="{ 'is-active': tab === 'Tutors' }"
        role="button"
        tabindex="0"
        @click="tab = 'Tutors'"
        @keydown.enter="tab = 'Tutors'"
        @keydown.space.prevent="tab = 'Tutors'"
      >
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M22 10 12 5 2 10l10 5 10-5Z" />
            <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" />
          </svg>
        </div>
        <div class="stat-body">
          <span class="stat-label">Tutors</span>
          <strong>{{ stats.totalTutors }}</strong>
        </div>
      </div>
      <div
        class="stat stat--subjects"
        :class="{ 'is-active': tab === 'Subjects' }"
        role="button"
        tabindex="0"
        @click="tab = 'Subjects'"
        @keydown.enter="tab = 'Subjects'"
        @keydown.space.prevent="tab = 'Subjects'"
      >
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
          </svg>
        </div>
        <div class="stat-body">
          <span class="stat-label">Subjects</span>
          <strong>{{ stats.totalSubjects }}</strong>
        </div>
      </div>
      <div
        class="stat stat--bookings"
        :class="{ 'is-active': tab === 'Bookings' }"
        role="button"
        tabindex="0"
        @click="tab = 'Bookings'"
        @keydown.enter="tab = 'Bookings'"
        @keydown.space.prevent="tab = 'Bookings'"
      >
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </div>
        <div class="stat-body">
          <span class="stat-label">Bookings</span>
          <strong>{{ stats.totalBookings }}</strong>
        </div>
      </div>
      <div
        class="stat stat--pending"
        :class="{ 'is-active': tab === 'Payments' }"
        role="button"
        tabindex="0"
        @click="tab = 'Payments'"
        @keydown.enter="tab = 'Payments'"
        @keydown.space.prevent="tab = 'Payments'"
      >
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </div>
        <div class="stat-body">
          <span class="stat-label">Payments</span>
          <strong>{{ payments.length }}</strong>
        </div>
      </div>
      <div
        class="stat stat--revenue"
        :class="{ 'is-active': tab === 'Payments' }"
        role="button"
        tabindex="0"
        @click="tab = 'Payments'"
        @keydown.enter="tab = 'Payments'"
        @keydown.space.prevent="tab = 'Payments'"
      >
        <div class="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M3 3v18h18" />
            <path d="M7 15l4-4 3 3 5-6" />
          </svg>
        </div>
        <div class="stat-body">
          <span class="stat-label">Total revenue</span>
          <strong>{{ money(stats.totalRevenue) }}</strong>
        </div>
      </div>
    </section>

    <!-- Tutors -->
    <section v-if="tab === 'Tutors'" class="panel">
      <div class="panel-head">
        <div>
          <h2>Tutors</h2>
          <p class="muted">Manage tutor profiles and the subjects they teach.</p>
        </div>
        <span class="count-pill">{{ tutorSubjects.length }} total</span>
      </div>
      <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Tutor ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Hourly rate</th>
            <th>Subjects taught</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in tutorSubjects" :key="t.tutorId">
            <td>{{ t.tutorId }}</td>
            <td>
              <div class="person">
                <span class="avatar avatar--tutor">{{ initials(t.tutorName) }}</span>
                <span>{{ t.tutorName }}</span>
              </div>
            </td>
            <td>{{ t.email }}</td>
            <td>{{ t.phone }}</td>
            <td>{{ money(t.hourlyRate) }}</td>
            <td>
              <span v-if="!t.subjectsTaught || !t.subjectsTaught.length" class="muted">None</span>
              <span v-else class="chip" v-for="s in t.subjectsTaught" :key="s">{{ s }}</span>
            </td>
            <td class="row-actions">
              <button type="button" class="ghost small" @click="editTutor(t)">Edit</button>
              <button type="button" class="danger small" @click="removeTutor(t.tutorId)">Delete</button>
            </td>
          </tr>
          <tr v-if="!tutorSubjects.length">
            <td colspan="7" class="empty-state">No tutors found.</td>
          </tr>
        </tbody>
      </table>
      </div>
    </section>

    <!-- Students -->
    <section v-if="tab === 'Students'" class="panel">
      <div class="panel-head">
        <div>
          <h2>Students</h2>
          <p class="muted">View and update registered student accounts.</p>
        </div>
        <span class="count-pill">{{ studentBookings.length }} total</span>
      </div>
      <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Student Number</th>
            <th>Name</th>
            <th>Email</th>
            <th>Level of Study</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in studentBookings" :key="s.studentNumber">
            <td>{{ s.studentNumber }}</td>
            <td>
              <div class="person">
                <span class="avatar avatar--student">{{ initials(s.studentName) }}</span>
                <span>{{ s.studentName }}</span>
              </div>
            </td>
            <td>{{ s.email }}</td>
            <td>{{ s.levelOfStudy }}</td>
            <td class="row-actions">
              <button type="button" class="danger small" @click="removeStudent(s.studentNumber)">Delete</button>
            </td>
          </tr>
          <tr v-if="!studentBookings.length">
            <td colspan="5" class="empty-state">No students found.</td>
          </tr>
        </tbody>
      </table>
      </div>
    </section>

    <!-- Subjects -->
    <section v-if="tab === 'Subjects'" class="panel">
      <div class="panel-head">
        <div>
          <h2>Subjects</h2>
          <p class="muted">Create and maintain the subject catalogue.</p>
        </div>
        <span class="count-pill">{{ subjects.length }} total</span>
      </div>
      <form class="inline-form" @submit.prevent="addSubject">
        <input v-model.trim="newSubject.subjectCode" placeholder="Subject code" required />
        <input v-model.trim="newSubject.subjectName" placeholder="Subject name" required />
        <input v-model.trim="newSubject.gradeLevel" placeholder="Grade level" />
        <input v-model.trim="newSubject.subjectDescription" placeholder="Description" />
        <button type="submit" :disabled="saving">Add subject</button>
      </form>

      <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Grade</th>
            <th>Description</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in subjects" :key="s.subjectCode">
            <td>{{ s.subjectCode }}</td>
            <td>{{ s.subjectName }}</td>
            <td>{{ s.gradeLevel }}</td>
            <td>{{ s.subjectDescription }}</td>
            <td class="row-actions">
              <button type="button" class="ghost small" @click="editSubject(s)">Edit</button>
              <button type="button" class="danger small" @click="removeSubject(s.subjectCode)">Delete</button>
            </td>
          </tr>
          <tr v-if="!subjects.length">
            <td colspan="5" class="empty-state">No subjects yet.</td>
          </tr>
        </tbody>
      </table>
      </div>
    </section>

    <!-- Bookings -->
    <section v-if="tab === 'Bookings'" class="panel">
      <div class="panel-head">
        <div>
          <h2>Bookings</h2>
          <p class="muted">Review scheduled tutoring sessions across the platform.</p>
        </div>
        <span class="count-pill">{{ bookings.length }} total</span>
      </div>
      <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Booking ID</th>
            <th>Date</th>
            <th>Duration</th>
            <th>Session Type</th>
            <th>Subject Code</th>
            <th>Student</th>
            <th>Tutor</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in bookings" :key="b.bookingId">
            <td>{{ b.bookingId }}</td>
            <td>{{ date(b.date) }}</td>
            <td>{{ b.duration }}</td>
            <td>{{ b.sessionType }}</td>
            <td>{{ b.subjectCode }}</td>
            <td>{{ b.studentNumber || '—' }}</td>
            <td>{{ b.tutorId || '—' }}</td>
            <td class="row-actions">
              <button type="button" class="ghost small" @click="editBooking(b)">Edit</button>
              <button type="button" class="danger small" @click="removeBooking(b.bookingId)">Delete</button>
            </td>
          </tr>
          <tr v-if="!bookings.length">
            <td colspan="8" class="empty-state">No bookings yet.</td>
          </tr>
        </tbody>
      </table>
      </div>
    </section>

    <!-- Payments -->
    <section v-if="tab === 'Payments'" class="panel">
      <div class="panel-head">
        <div>
          <h2>Payments</h2>
          <p class="muted">Track payment references, amounts and statuses.</p>
        </div>
        <span class="count-pill">{{ payments.length }} total</span>
      </div>
      <div class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>Reference</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in payments" :key="p.paymentRef">
            <td>{{ p.paymentRef }}</td>
            <td>{{ money(p.amount) }}</td>
            <td>{{ p.paymentMethod }}</td>
            <td>
              <span class="badge" :class="statusClass(p.status)">{{ p.status }}</span>
            </td>
            <td>{{ date(p.paymentDate) }}</td>
          </tr>
          <tr v-if="!payments.length">
            <td colspan="5" class="empty-state">No payments yet.</td>
          </tr>
        </tbody>
      </table>
      </div>
    </section>

    <!-- Edit Modal -->
    <div v-if="editModal.show" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h3>{{ editModal.title }}</h3>
        <form @submit.prevent="saveEdit">
          <div v-for="(field, idx) in editModal.fields" :key="idx" class="modal-field">
            <label>{{ field.label }}</label>
            <input
              v-model="editModal.form[field.key]"
              :type="field.type || 'text'"
              :disabled="field.disabled"
              required
            />
          </div>
          <p v-if="editModal.error" class="error">{{ editModal.error }}</p>
          <div class="modal-actions">
            <button type="button" class="ghost" @click="closeModal">Cancel</button>
            <button type="submit" class="submit-btn" :disabled="saving">
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import {
  getAdminSession,
  getDashboard,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getBookingsWithPeople,
  updateBooking,
  deleteBooking,
  getPayments,
  deleteStudent,
  deleteTutor
} from '@/services/adminService'
import { updateTutor } from '@/services/tutorService'

export default {
  name: 'AdminDashboard',
  data() {
    return {
      admin: getAdminSession(),
      tab: 'Tutors',
      loading: false,
      saving: false,
      error: '',
      stats: {
        totalStudents: 0,
        totalTutors: 0,
        totalSubjects: 0,
        totalBookings: 0,
        pendingPayments: 0,
        totalRevenue: 0
      },
      tutorSubjects: [],
      studentBookings: [],
      subjects: [],
      bookings: [],
      payments: [],
      newSubject: {
        subjectCode: '',
        subjectName: '',
        gradeLevel: '',
        subjectDescription: ''
      },
      editModal: {
        show: false,
        title: '',
        fields: [],
        form: {},
        type: '',
        original: null,
        error: ''
      }
    }
  },
  created() {
    this.loadAll()
  },
  methods: {
    async loadAll() {
      this.loading = true
      this.error = ''
      try {
      let dashboardRes
      let subjectsRes
      let bookingsRes
      let paymentsRes = []
      const results = await Promise.allSettled([
        getDashboard(),
        getSubjects(),
        getBookingsWithPeople(),
        getPayments()
      ])
      dashboardRes = results[0].status === 'fulfilled' ? results[0].value : null
      subjectsRes = results[1].status === 'fulfilled' ? results[1].value : []
      bookingsRes = results[2].status === 'fulfilled' ? results[2].value : []
      paymentsRes = results[3].status === 'fulfilled' ? results[3].value : []
      if (results[3].status === 'rejected') {
        console.warn('Payments load failed:', results[3].reason)
      }

      if (dashboardRes) {
        this.stats = dashboardRes.stats || this.stats
        this.tutorSubjects = dashboardRes.tutorSubjectSummaries || []
        this.studentBookings = dashboardRes.studentBookingSummaries || []
      }
      this.subjects = subjectsRes || []
      this.payments = paymentsRes || []
      this.bookings = bookingsRes || []
      } catch (e) {
        this.error = e.message || 'Could not load dashboard data'
      } finally {
        this.loading = false
      }
    },

    // --- Subjects ---
    async addSubject() {
      this.saving = true
      this.error = ''
      try {
        await createSubject({ ...this.newSubject })
        this.newSubject = { subjectCode: '', subjectName: '', gradeLevel: '', subjectDescription: '' }
        this.subjects = (await getSubjects()) || []
      } catch (e) {
        this.error = e.message || 'Could not create subject'
      } finally {
        this.saving = false
      }
    },
    editSubject(s) {
      this.openModal('Edit Subject', [
        { label: 'Code', key: 'subjectCode', disabled: true },
        { label: 'Name', key: 'subjectName' },
        { label: 'Grade', key: 'gradeLevel' },
        { label: 'Description', key: 'subjectDescription' }
      ], { ...s }, 'subject')
    },
    async removeSubject(subjectCode) {
      if (!window.confirm(`Delete subject ${subjectCode}?`)) return
      try {
        await deleteSubject(subjectCode)
        this.subjects = (await getSubjects()) || []
      } catch (e) {
        this.error = e.message || 'Could not delete subject'
      }
    },

    // --- Students ---
    async removeStudent(studentNumber) {
      if (!window.confirm(`Delete student ${studentNumber}?`)) return
      try {
        await deleteStudent(studentNumber)
        this.loadAll()
      } catch (e) {
        this.error = e.message || 'Could not delete student'
      }
    },

    // --- Tutors ---
    editTutor(t) {
      this.openModal('Edit Tutor', [
        { label: 'Tutor ID', key: 'tutorId', disabled: true },
        { label: 'Name', key: 'tutorName' },
        { label: 'Email', key: 'email', type: 'email' },
        { label: 'Phone', key: 'phone', type: 'tel' },
        { label: 'Hourly Rate', key: 'hourlyRate', type: 'number' }
      ], { ...t }, 'tutor')
    },
    async removeTutor(tutorId) {
      if (!window.confirm(`Delete tutor ${tutorId}?`)) return
      try {
        await deleteTutor(tutorId)
        this.loadAll()
      } catch (e) {
        this.error = e.message || 'Could not delete tutor'
      }
    },

    // --- Bookings ---
    editBooking(b) {
      this.openModal('Edit Booking', [
        { label: 'Booking ID', key: 'bookingId', disabled: true },
        { label: 'Subject Code', key: 'subjectCode' },
        { label: 'Session Type', key: 'sessionType' },
        { label: 'Duration', key: 'duration', type: 'number' },
        { label: 'Date', key: 'date', type: 'date' }
      ], { ...b }, 'booking')
    },
    async removeBooking(bookingId) {
      if (!window.confirm(`Delete booking ${bookingId}?`)) return
      try {
        await deleteBooking(bookingId)
        this.loadAll()
      } catch (e) {
        this.error = e.message || 'Could not delete booking'
      }
    },

    // --- Modal ---
    openModal(title, fields, form, type) {
      this.editModal = { show: true, title, fields, form: { ...form }, type, original: form, error: '' }
    },
    closeModal() {
      this.editModal.show = false
    },
    async saveEdit() {
      this.saving = true
      this.editModal.error = ''
      try {
        const form = this.editModal.form
        if (this.editModal.type === 'subject') {
          await updateSubject(form)
          this.subjects = (await getSubjects()) || []
        } else if (this.editModal.type === 'tutor') {
          await updateTutor({
            tutorId: form.tutorId,
            firstName: form.tutorName.split(' ')[0] || '',
            lastName: form.tutorName.split(' ').slice(1).join(' ') || '',
            email: form.email,
            hourlyRate: form.hourlyRate
          })
          this.loadAll()
        } else if (this.editModal.type === 'booking') {
          await updateBooking(form)
          this.loadAll()
        }
        this.closeModal()
      } catch (e) {
        this.editModal.error = e.message || 'Could not save'
      } finally {
        this.saving = false
      }
    },

    initials(name) {
      if (!name) return '?'
      return String(name)
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('')
    },
    money(value) {
      const n = Number(value || 0)
      return `R ${n.toFixed(2)}`
    },
    date(value) {
      if (!value) return '—'
      const d = new Date(value)
      return isNaN(d.getTime()) ? String(value) : d.toLocaleString()
    },
    statusClass(status) {
      const s = String(status || '').toUpperCase()
      if (s.includes('PAID') || s.includes('COMPLETE')) return 'ok'
      if (s.includes('PEND')) return 'warn'
      if (s.includes('FAIL') || s.includes('CANCEL')) return 'bad'
      return ''
    }
  }
}
</script>

<style scoped>
.admin-page {
  max-width: 1200px;
  margin: 28px auto 72px;
  padding: 0 20px;
}

.admin-hero {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
  padding: 28px 30px;
  border-radius: 16px;
  background:
    radial-gradient(circle at 88% 12%, rgba(76, 212, 148, 0.32), transparent 42%),
    linear-gradient(135deg, #1b3348 0%, #1d3a50 52%, #123528 100%);
  box-shadow: 0 12px 30px rgba(18, 40, 58, 0.24);
}

.hero-glow {
  position: absolute;
  right: -60px;
  bottom: -110px;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(76, 212, 148, 0.28), transparent 70%);
  pointer-events: none;
}

.admin-heading {
  position: relative;
  z-index: 1;
}

.admin-heading .eyebrow {
  display: inline-block;
  margin-bottom: 8px;
  padding: 3px 10px;
  border-radius: 999px;
  background: rgba(76, 212, 148, 0.16);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #baf3d4;
}

.admin-hero h1 {
  margin: 0;
  font-size: 28px;
  letter-spacing: -0.01em;
  color: #fff;
}

.hero-sub {
  margin: 8px 0 0;
  max-width: 560px;
  font-size: 14px;
  line-height: 1.55;
  color: rgba(223, 230, 238, 0.78);
}

.hero-sub strong {
  color: #baf3d4;
  font-weight: 600;
}

.refresh-btn {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: background 0.15s ease, border-color 0.15s ease;
}

.refresh-btn:hover {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(186, 243, 212, 0.6);
}

.refresh-btn:disabled {
  opacity: 0.7;
  cursor: default;
}

.refresh-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4cd494;
  box-shadow: 0 0 0 3px rgba(76, 212, 148, 0.22);
}

.refresh-dot.spinning {
  animation: pulse 0.9s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.15);
  }
}

button.ghost {
  padding: 8px 14px;
  border: 1px solid #d3dbe4;
  background: #fff;
  color: #2c3e50;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
}

button.ghost:hover {
  border-color: #42b983;
  color: #1e7d54;
  background: #f4fbf8;
}

button.ghost:disabled {
  opacity: 0.6;
  cursor: default;
}

button.ghost.small {
  padding: 5px 11px;
  font-size: 12px;
}

button.danger {
  padding: 6px 12px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: #fdecea;
  color: #a12c1e;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

button.danger:hover {
  background: #c0392b;
  color: #fff;
}

button.danger.small {
  padding: 5px 11px;
  font-size: 12px;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin: 20px 0 26px;
}

.stat {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 11px;
  background: #fff;
  border: 1px solid #e8edf3;
  border-radius: 12px;
  padding: 14px;
  box-shadow: 0 1px 3px rgba(16, 42, 67, 0.05);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.stat:focus-visible {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.18);
}

.stat.is-active {
  border-color: #42b983;
  box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.16), 0 8px 20px rgba(16, 42, 67, 0.08);
}

.stat::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #42b983;
}

.stat:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(16, 42, 67, 0.1);
}

.stat-icon {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: #eef8f3;
  color: #1e7d54;
}

.stat-icon svg {
  width: 19px;
  height: 19px;
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.stat-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #7f8c8d;
  white-space: nowrap;
}

.stat strong {
  font-size: 21px;
  font-weight: 700;
  line-height: 1.15;
  color: #22384c;
}

.stat--students::before {
  background: #42b983;
}

.stat--tutors::before {
  background: #38a3d1;
}

.stat--tutors .stat-icon {
  background: #e8f5fb;
  color: #2b8bb6;
}

.stat--subjects::before {
  background: #9b6bd6;
}

.stat--subjects .stat-icon {
  background: #f3edfb;
  color: #7d4fbb;
}

.stat--bookings::before {
  background: #e2a53c;
}

.stat--bookings .stat-icon {
  background: #fdf5e4;
  color: #b8801f;
}

.stat--pending::before {
  background: #e07b39;
}

.stat--pending .stat-icon {
  background: #fdf0e7;
  color: #c96524;
}

.stat--revenue::before {
  background: #1e7d54;
}

.person {
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
}

.avatar {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.avatar--tutor {
  background: #e8f5fb;
  color: #2b8bb6;
}

.avatar--student {
  background: #eef8f3;
  color: #1e7d54;
}

.panel {
  background: #fff;
  border: 1px solid #e8edf3;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(16, 42, 67, 0.05);
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid #eef2f6;
}

.panel-head h2 {
  margin: 0;
  font-size: 18px;
  color: #22384c;
}

.panel-head p {
  margin: 4px 0 0;
  font-size: 13px;
}

.count-pill {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  background: #f1f6f4;
  color: #1e7d54;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.table-wrap {
  overflow-x: auto;
  border-radius: 8px;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.table th,
.table td {
  text-align: left;
  padding: 12px 10px;
  border-bottom: 1px solid #eef2f6;
  vertical-align: top;
}

.table th {
  color: #7f8c8d;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  background: #fafbfc;
  white-space: nowrap;
}

.table tbody tr {
  transition: background 0.12s ease;
}

.table tbody tr:hover {
  background: #f6fbf8;
}

.table tbody tr:last-child td {
  border-bottom: none;
}

.empty-state {
  text-align: center;
  padding: 28px 10px;
  color: #7f8c8d;
  font-style: italic;
}

.row-actions {
  white-space: nowrap;
  display: flex;
  gap: 6px;
}

.chip {
  display: inline-block;
  background: #eaf6f0;
  color: #1e7d54;
  border-radius: 999px;
  padding: 2px 10px;
  margin: 0 4px 4px 0;
  font-size: 12px;
}

.badge {
  display: inline-block;
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 12px;
  background: #eef2f6;
}

.badge.ok {
  background: #eaf6f0;
  color: #1e7d54;
}

.badge.warn {
  background: #fdf3e2;
  color: #a86611;
}

.badge.bad {
  background: #fdecea;
  color: #a12c1e;
}

.inline-form {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 18px;
  padding: 14px;
  background: #f8fafb;
  border: 1px solid #eef2f6;
  border-radius: 10px;
}

.inline-form input {
  flex: 1 1 150px;
  padding: 9px 12px;
  border: 1px solid #d3dbe4;
  border-radius: 6px;
  font-size: 14px;
  background: #fff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.inline-form input:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.16);
}

.inline-form button {
  padding: 9px 18px;
  border: none;
  border-radius: 6px;
  background: #42b983;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.inline-form button:hover {
  background: #36a574;
}

.muted {
  color: #7f8c8d;
}

.error {
  color: #c0392b;
}

.alert {
  margin: 14px 0 0;
  padding: 10px 14px;
  border: 1px solid #f5c6c0;
  background: #fdecea;
  border-radius: 8px;
  font-size: 14px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(22, 40, 58, 0.5);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 420px;
  max-width: 92vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 24px 70px rgba(16, 42, 67, 0.3);
}

.modal h3 {
  margin: 0 0 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eef2f6;
  font-size: 18px;
  color: #22384c;
}

.modal-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.modal-field label {
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #55657a;
}

.modal-field input {
  padding: 10px 12px;
  border: 1px solid #d3dbe4;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.modal-field input:focus {
  outline: none;
  border-color: #42b983;
  box-shadow: 0 0 0 3px rgba(66, 185, 131, 0.16);
}

.modal-field input:disabled {
  background: #f0f2f5;
  color: #7f8c8d;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.submit-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 4px;
  background: #42b983;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
}

.submit-btn:disabled {
  background: #9fd8bf;
  cursor: not-allowed;
}

@media (max-width: 720px) {
  .admin-page {
    margin-top: 18px;
    padding: 0 14px;
  }

  .admin-hero {
    padding: 22px 20px;
  }

  .admin-hero h1 {
    font-size: 22px;
  }

  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .stat {
    padding: 12px;
    gap: 9px;
  }

  .stat-icon {
    width: 32px;
    height: 32px;
  }

  .stat-icon svg {
    width: 17px;
    height: 17px;
  }

  .stat strong {
    font-size: 19px;
  }

  .panel {
    padding: 16px 14px;
  }
}
</style>
