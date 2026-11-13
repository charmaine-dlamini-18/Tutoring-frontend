<template>
  <main class="availability-content">

    <section class="availability-header">
      <div>
        <p class="header-label">TUTOR MANAGEMENT</p>
        <h1>Availability</h1>
        <p class="header-description">
          You are available every weekday (Monday to Friday) from 08:30 to 18:00.
          Mark a specific day as unavailable if you cannot tutor.
        </p>
      </div>

      <div class="header-actions">
        <button
          class="refresh-button"
          :disabled="refreshing"
          @click="refreshAvailability"
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

        <button
          class="header-button"
          @click="openAddForm"
        >
          + Mark Day Unavailable
        </button>
      </div>
    </section>

    <section class="availability-summary">
      <div class="summary-card">
        <p class="summary-label">STANDARD DAYS</p>
        <h2>{{ standardDays.length }}</h2>
        <p>Monday to Friday</p>
      </div>

      <div class="summary-card">
        <p class="summary-label">STANDARD HOURS</p>
        <h2 class="hours-value">{{ standardStart }} – {{ standardEnd }}</h2>
        <p>Default availability each weekday</p>
      </div>

      <div class="summary-card">
        <p class="summary-label">UNAVAILABLE DAYS</p>
        <h2>{{ unavailableDates.length }}</h2>
        <p>Days marked as not available</p>
      </div>
    </section>

    <section class="availability-card">
      <div class="card-header">
        <div>
          <h2>Standard Weekly Schedule</h2>
          <p>Your default availability for every weekday</p>
        </div>
      </div>

      <div class="table-header">
        <span>Day</span>
        <span>Start Time</span>
        <span>End Time</span>
        <span>Status</span>
      </div>

      <div
        v-for="day in standardDays"
        :key="day"
        class="availability-row"
      >
        <strong>{{ day }}</strong>
        <span>{{ standardStart }}</span>
        <span>{{ standardEnd }}</span>
        <span class="status-pill available">Available</span>
      </div>
    </section>

    <section class="availability-card">
      <div class="card-header">
        <div>
          <h2>Unavailable Dates</h2>
          <p>Days you have marked as not available</p>
        </div>
      </div>

      <div class="table-header">
        <span>Date</span>
        <span>Day</span>
        <span>Reason</span>
        <span>Action</span>
      </div>

      <div
        v-for="entry in unavailableDates"
        :key="entry.date"
        class="availability-row"
      >
        <strong>{{ formatDate(entry.date) }}</strong>
        <span>{{ dayName(entry.date) }}</span>
        <span>{{ entry.reason || '—' }}</span>
        <div class="row-actions">
          <button
            class="edit-button"
            @click="makeAvailable(entry.date)"
          >
            Make Available
          </button>
        </div>
      </div>

      <div
        v-if="unavailableDates.length === 0"
        class="empty-state"
      >
        <div class="empty-circle">✓</div>
        <h3>No unavailable days</h3>
        <p>
          You are available every weekday. Mark a day if you cannot tutor.
        </p>
        <button
          class="add-button"
          @click="openAddForm"
        >
          Mark Day Unavailable
        </button>
      </div>
    </section>

    <div
      v-if="showForm"
      class="form-overlay"
    >
      <div class="availability-form">
        <div class="form-header">
          <div>
            <h2>Mark Day Unavailable</h2>
            <p>
              Choose the day you are not available. All other weekdays remain
              08:30 – 18:00.
            </p>
          </div>

          <button
            class="close-button"
            @click="closeForm"
          >
            ×
          </button>
        </div>

        <div class="form-group">
          <label>Date</label>
          <input
            v-model="form.date"
            type="date"
            :min="todayDate"
          >
        </div>

        <div class="form-group">
          <label>Reason (optional)</label>
          <input
            v-model="form.reason"
            type="text"
            maxlength="80"
            placeholder="e.g. Personal appointment"
          >
        </div>

        <p
          v-if="errorMessage"
          class="error-message"
        >
          {{ errorMessage }}
        </p>

        <div class="form-actions">
          <button
            class="cancel-button"
            @click="closeForm"
          >
            Cancel
          </button>

          <button
            class="save-button"
            @click="markUnavailable"
          >
            Mark Unavailable
          </button>
        </div>
      </div>
    </div>

  </main>
</template>


<script>
import { getSession } from '@/services/authService'

const STANDARD_START = '08:30'
const STANDARD_END = '18:00'
const STANDARD_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

export default {
  name: "TutorAvailability",

  data() {
    return {
      session: getSession(),
      unavailableDates: [],
      refreshing: false,
      showForm: false,
      errorMessage: "",
      form: {
        date: "",
        reason: ""
      }
    }
  },

  computed: {
    tutorId() {
      return this.session?.tutorId ||
        this.session?.id ||
        this.session?.user?.tutorId ||
        ""
    },

    storageKey() {
      return this.tutorId
        ? `tutorUnavailableDates_${this.tutorId}`
        : ""
    },

    standardDays() {
      return STANDARD_DAYS
    },

    standardStart() {
      return STANDARD_START
    },

    standardEnd() {
      return STANDARD_END
    },

    todayDate() {
      const now = new Date()
      const month = String(now.getMonth() + 1).padStart(2, "0")
      const day = String(now.getDate()).padStart(2, "0")
      return `${now.getFullYear()}-${month}-${day}`
    }
  },

  mounted() {
    this.loadAvailability()
  },

  methods: {
    loadAvailability() {
      if (!this.storageKey) {
        this.errorMessage =
          "Could not identify the logged-in tutor."
        this.unavailableDates = []
        return
      }

      try {
        const saved = JSON.parse(
          localStorage.getItem(this.storageKey) || "[]"
        )

        this.unavailableDates = Array.isArray(saved)
          ? saved.filter(entry => entry && entry.date)
          : []
      } catch {
        this.unavailableDates = []
      }

      this.unavailableDates.sort((a, b) =>
        a.date < b.date ? -1 : a.date > b.date ? 1 : 0
      )
    },

    async refreshAvailability() {
      this.refreshing = true
      this.errorMessage = ""

      await new Promise(resolve => setTimeout(resolve, 250))

      this.loadAvailability()
      this.refreshing = false
    },

    saveToStorage() {
      if (!this.storageKey) {
        this.errorMessage =
          "Could not identify the logged-in tutor."
        return false
      }

      localStorage.setItem(
        this.storageKey,
        JSON.stringify(this.unavailableDates)
      )

      window.dispatchEvent(
        new Event("tutor-availability-updated")
      )

      return true
    },

    openAddForm() {
      this.errorMessage = ""
      this.form = {
        date: "",
        reason: ""
      }
      this.showForm = true
    },

    closeForm() {
      this.showForm = false
      this.errorMessage = ""
    },

    markUnavailable() {
      if (!this.form.date) {
        this.errorMessage = "Please choose a date."
        return
      }

      if (this.form.date < this.todayDate) {
        this.errorMessage =
          "Please choose today or a future date."
        return
      }

      const exists = this.unavailableDates.some(
        entry => entry.date === this.form.date
      )

      if (exists) {
        this.errorMessage =
          "This day is already marked as unavailable."
        return
      }

      this.unavailableDates.push({
        date: this.form.date,
        reason: this.form.reason.trim()
      })

      this.unavailableDates.sort((a, b) =>
        a.date < b.date ? -1 : a.date > b.date ? 1 : 0
      )

      if (this.saveToStorage()) {
        this.closeForm()
      }
    },

    makeAvailable(date) {
      this.unavailableDates = this.unavailableDates.filter(
        entry => entry.date !== date
      )
      this.saveToStorage()
    },

    parseDate(value) {
      const [year, month, day] = String(value).split("-").map(Number)
      return new Date(year, month - 1, day)
    },

    formatDate(value) {
      return this.parseDate(value).toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "short",
        day: "numeric"
      })
    },

    dayName(value) {
      return this.parseDate(value).toLocaleDateString("en-ZA", {
        weekday: "long"
      })
    }
  }
}
</script>


<style scoped>

.availability-content {
  min-height: 100vh;
  padding: 30px;
  box-sizing: border-box;
  background-color: #f7f8fa;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  color: #2c3e50;
  text-align: left;
}

.availability-header {
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

.availability-header h1 {
  margin: 0;
  font-size: 30px;
}

.header-description {
  color: #d7dde3;
  font-size: 14px;
  margin: 7px 0 0;
  max-width: 560px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.header-button {
  background-color: #f28c28;
  color: #ffffff;
  border: none;
  border-radius: 7px;
  padding: 11px 17px;
  font-family: inherit;
  font-weight: bold;
  cursor: pointer;
  white-space: nowrap;
}

.header-button:hover {
  background-color: #d9760f;
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

.availability-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
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
  margin: 14px 0 2px;
  font-size: 32px;
}

.summary-card .hours-value {
  font-size: 24px;
}

.summary-card p {
  margin: 0;
  color: #8a94a3;
  font-size: 13px;
}

.availability-card {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 22px;
}

.availability-card + .availability-card {
  margin-top: 22px;
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
  margin: 4px 0 0;
  color: #8a94a3;
  font-size: 12px;
}

.table-header,
.availability-row {
  display: grid;
  grid-template-columns:
    1.3fr
    1fr
    1.5fr
    1.4fr;
  align-items: center;
}

.table-header {
  padding: 14px 5px;
  color: #8a94a3;
  font-size: 10px;
  font-weight: bold;
}

.availability-row {
  padding: 15px 5px;
  border-top: 1px solid #e5e7eb;
  font-size: 13px;
}

.status-pill {
  display: inline-block;
  width: fit-content;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: bold;
}

.status-pill.available {
  color: #1e7a58;
  background-color: #edfaf4;
  border: 1px solid #bfe7d5;
}

.row-actions {
  display: flex;
  gap: 8px;
}

.edit-button {
  background-color: #ffffff;
  color: #f28c28;
  border: 1px solid #f28c28;
  border-radius: 6px;
  padding: 7px 11px;
  font-family: inherit;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  white-space: nowrap;
}

.edit-button:hover {
  background-color: #fff7ef;
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
  margin: 0 0 15px;
  color: #8a94a3;
  font-size: 12px;
}

.add-button,
.save-button {
  background-color: #2c3e50;
  color: #ffffff;
  border: none;
  border-radius: 7px;
  padding: 10px 16px;
  font-family: inherit;
  font-weight: bold;
  cursor: pointer;
}

.add-button:hover,
.save-button:hover {
  background-color: #f28c28;
}

.form-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(44, 62, 80, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.availability-form {
  width: 430px;
  background-color: #ffffff;
  border-radius: 12px;
  padding: 25px;
  box-sizing: border-box;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 15px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 20px;
}

.form-header h2 {
  margin: 0;
  font-size: 19px;
}

.form-header p {
  margin: 4px 0 0;
  color: #8a94a3;
  font-size: 12px;
  max-width: 320px;
}

.close-button {
  border: none;
  background: none;
  color: #8a94a3;
  font-size: 24px;
  cursor: pointer;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 17px;
}

.form-group label {
  font-size: 12px;
  font-weight: bold;
}

.form-group input {
  border: 1px solid #d9dee5;
  border-radius: 7px;
  padding: 11px;
  font-family: inherit;
  color: #2c3e50;
  outline: none;
}

.form-group input:focus {
  border-color: #f28c28;
}

.error-message {
  color: #d9534f;
  font-size: 12px;
  margin: 0 0 15px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 10px;
}

.cancel-button {
  background-color: #ffffff;
  color: #2c3e50;
  border: 1px solid #d9dee5;
  border-radius: 7px;
  padding: 10px 16px;
  font-family: inherit;
  cursor: pointer;
}

@media (max-width: 900px) {
  .availability-summary {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .availability-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  .header-actions {
    flex-wrap: wrap;
  }

  .availability-form {
    width: 90%;
  }
}

</style>
