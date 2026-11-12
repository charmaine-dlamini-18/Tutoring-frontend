<template>
  <main class="availability-content">

    <section class="availability-header">
      <div>
        <p class="header-label">TUTOR MANAGEMENT</p>
        <h1>Availability</h1>
        <p class="header-description">
          Set the dates and times you're available for tutoring sessions.
        </p>
      </div>

      <button
        class="header-button"
        @click="openAddForm"
      >
        + Add Availability
      </button>
    </section>

    <section class="availability-summary">

      <div class="summary-card">
        <p class="summary-label">AVAILABLE SLOTS</p>
        <h2>{{ availability.length }}</h2>
        <p>Time slots currently available</p>
      </div>

    </section>

    <section class="availability-card">

      <div class="card-header">
        <div>
          <h2>Your Availability</h2>
          <p>Manage the dates and times you're available</p>
        </div>
      </div>


      <div class="table-header">
        <span>Date</span>
        <span>Day</span>
        <span>Start Time</span>
        <span>End Time</span>
        <span>Actions</span>
      </div>


      <div
        v-for="(slot, index) in availability"
        :key="slot.id || `${slot.date || slot.day}-${slot.startTime}-${index}`"
        class="availability-row"
      >
        <strong>{{ formatSlotDate(slot) }}</strong>

        <span>{{ slotDayName(slot) }}</span>

        <span>{{ slot.startTime }}</span>

        <span>{{ slot.endTime }}</span>

        <div class="row-actions">

          <button
            class="edit-button"
            @click="openEditForm(index)"
          >
            Edit
          </button>

          <button
            class="remove-button"
            @click="removeAvailability(index)"
          >
            Remove
          </button>

        </div>

      </div>
      <div
        v-if="availability.length === 0"
        class="empty-state"
      >

        <div class="empty-circle">
          +
        </div>

        <h3>No availability set</h3>

        <p>
          Add the dates and times you're available to tutor.
        </p>

        <button
          class="add-button"
          @click="openAddForm"
        >
          Set Availability
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
            <h2>
              {{ editing ? 'Edit Availability' : 'Add Availability' }}
            </h2>

            <p>
              Choose the date and times you're available.
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

          <label>Start Time</label>

          <input
            v-model="form.startTime"
            type="time"
          >

        </div>

        <div class="form-group">

          <label>End Time</label>

          <input
            v-model="form.endTime"
            type="time"
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
            @click="saveAvailability"
          >
            {{ editing ? 'Save Changes' : 'Add Availability' }}
          </button>

        </div>

      </div>

    </div>

  </main>
</template>



<script>
import { getSession } from '@/services/authService'

export default {
  name: "TutorAvailability",

  data() {
    return {
      session: getSession(),
      availability: [],
      showForm: false,
      editing: false,
      editingIndex: -1,
      errorMessage: "",
      form: {
        date: "",
        startTime: "",
        endTime: ""
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
        ? `tutorAvailability_${this.tutorId}`
        : ""
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
        return
      }

      try {
        this.availability = JSON.parse(
          localStorage.getItem(this.storageKey) || "[]"
        )
      } catch {
        this.availability = []
      }
    },

    saveToStorage() {
      if (!this.storageKey) {
        this.errorMessage =
          "Could not identify the logged-in tutor."
        return false
      }

      localStorage.setItem(
        this.storageKey,
        JSON.stringify(this.availability)
      )

      window.dispatchEvent(
        new Event("tutor-availability-updated")
      )

      return true
    },

    openAddForm() {
      this.editing = false
      this.editingIndex = -1
      this.errorMessage = ""
      this.form = {
        date: "",
        startTime: "",
        endTime: ""
      }
      this.showForm = true
    },

    openEditForm(index) {
      const slot = this.availability[index]

      if (!slot) return

      this.editing = true
      this.editingIndex = index
      this.errorMessage = ""
      this.form = {
        date: slot.date || "",
        startTime: slot.startTime,
        endTime: slot.endTime
      }
      this.showForm = true
    },

    closeForm() {
      this.showForm = false
      this.editingIndex = -1
      this.errorMessage = ""
    },

    saveAvailability() {
      if (
        !this.form.date ||
        !this.form.startTime ||
        !this.form.endTime
      ) {
        this.errorMessage = "Please complete all fields."
        return
      }

      if (this.form.startTime >= this.form.endTime) {
        this.errorMessage =
          "End time must be later than start time."
        return
      }

      if (this.form.date < this.todayDate) {
        this.errorMessage =
          "Please choose today or a future date."
        return
      }

      const duplicateIndex = this.availability.findIndex(
        (slot, index) =>
          index !== this.editingIndex &&
          slot.date === this.form.date &&
          slot.startTime === this.form.startTime
      )

      if (duplicateIndex !== -1) {
        this.errorMessage =
          "Availability for this date and start time already exists."
        return
      }

      const slot = {
        id: `slot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        date: this.form.date,
        startTime: this.form.startTime,
        endTime: this.form.endTime
      }

      if (this.editing && this.editingIndex !== -1) {
        this.availability.splice(this.editingIndex, 1, slot)
      } else {
        this.availability.push(slot)
      }

      this.availability.sort((a, b) => {
        if (a.date !== b.date) return a.date < b.date ? -1 : 1
        return a.startTime < b.startTime ? -1 : 1
      })

      if (this.saveToStorage()) {
        this.closeForm()
      }
    },

    removeAvailability(index) {
      this.availability.splice(index, 1)
      this.saveToStorage()
    },

    parseDate(value) {
      const [year, month, day] = String(value).split("-").map(Number)
      return new Date(year, month - 1, day)
    },

    formatSlotDate(slot) {
      if (!slot.date) {
        return `Every ${slot.day}`
      }

      return this.parseDate(slot.date).toLocaleDateString("en-ZA", {
        year: "numeric",
        month: "short",
        day: "numeric"
      })
    },

    slotDayName(slot) {
      if (!slot.date) {
        return slot.day || "-"
      }

      return this.parseDate(slot.date).toLocaleDateString("en-ZA", {
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
}

.availability-summary {
  margin-bottom: 22px;
}

.summary-card {
  width: 240px;
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
    1.2fr
    1fr
    1fr
    1fr
    1.3fr;
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
}

.remove-button {
  background-color: #ffffff;
  color: #8a94a3;
  border: 1px solid #d9dee5;
  border-radius: 6px;
  padding: 7px 11px;
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
}

.edit-button:hover {
  background-color: #fff7ef;
}

.remove-button:hover {
  background-color: #f7f8fa;
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

.form-group input,
.form-group select {
  border: 1px solid #d9dee5;
  border-radius: 7px;
  padding: 11px;
  font-family: inherit;
  color: #2c3e50;
  outline: none;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #f28c28;
}

.form-group select:disabled {
  background-color: #f7f8fa;
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

@media (max-width: 700px) {

  .availability-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  .summary-card {
    width: auto;
  }

  .availability-form {
    width: 90%;
  }

}

</style>