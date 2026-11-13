
<template>
  <div class="sessions-layout">
    <main class="sessions-content">
      <section class="sessions-header">
        <div>
          <p class="header-label">SESSIONS</p>
          <h1>Today's Sessions</h1>
          <p class="header-description">
            View and manage all tutoring sessions scheduled for today.
          </p>
        </div>

        <button
          class="refresh-button"
          :disabled="refreshing"
          @click="refreshSessions"
        >
          <svg
            class="refresh-icon"
            :class="{ spinning: refreshing }"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
          Refresh
        </button>
      </section>

      <section class="session-summary">
        <div class="summary-card">
          <p class="summary-label">TOTAL TODAY</p>
          <h2>{{ todaysSessions.length }}</h2>
          <p>Scheduled sessions</p>
        </div>

        <div class="summary-card">
          <p class="summary-label">ONLINE</p>
          <h2>{{ onlineToday }}</h2>
          <p>Online sessions</p>
        </div>

        <div class="summary-card">
          <p class="summary-label">IN PERSON</p>
          <h2>{{ inPersonToday }}</h2>
          <p>In-person sessions</p>
        </div>
      </section>

      <section class="sessions-card">
        <div class="card-header">
          <div>
            <h2>Today's Schedule</h2>
            <p>Your tutoring sessions for today</p>
          </div>
        </div>

        <div class="table-header">
          <span>Date / Time</span>
          <span>Student Number</span>
          <span>Subject</span>
          <span>Duration</span>
          <span>Session Type</span>
        </div>

        <div
          v-for="session in todaysSessions"
          :key="session.bookingId"
          class="session-row"
        >
          <span>{{ formatDateTime(session.date) }}</span>
          <span>{{ getStudentNumber(session) }}</span>
          <span>{{ session.subjectCode }}</span>
          <span>{{ session.duration }} min</span>
          <span>{{ session.sessionType }}</span>
        </div>

        <div v-if="todaysSessions.length === 0" class="empty-state">
          <div class="empty-circle">—</div>
          <h3>No sessions scheduled</h3>
          <p>You don't have any tutoring sessions scheduled for today.</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script>
import { getSession } from "@/services/authService";
import { getAllBookings } from "@/services/bookingService";
import { request } from "@/services/http";

const CANCELLED_STORAGE_KEY = "tutorCancelledSessions";
const DELETED_STORAGE_KEY = "tutorDeletedBookingIds";

export default {
  name: "TodaysSessions",

  data() {
    return {
      todaysSessions: [],
      students: [],
      refreshing: false
    };
  },

  computed: {
    onlineToday() {
      return this.todaysSessions.filter(
        session => this.normalizeSessionType(session.sessionType) === "online"
      ).length;
    },

    inPersonToday() {
      return this.todaysSessions.filter(
        session => this.normalizeSessionType(session.sessionType) === "in person"
      ).length;
    }
  },

  async mounted() {
    await this.loadTodaysSessions();

    window.addEventListener(
      "tutor-cancellations-updated",
      this.loadTodaysSessions
    );
  },

  beforeUnmount() {
    window.removeEventListener(
      "tutor-cancellations-updated",
      this.loadTodaysSessions
    );
  },

  methods: {
    normalizeSessionType(type) {
      return (type || "")
        .toLowerCase()
        .trim()
        .replace(/[_-]/g, " ");
    },

    async refreshSessions() {
      this.refreshing = true;

      try {
        await this.loadTodaysSessions();
      } finally {
        this.refreshing = false;
      }
    },

    getStoredArray(key) {
      try {
        const saved = JSON.parse(localStorage.getItem(key) || "[]");
        return Array.isArray(saved) ? saved : [];
      } catch (error) {
        console.error(`Failed to read ${key}:`, error);
        return [];
      }
    },

    getStudentNumber(session) {
      if (session.studentNumber) return session.studentNumber;

      const byBooking = this.students.find(student =>
        Array.isArray(student.bookings) &&
        student.bookings.some(b => b && String(b.bookingId) === String(session.bookingId))
      );
      if (byBooking && byBooking.studentNumber) return byBooking.studentNumber;

      return "Student not found";
    },

    async loadTodaysSessions() {
      try {
        const session = getSession();

        if (!session || session.role !== "tutor" || !session.id) {
          this.todaysSessions = [];
          this.students = [];
          return;
        }

        const [allBookings, students] = await Promise.all([
          getAllBookings().catch(() => []),
          request("/tutoring/student/getAll", { label: "Student" }).catch(() => [])
        ]);

        this.students = Array.isArray(students) ? students : [];

        const studentNumberByBookingId = new Map();
        const studentByNumber = new Map();
        for (const student of this.students) {
          if (student && student.studentNumber) {
            studentByNumber.set(String(student.studentNumber), student);
          }
          for (const b of student.bookings || []) {
            if (b && b.bookingId) {
              studentNumberByBookingId.set(String(b.bookingId), student.studentNumber);
            }
          }
        }

        const tutorId = session.tutorId || session.id;

        const cancelledSessions = this.getStoredArray(
          CANCELLED_STORAGE_KEY
        );

        const deletedIds = this.getStoredArray(
          DELETED_STORAGE_KEY
        ).map(id => String(id));

        const excludedIds = new Set([
          ...cancelledSessions.map(booking =>
            String(booking.bookingId)
          ),
          ...deletedIds
        ]);

        const now = new Date();

        const bookings = (Array.isArray(allBookings) ? allBookings : [])
          .filter(b => b && String(b.tutorId) === String(tutorId));

        this.todaysSessions = bookings
          .filter(booking => {
            if (
              excludedIds.has(String(booking.bookingId)) ||
              !booking.payment ||
              String(booking.payment.status).trim().toUpperCase() !== "PAID" ||
              !booking.date
            ) {
              return false;
            }

            const date = new Date(booking.date);

            return (
              !Number.isNaN(date.getTime()) &&
              date.getFullYear() === now.getFullYear() &&
              date.getMonth() === now.getMonth() &&
              date.getDate() === now.getDate()
            );
          })
          .map(booking => ({
            ...booking,
            studentNumber:
              booking.studentNumber ||
              (booking.student && booking.student.studentNumber) ||
              studentNumberByBookingId.get(String(booking.bookingId)) ||
              (studentByNumber.get(String(booking.studentNumber)) && studentByNumber.get(String(booking.studentNumber)).studentNumber) ||
              ""
          }));
      } catch (error) {
        console.error("Failed to load today's sessions:", error);
        this.todaysSessions = [];
        this.students = [];
      }
    },

    formatDateTime(date) {
      if (!date) return "";

      const parsedDate = new Date(date);

      if (Number.isNaN(parsedDate.getTime())) return "";

      return parsedDate.toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
  }
};
</script>

<style scoped>
.sessions-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f7f8fa;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  color: #2c3e50;
  text-align: left;
}

.sessions-content {
  flex: 1;
  min-width: 0;
  padding: 30px;
  box-sizing: border-box;
}

.sessions-header {
  background-color: #2c3e50;
  color: #ffffff;
  padding: 32px;
  border-radius: 12px;
  margin-bottom: 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
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

.refresh-button {
  background-color: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 7px;
  padding: 10px 16px;
  font-family: inherit;
  font-weight: bold;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.refresh-button:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon {
  flex-shrink: 0;
}

.refresh-icon.spinning {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
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
  overflow-x: auto;
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

.table-header,
.session-row {
  display: grid;
  grid-template-columns: 1.5fr 1.2fr 1.2fr 0.8fr 1fr;
  gap: 10px;
  min-width: 650px;
}

.table-header {
  padding: 14px 5px;
  color: #8a94a3;
  font-size: 10px;
  font-weight: bold;
}

.session-row {
  padding: 15px 5px;
  border-top: 1px solid #e5e7eb;
  font-size: 13px;
  align-items: center;
}

.empty-state {
  min-height: 220px;
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

@media (max-width: 900px) {
  .session-summary {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .sessions-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
