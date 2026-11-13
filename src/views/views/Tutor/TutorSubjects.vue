<template>
  <main class="subjects-content">

    <section class="subjects-header">
      <div>
        <p class="header-label">TUTOR MANAGEMENT</p>
        <h1>Subjects Taught</h1>
        <p class="header-description">
          Manage the subjects you currently teach.
        </p>
      </div>

      <div class="header-actions">
        <button
          class="refresh-button"
          :disabled="refreshing"
          @click="refreshSubjects"
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
          + Add Subject Taught
        </button>
      </div>
    </section>


    <section class="subject-summary">
      <div class="summary-card">
        <p class="summary-label">TOTAL SUBJECTS</p>
        <h2>{{ subjects.length }}</h2>
        <p>Subjects currently taught</p>
      </div>
    </section>


    <section class="subjects-card">

      <div class="card-header">
        <div>
          <h2>Your Subjects</h2>
          <p>View and edit the subjects you teach</p>
        </div>
      </div>


      <div class="table-header">
        <span>Subject Code</span>
        <span>Subject Name</span>
        <span>Years Taught</span>
        <span>Action</span>
      </div>


      <div
        v-if="loading"
        class="status-state"
      >
        Loading subjects...
      </div>


      <div
        v-for="subject in subjects"
        :key="subject.subjectCode"
        class="subject-row"
      >
        <strong>{{ subject.subjectCode }}</strong>

        <span>{{ subject.subjectName }}</span>

        <span>
          {{ subject.yearsTaught }}
          {{ subject.yearsTaught === 1 ? 'year' : 'years' }}
        </span>

        <button
          class="edit-button"
          @click="openEditForm(subject)"
        >
          Edit
        </button>
      </div>


      <div
        v-if="!loading && subjects.length === 0"
        class="empty-state"
      >
        <div class="empty-circle">+</div>

        <h3>No subjects added yet</h3>

        <p>
          Select a subject you teach and add your teaching experience.
        </p>

        <button
          class="add-button"
          @click="openAddForm"
        >
          Add Subject Taught
        </button>
      </div>


      <p
        v-if="loadError"
        class="load-error"
      >
        {{ loadError }}
      </p>

    </section>


    <div
      v-if="showForm"
      class="form-overlay"
    >

      <div class="subject-form">

        <div class="form-header">
          <div>
            <h2>
              {{ editing ? 'Edit Subject Taught' : 'Add Subject Taught' }}
            </h2>

            <p>
              {{
                editing
                  ? 'Update the number of years you have taught this subject.'
                  : 'Select a subject you teach and enter your teaching experience.'
              }}
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
          <label>Tutor ID</label>

          <input
            :value="tutorId"
            type="text"
            disabled
          >
        </div>


        <div class="form-group">
          <label>Subject</label>

          <select
            v-model="form.subjectCode"
            :disabled="editing"
          >
            <option value="">
              Select a subject
            </option>

            <option
              v-for="subject in selectableSubjects"
              :key="subject.subjectCode"
              :value="subject.subjectCode"
            >
              {{ subject.subjectCode }} - {{ subject.subjectName }}
            </option>
          </select>
        </div>


        <div class="form-group">
          <label>Years Taught</label>

          <input
            v-model.number="form.yearsTaught"
            type="number"
            min="0"
            placeholder="Enter number of years"
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
            :disabled="saving"
            @click="saveSubject"
          >
            {{
              saving
                ? 'Saving...'
                : editing
                  ? 'Save Changes'
                  : 'Add Subject'
            }}
          </button>

        </div>

      </div>

    </div>

  </main>
</template>


<script>
import { getAllSubjects } from '@/services/subjectService'
import { getSession } from '@/services/authService'
import { request } from '@/services/http'

export default {
  name: "TutorSubjects",

  data() {
    return {
      tutorId: "",

      subjects: [],
      availableSubjects: [],

      loading: false,
      saving: false,
      refreshing: false,

      showForm: false,
      editing: false,

      errorMessage: "",
      loadError: "",

      form: {
        subjectCode: "",
        yearsTaught: null
      }
    }
  },


  computed: {

    selectableSubjects() {
      if (this.editing) {
        return this.availableSubjects
      }

      const existingSubjectCodes =
        this.subjects.map(subject => subject.subjectCode)

      return this.availableSubjects.filter(
        subject =>
          !existingSubjectCodes.includes(subject.subjectCode)
      )
    }

  },


  async mounted() {
    const session = getSession()

    if (!session || session.role !== "tutor") {
      this.loadError =
        "Tutor information could not be found."
      return
    }

    this.tutorId = session.id

    await this.loadData()
  },


  methods: {

    async refreshSubjects() {
      this.refreshing = true

      try {
        await this.loadData()
      } finally {
        this.refreshing = false
      }
    },

    async loadData() {
      this.loading = true
      this.loadError = ""

      try {
        await this.loadSubjects()
        await this.loadTutorSubjects()
      } catch (error) {
        console.error(error)

        this.loadError =
          "Unable to load subject information."
      } finally {
        this.loading = false
      }
    },


    async loadSubjects() {
      this.availableSubjects =
        await getAllSubjects()
    },


    async loadTutorSubjects() {
      const tutorSubjects = await request(
        "/tutoring/tutorsubject/getAll",
        { label: "Tutor subject" }
      )


      const tutorRecords =
        tutorSubjects.filter(
          record =>
            record.tutorId === this.tutorId
        )


      this.subjects = tutorRecords.map(record => {

        const subjectDetails =
          this.availableSubjects.find(
            subject =>
              subject.subjectCode === record.subjectCode
          )

        return {
          subjectCode: record.subjectCode,

          subjectName:
            subjectDetails
              ? subjectDetails.subjectName
              : record.subjectCode,

          yearsTaught: record.yearsTaught
        }
      })
    },


    openAddForm() {
      this.editing = false
      this.errorMessage = ""

      this.form = {
        subjectCode: "",
        yearsTaught: null
      }

      this.showForm = true
    },


    openEditForm(subject) {
      this.editing = true
      this.errorMessage = ""

      this.form = {
        subjectCode: subject.subjectCode,
        yearsTaught: subject.yearsTaught
      }

      this.showForm = true
    },


    closeForm() {
      this.showForm = false
      this.errorMessage = ""
      this.saving = false
    },


    async saveSubject() {

      this.errorMessage = ""


      if (!this.tutorId) {
        this.errorMessage =
          "Tutor information could not be found."
        return
      }


      if (!this.form.subjectCode) {
        this.errorMessage =
          "Please select a subject."
        return
      }


      if (
        this.form.yearsTaught === null ||
        this.form.yearsTaught === ""
      ) {
        this.errorMessage =
          "Please enter the number of years taught."
        return
      }


      if (this.form.yearsTaught < 0) {
        this.errorMessage =
          "Years taught cannot be negative."
        return
      }


      const tutorSubject = {
        subjectCode: this.form.subjectCode,
        tutorId: this.tutorId,
        yearsTaught: Number(this.form.yearsTaught)
      }


      this.saving = true

      try {

        const url =
          this.editing
            ? "/tutoring/tutorsubject/update"
            : "/tutoring/tutorsubject/create"


        const method =
          this.editing
            ? "PUT"
            : "POST"


        await request(url, {
          method: method,

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify(tutorSubject),

          label: "Tutor subject"
        })


        await this.loadTutorSubjects()

        this.closeForm()

      } catch (error) {

        console.error(error)

        this.errorMessage =
          error.message || "Unable to save subject."

      } finally {

        this.saving = false

      }
    }

  }
}
</script>


<style scoped>

.subjects-content {
  min-height: 100vh;
  padding: 30px;
  box-sizing: border-box;
  background-color: #f7f8fa;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  color: #2c3e50;
  text-align: left;
}

.subjects-header {
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

.subjects-header h1 {
  margin: 0;
  font-size: 30px;
}

.header-description {
  color: #d7dde3;
  font-size: 14px;
  margin: 7px 0 0;
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

.subject-summary {
  display: grid;
  grid-template-columns: 1fr;
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
  color: #8a94a3;
  font-size: 13px;
  margin: 0;
}

.subjects-card {
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
.subject-row {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr 0.7fr;
  align-items: center;
}

.table-header {
  padding: 14px 5px;
  color: #8a94a3;
  font-size: 10px;
  font-weight: bold;
}

.subject-row {
  padding: 15px 5px;
  border-top: 1px solid #e5e7eb;
  font-size: 13px;
}

.status-state {
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid #e5e7eb;
  color: #8a94a3;
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

.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.edit-button {
  background-color: #ffffff;
  color: #f28c28;
  border: 1px solid #f28c28;
  border-radius: 6px;
  padding: 7px 12px;
  font-family: inherit;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
}

.edit-button:hover {
  background-color: #fff7ef;
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

.subject-form {
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
  color: #8a94a3;
  font-size: 12px;
  margin: 4px 0 0;
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

.form-group input:disabled,
.form-group select:disabled {
  background-color: #f7f8fa;
}

.error-message,
.load-error {
  color: #d9534f;
  font-size: 12px;
}

.error-message {
  margin: 0 0 15px;
}

.load-error {
  margin: 15px 5px 0;
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

  .subjects-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  .header-actions {
    flex-wrap: wrap;
  }

  .summary-card {
    width: auto;
  }

  .subject-form {
    width: 90%;
  }

}

</style>