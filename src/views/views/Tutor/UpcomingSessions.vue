<template>
  <div class="sessions-layout">
    <main class="sessions-content">
      <section class="sessions-header">
        <div>
          <p class="header-label">SESSIONS</p>
          <h1>Upcoming Sessions</h1>
          <p class="header-description">
            View your upcoming tutoring sessions and scheduled bookings.
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
          <p class="summary-label">TOTAL UPCOMING</p>
          <h2>{{ upcomingSessions.length }}</h2>
          <p>Upcoming sessions</p>
        </div>

        <div class="summary-card">
          <p class="summary-label">ONLINE</p>
          <h2>{{ onlineUpcoming }}</h2>
          <p>Online sessions</p>
        </div>

        <div class="summary-card">
          <p class="summary-label">IN PERSON</p>
          <h2>{{ inPersonUpcoming }}</h2>
          <p>In-person sessions</p>
        </div>
      </section>

      <section class="sessions-card">
        <div class="card-header">
          <div>
            <h2>Upcoming Schedule</h2>
            <p>Your scheduled tutoring sessions</p>
          </div>
        </div>

        <div class="table-header">
          <span>Date</span>
          <span>Time</span>
          <span>Student Number</span>
          <span>Subject</span>
          <span>Duration</span>
          <span>Session Type</span>
          <span>Action</span>
        </div>

        <div
          v-for="session in upcomingSessions"
          :key="session.bookingId"
          class="session-row"
        >
          <span>{{ formatDate(session.date) }}</span>
          <span>{{ formatTime(session.date) }}</span>
          <span>{{ getStudentNumber(session) }}</span>
          <span>{{ session.subjectCode }}</span>
          <span>{{ session.duration }} min</span>
          <span>{{ session.sessionType }}</span>
          <button
            class="cancel-button"
            @click="openCancelModal(session)"
          >
            Cancel Session
          </button>
        </div>

        <div
          v-if="upcomingSessions.length === 0"
          class="empty-state"
        >
          <div class="empty-circle">—</div>
          <h3>No upcoming sessions</h3>
          <p>You don't have any upcoming tutoring sessions scheduled.</p>
        </div>
      </section>
    </main>

    <div
      v-if="showCancelModal"
      class="modal-overlay"
      @click.self="closeCancelModal"
    >
      <section
        class="confirmation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-title"
      >
        <h2 id="cancel-title">Cancel Session?</h2>

        <p>
          Are you sure you want to cancel this tutoring session?
        </p>

        <div v-if="selectedSession" class="modal-details">
          <p><strong>Subject:</strong> {{ selectedSession.subjectCode }}</p>
          <p><strong>Date:</strong> {{ formatDate(selectedSession.date) }}</p>
          <p><strong>Time:</strong> {{ formatTime(selectedSession.date) }}</p>
          <p><strong>Student:</strong> {{ getStudentNumber(selectedSession) }}</p>
        </div>

        <p class="modal-warning">
          The session will move to Cancelled Sessions on this PC.
        </p>

        <div class="modal-actions">
          <button class="keep-button" @click="closeCancelModal">
            Keep Session
          </button>
          <button class="confirm-button" @click="confirmCancellation">
            Yes, Cancel Session
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { getSession } from "@/services/authService";
import { getTutorSessions } from "@/services/tutorService";
import { request } from "@/services/http";
const CANCELLED_STORAGE_KEY = "tutorCancelledSessions";
const DELETED_STORAGE_KEY = "tutorDeletedBookingIds";

export default {
  name: "UpcomingSessions",

  data() {
    return {
      upcomingSessions: [],
      students: [],
      showCancelModal: false,
      selectedSession: null,
      refreshing: false
    };
  },

  computed: {
    onlineUpcoming() {
      return this.upcomingSessions.filter(
        session => this.normalizeSessionType(session.sessionType) === "online"
      ).length;
    },

    inPersonUpcoming() {
      return this.upcomingSessions.filter(
        session => this.normalizeSessionType(session.sessionType) === "in person"
      ).length;
    }
  },

  async mounted() {
  await this.loadUpcomingSessions();

  window.addEventListener(
    "tutor-cancellations-updated",
    this.loadUpcomingSessions
  );
},

beforeUnmount() {
  window.removeEventListener(
    "tutor-cancellations-updated",
    this.loadUpcomingSessions
  );
},

  methods: {
    async refreshSessions() {
      this.refreshing = true;

      try {
        await this.loadUpcomingSessions();
      } finally {
        this.refreshing = false;
      }
    },

    getCancelledSessions() {
      try {
        const saved = localStorage.getItem(CANCELLED_STORAGE_KEY);
        const sessions = saved ? JSON.parse(saved) : [];
        return Array.isArray(sessions) ? sessions : [];
      } catch (error) {
        console.error("Failed to read cancelled sessions:", error);
        return [];
      }
    },

    getStudentNumber(session) {
      const matchingStudent = this.students.find(student =>
        Array.isArray(student.bookings) &&
        student.bookings.some(
          booking => booking.bookingId === session.bookingId
        )
      );

      if (matchingStudent) {
        return matchingStudent.studentNumber;
      }

      return session.studentNumber || "Student not found";
    },

    normalizeSessionType(type) {
      return (type || "")
        .toLowerCase()
        .trim()
        .replace(/[_-]/g, " ");
    },

    
async loadUpcomingSessions() {
  try {
    const session = getSession();

    if (!session || session.role !== "tutor" || !session.id) {
      this.upcomingSessions = [];
      this.students = [];
      return;
    }

    const [bookings, students] = await Promise.all([
      getTutorSessions(session.id),
      request("/tutoring/student/getAll", { label: "Student" }).catch(() => [])
    ]);

    this.students = Array.isArray(students) ? students : [];

    if (!Array.isArray(bookings)) {
      throw new Error("Tutor bookings could not be loaded");
    }

    const deletedIds = JSON.parse(
      localStorage.getItem(DELETED_STORAGE_KEY) || "[]"
    );

    const cancelledIds = new Set([
      ...this.getCancelledSessions().map(
        booking => String(booking.bookingId)
      ),
      ...(Array.isArray(deletedIds) ? deletedIds : []).map(String)
    ]);

    const now = new Date();

    this.upcomingSessions = bookings.filter(booking => {
      if (
        cancelledIds.has(String(booking.bookingId)) ||
        !booking.payment ||
        String(booking.payment.status).trim().toUpperCase() !== "PAID" ||
        !booking.date
      ) {
        return false;
      }

      const bookingDate = new Date(booking.date);

      return (
        !Number.isNaN(bookingDate.getTime()) &&
        bookingDate > now
      );
    });
  } catch (error) {
    console.error("Failed to load upcoming sessions:", error);
    this.upcomingSessions = [];
    this.students = [];
  }
},


    openCancelModal(session) {
      this.selectedSession = session;
      this.showCancelModal = true;
    },

    closeCancelModal() {
      this.showCancelModal = false;
      this.selectedSession = null;
    },

    confirmCancellation() {
      if (!this.selectedSession) {
        return;
      }

      try {
        const cancelledSessions = this.getCancelledSessions();

        const alreadyCancelled = cancelledSessions.some(
          booking =>
            String(booking.bookingId) ===
            String(this.selectedSession.bookingId)
        );

        if (!alreadyCancelled) {
          const cancelledBooking = {
            ...this.selectedSession,
            bookingId: this.selectedSession.bookingId,
            studentNumber: this.getStudentNumber(this.selectedSession),
            date: this.selectedSession.date,
            subjectCode: this.selectedSession.subjectCode,
            duration: this.selectedSession.duration,
            sessionType: this.selectedSession.sessionType,
            cancelledAt: new Date().toISOString()
          };

          cancelledSessions.push(cancelledBooking);

          localStorage.setItem(
            CANCELLED_STORAGE_KEY,
            JSON.stringify(cancelledSessions)
            
          );
          window.dispatchEvent(new Event("tutor-cancellations-updated"));
        }

        this.upcomingSessions = this.upcomingSessions.filter(
          booking =>
            String(booking.bookingId) !==
            String(this.selectedSession.bookingId)
        );

        this.closeCancelModal();
      } catch (error) {
        console.error("Failed to save cancellation:", error);
        alert("The cancellation could not be saved on this PC.");
      }
    },

    formatDate(date) {
      if (!date) return "";
      return new Date(date).toLocaleDateString();
    },

    formatTime(date) {
      if (!date) return "";
      return new Date(date).toLocaleTimeString([], {
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
  grid-template-columns: 1fr 1fr 1.4fr 1fr 0.8fr 1fr 1.3fr;
  gap: 10px;
  min-width: 850px;
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

.cancel-button,
.confirm-button {
  background-color: #c0392b;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 9px 12px;
  cursor: pointer;
  font-size: 12px;
}

.cancel-button:hover,
.confirm-button:hover {
  background-color: #a93226;
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

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: rgba(0, 0, 0, 0.5);
}

.confirmation-modal {
  width: 100%;
  max-width: 440px;
  padding: 28px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 10px 35px rgba(0, 0, 0, 0.2);
}

.confirmation-modal h2 {
  margin: 0 0 12px;
  font-size: 22px;
}

.confirmation-modal > p {
  color: #667085;
  font-size: 14px;
  line-height: 1.5;
}

.modal-details {
  margin: 18px 0;
  padding: 14px;
  background-color: #f7f8fa;
  border-radius: 8px;
}

.modal-details p {
  margin: 7px 0;
  font-size: 13px;
}

.modal-warning {
  font-size: 12px !important;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 22px;
}

.keep-button {
  background-color: #ffffff;
  color: #344054;
  border: 1px solid #d0d5dd;
  border-radius: 6px;
  padding: 10px 14px;
  cursor: pointer;
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
