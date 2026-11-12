<template>
  <div class="sessions-layout">
    <main class="sessions-content">
      <section class="sessions-header">
        <div>
          <p class="header-label">SESSIONS</p>
          <h1>Completed Sessions</h1>
          <p class="header-description">
            View tutoring sessions that have already been completed.
          </p>
        </div>
      </section>

      <section class="session-summary">
        <div class="summary-card">
          <p class="summary-label">TOTAL COMPLETED</p>
          <h2>{{ completedSessions.length }}</h2>
          <p>Completed sessions</p>
        </div>

        <div class="summary-card">
          <p class="summary-label">ONLINE</p>
          <h2>{{ onlineCompleted }}</h2>
          <p>Online sessions</p>
        </div>

        <div class="summary-card">
          <p class="summary-label">IN PERSON</p>
          <h2>{{ inPersonCompleted }}</h2>
          <p>In-person sessions</p>
        </div>
      </section>

      <section class="sessions-card">
        <div class="card-header">
          <div>
            <h2>Completed Session History</h2>
            <p>Your previously completed sessions</p>
          </div>
        </div>

        <div class="table-scroll">
          <div class="table-header">
            <span>Date</span>
            <span>Student</span>
            <span>Subject</span>
            <span>Duration</span>
            <span>Session Type</span>
          </div>

          <div
            v-for="session in completedSessions"
            :key="session.bookingId"
            class="session-row"
          >
            <span>{{ formatDate(session.date) }}</span>
            <span>{{ session.studentName || session.studentNumber || '—' }}</span>
            <span>{{ session.subjectCode }}</span>
            <span>{{ session.duration }} min</span>
            <span>{{ session.sessionType }}</span>
          </div>
        </div>

        <p v-if="error" class="error">{{ error }}</p>

        <div
          v-if="!loading && completedSessions.length === 0"
          class="empty-state"
        >
          <div class="empty-circle">✓</div>
          <h3>No completed sessions</h3>
          <p>Your completed tutoring sessions will appear here.</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import { getSession } from '@/services/authService'
import { getTutorSessions } from '@/services/tutorService'

export default {
  name: 'CompletedSessions',

  data() {
    return {
      completedSessions: [],
      loading: false,
      error: ''
    }
  },

  computed: {
    onlineCompleted() {
      return this.completedSessions.filter(
        session => this.normalizeSessionType(session.sessionType) === 'online'
      ).length
    },

    inPersonCompleted() {
      return this.completedSessions.filter(
        session => this.normalizeSessionType(session.sessionType) === 'in person'
      ).length
    }
  },

  mounted() {
    this.loadCompletedSessions()
  },

  methods: {
    normalizeSessionType(type) {
      return String(type || '')
        .toLowerCase()
        .trim()
        .replace(/[_-]/g, ' ')
    },

    formatDate(value) {
      if (!value) return '—'

      const date = new Date(value)

      if (Number.isNaN(date.getTime())) {
        return String(value)
      }

      return date.toLocaleString('en-ZA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    async loadCompletedSessions() {
      const session = getSession()

      if (!session || !session.id) {
        this.completedSessions = []
        return
      }

      this.loading = true
      this.error = ''

      try {
        const bookings = await getTutorSessions(session.id)
        const now = new Date()

        this.completedSessions = (Array.isArray(bookings) ? bookings : [])
          .filter(booking => {
            if (
              !booking.payment ||
              String(booking.payment.status).trim().toUpperCase() !== 'PAID'
            ) {
              return false
            }

            if (!booking.date) return false

            const bookingDate = new Date(booking.date)

            return (
              !Number.isNaN(bookingDate.getTime()) &&
              bookingDate < now
            )
          })
          .sort((a, b) => new Date(b.date) - new Date(a.date))
      } catch (e) {
        this.error = e.message || 'Could not load completed sessions'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.sessions-content {
  min-height: 100vh;
  padding: 30px;
  box-sizing: border-box;
  background-color: #f7f8fa;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  color: #2c3e50;
  text-align: left;
}

.sessions-header {
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

.sessions-header h1 {
  font-size: 30px;
  margin: 0;
}

.header-description {
  color: #d7dde3;
  font-size: 14px;
  margin: 7px 0 0;
}

.session-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-bottom: 22px;
}

.summary-card {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-top: 4px solid #f28c28;
  border-radius: 10px;
  padding: 20px;
}

.summary-label {
  color: #8a94a3;
  font-size: 10px;
  font-weight: bold;
  letter-spacing: 1px;
  margin: 0;
}

.summary-card h2 {
  color: #2c3e50;
  font-size: 32px;
  margin: 14px 0 2px;
}

.summary-card p {
  color: #8a94a3;
  font-size: 13px;
  margin: 0;
}

.sessions-card {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 22px;
}

.card-header {
  padding-bottom: 14px;
  border-bottom: 1px solid #e5e7eb;
}

.card-header h2 {
  margin: 0;
  font-size: 17px;
}

.card-header p {
  color: #8a94a3;
  font-size: 12px;
  margin: 4px 0 0;
}

.table-scroll {
  overflow-x: auto;
}

.table-header,
.session-row {
  display: grid;
  grid-template-columns: 1.3fr 1.5fr 1.3fr 0.8fr 1.2fr;
  gap: 12px;
  min-width: 650px;
  padding: 14px 5px;
  align-items: center;
}

.table-header {
  color: #8a94a3;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
}

.session-row {
  border-top: 1px solid #e5e7eb;
  font-size: 13px;
}

.empty-state {
  min-height: 250px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.empty-circle {
  width: 38px;
  height: 38px;
  background-color: #fff3e7;
  color: #f28c28;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-bottom: 10px;
}

.empty-state h3 {
  margin: 0 0 5px;
  font-size: 14px;
}

.empty-state p {
  margin: 0;
  color: #8a94a3;
  font-size: 12px;
}

.error {
  margin: 12px 0 0;
  color: #c0392b;
  font-size: 13px;
}

@media (max-width: 900px) {
  .session-summary {
    grid-template-columns: 1fr;
  }
}
</style>
