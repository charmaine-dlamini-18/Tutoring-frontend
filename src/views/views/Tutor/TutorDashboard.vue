<template>
  <div class="dashboard-layout">
    <main class="dashboard-content">
      <section class="dashboard-header">
        <h1>Welcome back, {{ fullName }}</h1>
        <p class="header-description">
          Manage your sessions and tutoring activity.
        </p>
      </section>

      <section class="summary-cards">
        <div class="summary-card clickable-card" @click="changePage('today')">
          <span class="summary-label">TODAY</span>
          <h2>{{ todaysSessions.length }}</h2>
          <p>Today's Sessions</p>
        </div>

        <div class="summary-card clickable-card" @click="changePage('upcoming')">
          <span class="summary-label">UPCOMING</span>
          <h2>{{ upcomingSessions.length }}</h2>
          <p>Upcoming Sessions</p>
        </div>

        <div class="summary-card clickable-card" @click="changePage('completed')">
          <span class="summary-label">COMPLETED</span>
          <h2>{{ completedSessions.length }}</h2>
          <p>Completed Sessions</p>
        </div>

        <div class="summary-card clickable-card" @click="changePage('cancelled')">
          <span class="summary-label">CANCELLED</span>
          <h2>{{ cancelledSessions.length }}</h2>
          <p>Cancelled Sessions</p>
        </div>
      </section>

      <section class="dashboard-card">
        <div class="card-header">
          <div>
            <h2>Today's Sessions</h2>
            <p>Your tutoring schedule for today</p>
          </div>

          <button class="text-button" @click="changePage('today')">
            View All
          </button>
        </div>

        <div v-if="todaysSessions.length === 0" class="empty-state">
          <div class="empty-circle">—</div>
          <h3>No sessions scheduled</h3>
          <p>You don't have any tutoring sessions scheduled for today.</p>
        </div>

        <div v-else class="session-list">
          <div
            v-for="session in todaysSessions"
            :key="session.bookingId"
            class="session-row"
          >
            <div>
              <strong>{{ session.subjectCode }}</strong>
              <p>{{ session.sessionType }}</p>
            </div>

            <div class="session-time">
              {{ formatTime(session.date) }}
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import { getSession } from '@/services/authService'
import { getTutorById, getTutorSessions } from '@/services/tutorService'

const CANCELLED_STORAGE_KEY = 'tutorCancelledSessions'
const DELETED_STORAGE_KEY = 'tutorDeletedBookingIds'

export default {
  name: 'TutorDashboard',

  data() {
    return {
      session: null,
      tutor: {
        tutorId: '',
        firstName: '',
        lastName: '',
        email: ''
      },
      todaysSessions: [],
      upcomingSessions: [],
      completedSessions: [],
      cancelledSessions: []
    }
  },

  computed: {
    fullName() {
      const name =
        `${this.tutor.firstName} ${this.tutor.lastName}`.trim()

      if (name) return name

      return this.session && this.session.name
        ? this.session.name
        : 'Tutor'
    }
  },

  async created() {
    const session = getSession()

    if (!session || session.role !== 'tutor' || !session.id) {
      return
    }

    this.session = session

    try {
      const tutor = await getTutorById(session.id)

      if (tutor && Object.keys(tutor).length) {
        this.tutor = {
          tutorId: tutor.tutorId || '',
          firstName: tutor.firstName || '',
          lastName: tutor.lastName || '',
          email: tutor.email || ''
        }
      }
    } catch (error) {
      console.error('Could not load tutor details:', error)
    }

    await this.loadDashboardBookings()
  },

  mounted() {
    window.addEventListener(
      'tutor-cancellations-updated',
      this.loadDashboardBookings
    )
  },

  beforeUnmount() {
    window.removeEventListener(
      'tutor-cancellations-updated',
      this.loadDashboardBookings
    )
  },

  methods: {
    changePage(page) {
      this.$emit('change-page', page)
    },

    getStoredSessions() {
      try {
        const saved = JSON.parse(
          localStorage.getItem(CANCELLED_STORAGE_KEY) || '[]'
        )

        return Array.isArray(saved) ? saved : []
      } catch {
        return []
      }
    },

    getStoredIds(key) {
      try {
        const saved = JSON.parse(localStorage.getItem(key) || '[]')
        return Array.isArray(saved) ? saved.map(String) : []
      } catch {
        return []
      }
    },

    async loadDashboardBookings() {
      try {
        if (!this.session || !this.session.id) return

        this.cancelledSessions = this.getStoredSessions()

        const bookings = await getTutorSessions(this.session.id)
        const allBookings = Array.isArray(bookings) ? bookings : []

        const excludedIds = new Set([
          ...this.cancelledSessions.map(
            booking => String(booking.bookingId)
          ),
          ...this.getStoredIds(DELETED_STORAGE_KEY)
        ])

        const activeBookings = allBookings.filter(booking =>
          !excludedIds.has(String(booking.bookingId)) &&
          booking.payment &&
          String(booking.payment.status).trim().toUpperCase() === 'PAID'
        )

        const now = new Date()

        this.todaysSessions = activeBookings.filter(booking => {
          if (!booking.date) return false

          const date = new Date(booking.date)

          return (
            !Number.isNaN(date.getTime()) &&
            date.toDateString() === now.toDateString()
          )
        })

        this.upcomingSessions = activeBookings.filter(booking => {
          if (!booking.date) return false

          const date = new Date(booking.date)

          return !Number.isNaN(date.getTime()) && date > now
        })

        this.completedSessions = allBookings.filter(booking => {
  if (!booking.date) return false

  const date = new Date(booking.date)

  return !Number.isNaN(date.getTime()) && date < now
})
      } catch (error) {
        console.error('Could not load dashboard bookings:', error)
        this.todaysSessions = []
        this.upcomingSessions = []
        this.completedSessions = []
        this.cancelledSessions = this.getStoredSessions()
      }
    },

    formatTime(date) {
      if (!date) return ''

      const parsedDate = new Date(date)

      if (Number.isNaN(parsedDate.getTime())) return ''

      return parsedDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.dashboard-layout {
  min-height: 100vh;
  background-color: #f4f7fc;
  background-image:
    radial-gradient(circle at 92% 6%, rgba(59, 130, 246, 0.12), transparent 40%),
    linear-gradient(180deg, #f7f9fc 0%, #eef3f9 100%);
  font-family: Avenir, Helvetica, Arial, sans-serif;
  color: #2c3e50;
  text-align: left;
}

.dashboard-content {
  padding: 30px;
  box-sizing: border-box;
}

.dashboard-header {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #1f2d45 0%, #2c3e50 48%, #355a72 100%);
  color: #ffffff;
  padding: 34px 32px;
  border: 1px solid rgba(242, 140, 40, 0.32);
  border-radius: 18px;
  margin-bottom: 22px;
  box-shadow: 0 14px 34px rgba(31, 45, 69, 0.22);
}

.dashboard-header::after {
  content: "";
  position: absolute;
  width: 220px;
  height: 220px;
  left: -80px;
  bottom: -130px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.35), transparent 68%);
  pointer-events: none;
}

.dashboard-header h1 {
  position: relative;
  z-index: 1;
  font-size: 30px;
  margin: 0;
}

.header-description {
  position: relative;
  z-index: 1;
  color: #d7dde3;
  font-size: 15px;
  margin: 7px 0 0;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 22px;
}

.summary-card {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #fff8ef 0%, #ffe7cf 100%);
  border: 1px solid #f7d3ab;
  border-top: 4px solid #f28c28;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 6px 18px rgba(242, 140, 40, 0.13);
}

.summary-cards .summary-card:nth-child(2) {
  background: linear-gradient(135deg, #f0f6ff 0%, #dbe8ff 100%);
  border-color: #c7d9fb;
  border-top-color: #3b82f6;
  box-shadow: 0 6px 18px rgba(59, 130, 246, 0.13);
}

.summary-cards .summary-card:nth-child(3) {
  background: linear-gradient(135deg, #edfaf4 0%, #d5f0e5 100%);
  border-color: #bfe7d5;
  border-top-color: #2e9e7a;
  box-shadow: 0 6px 18px rgba(46, 158, 122, 0.13);
}

.summary-cards .summary-card:nth-child(4) {
  background: linear-gradient(135deg, #fdf2f1 0%, #f8dcd9 100%);
  border-color: #f4c9c5;
  border-top-color: #d9534f;
  box-shadow: 0 6px 18px rgba(217, 83, 79, 0.13);
}

.summary-label {
  color: #8a94a3;
  font-size: 10px;
  font-weight: bold;
  letter-spacing: 1.2px;
}

.summary-cards .summary-card:nth-child(1) .summary-label {
  color: #b35c10;
}

.summary-cards .summary-card:nth-child(2) .summary-label {
  color: #2563a8;
}

.summary-cards .summary-card:nth-child(3) .summary-label {
  color: #1e7a58;
}

.summary-cards .summary-card:nth-child(4) .summary-label {
  color: #b03a34;
}

.summary-card h2 {
  color: #22354d;
  font-size: 32px;
  margin: 15px 0 2px;
}

.summary-cards .summary-card:nth-child(1) h2 {
  color: #b35c10;
}

.summary-cards .summary-card:nth-child(2) h2 {
  color: #2563a8;
}

.summary-cards .summary-card:nth-child(3) h2 {
  color: #1e7a58;
}

.summary-cards .summary-card:nth-child(4) h2 {
  color: #b03a34;
}

.summary-card p {
  color: #5c6b7d;
  font-size: 14px;
  margin: 0;
}

.clickable-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.clickable-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 32px rgba(44, 62, 80, 0.16);
}

.dashboard-card {
  background:
    linear-gradient(#ffffff, #ffffff) padding-box,
    linear-gradient(135deg, rgba(242, 140, 40, 0.55), rgba(59, 130, 246, 0.35)) border-box;
  border: 1.5px solid transparent;
  border-radius: 16px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(44, 62, 80, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 14px;
  border-bottom: 1px solid #eef3f9;
}

.card-header h2 {
  font-size: 17px;
  margin: 0;
  color: #22354d;
}

.card-header p {
  color: #8a94a3;
  font-size: 14px;
  margin: 4px 0 0;
}

.text-button {
  border: none;
  background: none;
  color: #e07a10;
  font-family: inherit;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
}

.text-button:hover {
  text-decoration: underline;
}

.empty-state {
  min-height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.empty-circle {
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, #fff3e7 0%, #ffe0c2 100%);
  color: #d9760f;
  border: 1px solid rgba(242, 140, 40, 0.3);
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
  color: #8a94a3;
  font-size: 14px;
  margin: 0;
}

.session-list {
  padding-top: 8px;
}

.session-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 14px 12px;
  border-bottom: 1px solid #eef2f7;
  border-radius: 10px;
  transition: background-color 0.15s ease, box-shadow 0.15s ease;
}

.session-row:hover {
  background-color: #f9fbff;
  box-shadow: inset 3px 0 0 #f28c28;
}

.session-row:last-child {
  border-bottom: none;
}

.session-row strong {
  font-size: 14px;
  color: #22354d;
}

.session-row p {
  margin: 5px 0 0;
  color: #8a94a3;
  font-size: 14px;
}

.session-time {
  font-size: 13px;
  font-weight: bold;
  color: #b35c10;
  background: linear-gradient(135deg, #fff3e7 0%, #ffe3c7 100%);
  border: 1px solid rgba(242, 140, 40, 0.3);
  border-radius: 999px;
  padding: 5px 12px;
  white-space: nowrap;
}

@media (max-width: 1050px) {
  .summary-cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .dashboard-content {
    padding: 16px;
  }

  .summary-cards {
    grid-template-columns: 1fr;
  }

  .dashboard-header {
    padding: 24px;
  }

  .dashboard-header h1 {
    font-size: 24px;
  }
}
</style>