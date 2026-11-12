
<template>
  <div class="sessions-layout">
    <main class="sessions-content">
      <section class="sessions-header">
        <div>
          <p class="header-label">SESSIONS</p>
          <h1>Cancelled Sessions</h1>
          <p class="header-description">
            View tutoring sessions that have been cancelled.
          </p>
        </div>
      </section>

      <section class="session-summary">
        <div class="summary-card">
          <p class="summary-label">TOTAL CANCELLED</p>
          <h2>{{ cancelledSessions.length }}</h2>
          <p>Cancelled sessions</p>
        </div>

        <div class="summary-card">
          <p class="summary-label">ONLINE</p>
          <h2>{{ onlineCancelled }}</h2>
          <p>Cancelled online sessions</p>
        </div>

        <div class="summary-card">
          <p class="summary-label">IN PERSON</p>
          <h2>{{ inPersonCancelled }}</h2>
          <p>Cancelled in-person sessions</p>
        </div>
      </section>

      <section class="sessions-card">
        <div class="card-header">
          <div>
            <h2>Cancelled Session History</h2>
            <p>Your cancelled tutoring sessions</p>
          </div>
        </div>

        <div class="table-header">
          <span>Date</span>
          <span>Student</span>
          <span>Subject</span>
          <span>Duration</span>
          <span>Session Type</span>
          <span>Action</span>
        </div>

        <div
          v-for="session in cancelledSessions"
          :key="session.bookingId"
          class="session-row"
        >
          <span>{{ formatDate(session.date) }}</span>
          <span>{{ session.studentNumber }}</span>
          <span>{{ session.subjectCode }}</span>
          <span>{{ session.duration }} min</span>
          <span>{{ session.sessionType }}</span>
          <button
            class="delete-button"
            @click="openDeleteModal(session)"
          >
            Delete Permanently
          </button>
        </div>

        <div
          v-if="cancelledSessions.length === 0"
          class="empty-state"
        >
          <div class="empty-circle">✓</div>
          <h3>No cancelled sessions</h3>
          <p>Your cancelled tutoring sessions will appear here.</p>
        </div>
      </section>
    </main>

    <div
      v-if="showDeleteModal"
      class="modal-overlay"
      @click.self="closeDeleteModal"
    >
      <section
        class="confirmation-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-title"
      >
        <h2 id="delete-title">Delete Permanently?</h2>
        <p>
          Are you sure you want to remove this record from your cancelled
          session history on this PC? This cannot be undone.
        </p>

        <div v-if="selectedSession" class="modal-details">
          <p><strong>Subject:</strong> {{ selectedSession.subjectCode }}</p>
          <p><strong>Date:</strong> {{ formatDate(selectedSession.date) }}</p>
          <p><strong>Student:</strong> {{ selectedSession.studentNumber }}</p>
        </div>

        <div class="modal-actions">
          <button class="keep-button" @click="closeDeleteModal">
            Keep Record
          </button>
          <button class="confirm-button" @click="confirmDelete">
            Yes, Delete
          </button>
        </div>
      </section>
    </div>
  </div>
</template>


<script>
const CANCELLED_STORAGE_KEY = "tutorCancelledSessions";
const DELETED_STORAGE_KEY = "tutorDeletedBookingIds";

export default {
  name: "CancelledSessions",

  data() {
    return {
      cancelledSessions: [],
      showDeleteModal: false,
      selectedSession: null
    };
  },

  computed: {
    onlineCancelled() {
      return this.cancelledSessions.filter(
        session =>
          (session.sessionType || "").toLowerCase().trim() === "online"
      ).length;
    },

    inPersonCancelled() {
      return this.cancelledSessions.filter(
        session =>
          (session.sessionType || "")
            .toLowerCase()
            .trim()
            .replace(/[_-]/g, " ") === "in person"
      ).length;
    }
  },

  mounted() {
    this.loadCancelledSessions();
    window.addEventListener(
      "tutor-cancellations-updated",
      this.loadCancelledSessions
    );
  },

  activated() {
    this.loadCancelledSessions();
  },

  beforeUnmount() {
    window.removeEventListener(
      "tutor-cancellations-updated",
      this.loadCancelledSessions
    );
  },

  methods: {
    loadCancelledSessions() {
      try {
        const saved = localStorage.getItem(CANCELLED_STORAGE_KEY);
        const sessions = saved ? JSON.parse(saved) : [];

        this.cancelledSessions = Array.isArray(sessions) ? sessions : [];
      } catch (error) {
        console.error("Failed to load cancelled sessions:", error);
        this.cancelledSessions = [];
      }
    },

    openDeleteModal(session) {
      this.selectedSession = session;
      this.showDeleteModal = true;
    },

    closeDeleteModal() {
      this.showDeleteModal = false;
      this.selectedSession = null;
    },

    confirmDelete() {
      if (!this.selectedSession) {
        return;
      }

      try {
        const deletedIds = JSON.parse(
          localStorage.getItem(DELETED_STORAGE_KEY) || "[]"
        );

        const bookingId = String(this.selectedSession.bookingId);

        if (!deletedIds.map(String).includes(bookingId)) {
          deletedIds.push(bookingId);
        }

        localStorage.setItem(
          DELETED_STORAGE_KEY,
          JSON.stringify(deletedIds)
        );

        const updatedSessions = this.cancelledSessions.filter(
          session => String(session.bookingId) !== bookingId
        );

        localStorage.setItem(
          CANCELLED_STORAGE_KEY,
          JSON.stringify(updatedSessions)
        );

        this.cancelledSessions = updatedSessions;
        this.closeDeleteModal();

        window.dispatchEvent(new Event("tutor-cancellations-updated"));
      } catch (error) {
        console.error("Failed to delete cancelled record:", error);
        alert("The record could not be deleted from this PC.");
      }
    },

    formatDate(date) {
      if (!date) return "";
      return new Date(date).toLocaleDateString();
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
  grid-template-columns: 1fr 1.2fr 1.2fr 0.8fr 1fr 1.5fr;
  gap: 10px;
  min-width: 750px;
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

.delete-button,
.confirm-button {
  background-color: #c0392b;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 9px 12px;
  cursor: pointer;
  font-size: 12px;
}

.delete-button:hover,
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
</style>
