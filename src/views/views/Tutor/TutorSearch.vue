<template>
  <main class="search-content">

    <section class="search-header">
      <div>
        <p class="header-label">SUBJECT SEARCH</p>
        <h1>Search Subjects</h1>
        <p class="header-description">
          Search subjects by name or code to add them to your subjects taught.
        </p>
      </div>
    </section>


    <section class="current-tutor-card">
      <div class="current-tutor-heading">
        <div>
          <h2>{{ currentTutorName }}</h2>
          <p>Subjects you currently teach</p>
        </div>
      </div>

      <div v-if="currentTutorSubjects.length > 0" class="current-subject-list">
        <div
          v-for="subject in currentTutorSubjects"
          :key="subject.subjectCode"
          class="current-subject"
        >
          <strong>{{ subject.subjectCode }} - {{ subject.subjectName }}</strong>
          <span>{{ subject.yearsTaught }} yr{{ subject.yearsTaught === 1 ? '' : 's' }}</span>
        </div>
      </div>

      <p v-else class="no-current-subjects">
        You have not added any subjects yet. Search for a subject below to get started.
      </p>
    </section>


    <section class="search-card">
      <div class="card-header">
        <div>
          <h2>Search Subjects</h2>
          <p>Search for a subject by name or code.</p>
        </div>
      </div>

      <div class="search-bar">
        <input v-model="filters.query" placeholder="Search subjects..." />
        <button
          v-if="filters.query"
          class="clear-btn"
          @click="clearSearch"
        >
          Clear
        </button>
      </div>
    </section>


    <section v-if="hasSearched" class="results-card">
      <div class="results-heading">
        <h3>Results</h3>
        <p class="found">{{ matchingSubjects.length }} subject{{ matchingSubjects.length === 1 ? '' : 's' }} found</p>
      </div>

      <div
        v-if="loading"
        class="status-state"
      >
        Loading...
      </div>

      <div v-else-if="matchingSubjects.length > 0" class="result-list">
        <div
          v-for="subject in matchingSubjects"
          :key="subject.subjectCode"
          class="result-card"
        >
          <div class="result-info">
            <h4>{{ subject.subjectName }}</h4>
            <p>{{ subject.subjectCode }}</p>
          </div>

          <button
            class="add-btn"
            :class="{ added: isTaught(subject.subjectCode) }"
            :disabled="isTaught(subject.subjectCode)"
            @click="openAddForm(subject)"
          >
            {{ isTaught(subject.subjectCode) ? 'Added' : '+ Add' }}
          </button>
        </div>
      </div>

      <div v-else class="empty-state">
        <p>No subjects found</p>
        <span>Try a different subject name or code.</span>
      </div>
    </section>

    <div v-if="showForm" class="form-overlay">
      <div class="subject-form">
        <div class="form-header">
          <div>
            <h2>Add Subject Taught</h2>
            <p>{{ addingSubject.subjectCode }} - {{ addingSubject.subjectName }}</p>
          </div>

          <button class="close-btn" @click="closeForm">×</button>
        </div>

        <div class="form-group">
          <label>Years Taught</label>
          <input
            v-model.number="yearsTaught"
            type="number"
            min="0"
            placeholder="Enter number of years"
          />
        </div>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <div class="form-actions">
          <button class="cancel-button" @click="closeForm">Cancel</button>
          <button
            class="save-button"
            :disabled="saving"
            @click="confirmAdd"
          >
            {{ saving ? 'Adding...' : 'Add Subject' }}
          </button>
        </div>
      </div>
    </div>

  </main>
</template>

<script>
import { getAllTutors } from '@/services/tutorService'
import { getAllSubjects } from '@/services/subjectService'
import { getSession } from '@/services/authService'
import { request } from '@/services/http'

export default {
  name: "TutorSearch",

  data() {
    return {
      filters: { query: "" },
      subjectList: [],
      subjects: [],
      currentTutorName: "",
      currentTutorSubjects: [],
      tutorId: "",
      taughtSubjects: [],
      loading: false,
      loadError: "",
      showForm: false,
      addingSubject: null,
      yearsTaught: null,
      errorMessage: "",
      saving: false
    }
  },

  computed: {
    query() {
      return (this.filters.query || "").trim().toLowerCase()
    },

    matchingSubjects() {
      if (!this.query) {
        return []
      }

      return this.subjectList.filter(s => {
        const code = (s.subjectCode || "").toLowerCase()
        const name = (s.subjectName || "").toLowerCase()
        return code.startsWith(this.query) || name.startsWith(this.query)
      })
    },

    hasSearched() {
      return this.query.length > 0
    }
  },

  async created() {
    const session = getSession()
    if (session && session.role === 'tutor') {
      this.tutorId = session.id
    }
    await this.loadData()
  },

  methods: {
    clearSearch() {
      this.filters.query = ""
    },

    isTaught(subjectCode) {
      return this.taughtSubjects.includes(subjectCode)
    },

    openAddForm(subject) {
      this.addingSubject = subject
      this.yearsTaught = null
      this.errorMessage = ""
      this.saving = false
      this.showForm = true
    },

    closeForm() {
      this.showForm = false
      this.addingSubject = null
      this.errorMessage = ""
      this.saving = false
    },

    async confirmAdd() {
      if (!this.tutorId || !this.addingSubject) {
        return
      }

      if (this.yearsTaught === null || this.yearsTaught === "" || this.yearsTaught < 0) {
        this.errorMessage = "Please enter a valid number of years taught."
        return
      }

      const tutorSubject = {
        tutorId: this.tutorId,
        subjectCode: this.addingSubject.subjectCode,
        yearsTaught: Number(this.yearsTaught)
      }

      this.saving = true
      this.errorMessage = ""

      try {
        await request('/tutoring/tutorsubject/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tutorSubject),
          label: 'Tutor subject'
        })

        this.taughtSubjects.push(this.addingSubject.subjectCode)
        this.currentTutorSubjects.push({
          subjectCode: this.addingSubject.subjectCode,
          subjectName: this.addingSubject.subjectName,
          yearsTaught: Number(this.yearsTaught)
        })
        this.closeForm()
      } catch (error) {
        console.error(error)
        this.errorMessage = error.message || "Unable to add subject. Please try again."
      } finally {
        this.saving = false
      }
    },

    async loadData() {
      this.loading = true
      this.loadError = ""

      try {
        const [tutorsRes, subjectsRes, tutorSubjectsRes] = await Promise.all([
          getAllTutors(),
          getAllSubjects(),
          request('/tutoring/tutorsubject/getAll', { label: 'Tutor subject' })
        ])

        const subjects = Array.isArray(subjectsRes) ? subjectsRes : []
        this.subjectList = subjects
        this.subjects = subjects.map(s => s.subjectCode).filter(Boolean)

        const allTutors = Array.isArray(tutorsRes) ? tutorsRes : []
        const tutorSubjects = Array.isArray(tutorSubjectsRes) ? tutorSubjectsRes : []

        if (this.tutorId) {
          const tutor = allTutors.find(t => t.tutorId === this.tutorId)

          this.currentTutorName = tutor
            ? `${tutor.firstName || ''} ${tutor.lastName || ''}`.trim() || this.tutorId
            : this.tutorId

          const records = tutorSubjects.filter(r => r.tutorId === this.tutorId)

          this.taughtSubjects = records.map(r => r.subjectCode)

          this.currentTutorSubjects = records.map(record => {
            const subjectDetails = subjects.find(s => s.subjectCode === record.subjectCode)

            return {
              subjectCode: subjectDetails ? subjectDetails.subjectCode : record.subjectCode,
              subjectName: subjectDetails ? subjectDetails.subjectName : record.subjectCode,
              yearsTaught: Number(record.yearsTaught) || 0
            }
          })
        }
      } catch (error) {
        console.error(error)
        this.loadError = "Unable to load tutor information."
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.search-content {
  min-height: 100vh;
  padding: 30px;
  box-sizing: border-box;
  background-color: #f7f8fa;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  color: #2c3e50;
  text-align: left;
}

.search-header {
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

.search-header h1 {
  margin: 0;
  font-size: 30px;
}

.header-description {
  color: #d7dde3;
  font-size: 14px;
  margin: 7px 0 0;
}

.search-card,
.results-card {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 22px;
  margin-bottom: 22px;
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

.search-bar {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.search-bar input {
  flex: 1;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
  box-sizing: border-box;
  font-family: inherit;
  font-size: 14px;
  color: #2c3e50;
  outline: none;
}

.search-bar input:focus {
  border-color: #f28c28;
}

.clear-btn {
  padding: 12px 18px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-family: inherit;
  font-weight: bold;
  color: #2c3e50;
  white-space: nowrap;
}

.clear-btn:hover {
  background: #2c3e50;
  color: white;
}

.stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 15px;
  margin-bottom: 22px;
}

.stat-box {
  border: 1px solid #e5e7eb;
  border-top: 3px solid #f28c28;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  background: #fff;
}

.stat-num {
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
}

.stat-title {
  font-size: 10px;
  font-weight: bold;
  color: #8a94a3;
  margin-top: 5px;
}

.stat-sub {
  font-size: 11px;
  color: #94a3b8;
}

.results-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 14px;
  border-bottom: 1px solid #e5e7eb;
}

.results-heading h3 {
  margin: 0;
  font-size: 15px;
}

.found {
  font-size: 12px;
  color: #8a94a3;
}

.status-state {
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8a94a3;
  font-size: 13px;
}

.result-list {
  margin-top: 6px;
}

.result-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 14px 18px;
  margin-top: 12px;
}

.result-info h4 {
  margin: 0 0 4px;
  font-size: 14px;
}

.result-info p {
  margin: 0;
  color: #8a94a3;
  font-size: 12px;
}

.current-tutor-card {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-left: 4px solid #f28c28;
  border-radius: 10px;
  padding: 22px;
  margin-bottom: 22px;
}

.current-tutor-heading {
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.current-tutor-heading h2 {
  margin: 0;
  font-size: 17px;
}

.current-tutor-heading p {
  margin: 4px 0 0;
  color: #8a94a3;
  font-size: 12px;
}

.current-subject-list {
  margin-top: 6px;
}

.current-subject {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
}

.current-subject strong {
  color: #2c3e50;
}

.current-subject span {
  color: #8a94a3;
  white-space: nowrap;
}

.no-current-subjects {
  margin: 12px 0 0;
  color: #8a94a3;
  font-size: 12px;
}

.add-btn {
  background-color: #2c3e50;
  color: #ffffff;
  border: none;
  border-radius: 7px;
  padding: 8px 14px;
  font-family: inherit;
  font-weight: bold;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.add-btn:hover {
  background-color: #f28c28;
}

.add-btn:disabled {
  background-color: #e5e7eb;
  color: #8a94a3;
  cursor: not-allowed;
}

.add-btn.added {
  background-color: #e5e7eb;
  color: #8a94a3;
  cursor: not-allowed;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #8a94a3;
  font-size: 12px;
}

.empty-state p {
  font-weight: bold;
  color: #475569;
  margin: 0 0 5px;
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
  width: 400px;
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

.close-btn {
  border: none;
  background: none;
  color: #8a94a3;
  font-size: 24px;
  cursor: pointer;
  line-height: 1;
}

.close-btn:hover {
  color: #2c3e50;
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

.save-button:hover {
  background-color: #f28c28;
}

.save-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 700px) {
  .search-bar {
    flex-direction: column;
  }

  .stats {
    grid-template-columns: 1fr;
  }

  .subject-form {
    width: 90%;
  }
}
</style>
