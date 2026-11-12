<template>
    <main class="profile-content">

        <section class="profile-header">
            <div>
                <p class="header-label">TUTOR MANAGEMENT</p>
                <h1>Tutor Profile</h1>
                <p class="header-description">
                    View and update your tutor information.
                </p>
            </div>

            <button
            class="header-button"
            @click="openEditForm"
            >
            Edit Profile
        </button>
        </section>

        <section class="profile-grid">

            <div class="profile-card">

                <div class="profile-avatar">
                    {{ initials }}
                </div>

                <h2>
                    {{ fullName }}
                </h2>

                <p class="role">
                    Tutor
                </p>

                <div class="rate-box">
                    <span>Hourly Rate</span>

                    <strong>
                        {{ formattedHourlyRate || 'Not set' }}
                    </strong>
                </div>
            </div>

             <div class="details-card">

        <div class="card-header">
          <div>
            <h2>Personal Information</h2>
            <p>Your current tutor details</p>
          </div>
        </div>


        <div class="information-list">

          <div class="information-row">
            <span>Tutor ID</span>

            <strong>
              {{ tutor.tutorId || 'Not available' }}
            </strong>
          </div>

          <div class="information-row">
            <span>First Name</span>

            <strong>
              {{ tutor.firstName || 'Not available' }}
            </strong>
          </div>


          <div class="information-row">
            <span>Last Name</span>

            <strong>
              {{ tutor.lastName || 'Not available' }}
            </strong>
          </div>

          <div class="information-row">
            <span>Email</span>

            <strong>
              {{ tutor.email || 'Not available' }}
            </strong>
          </div>


          <div class="information-row">
            <span>Phone Number</span>

            <strong>
              {{ tutor.phoneNumber || 'Not available' }}
            </strong>
          </div>

          <div class="information-row">
            <span>Hourly Rate</span>

            <strong>
              {{ formattedHourlyRate || 'Not set' }}
            </strong>
          </div>

        </div>

      </div>

        </section>

        <section class="rate-section">

      <div>
        <h2>Hourly Rate</h2>
        <p>
          Set the amount you charge for one hour of tutoring.
        </p>
      </div>

      <button
        class="outline-button"
        @click="openRateForm"
      >
        Update Hourly Rate
      </button>

    </section>
    <div
      v-if="showEditForm"
      class="form-overlay"
    >

      <div class="profile-form">

        <div class="form-header">

          <div>
            <h2>Edit Profile</h2>
            <p>Update your tutor information.</p>
          </div>

          <button
            class="close-button"
            @click="closeEditForm"
          >
            ×
          </button>

        </div>
         <div class="form-row">

          <div class="form-group">
            <label>First Name</label>

            <input
              v-model="editForm.firstName"
              type="text"
              placeholder="Enter first name"
            >
          </div>


          <div class="form-group">
            <label>Last Name</label>

            <input
              v-model="editForm.lastName"
              type="text"
              placeholder="Enter last name"
            >
          </div>

        </div>
        <div class="form-group">
          <label>Email</label>

          <input
            v-model="editForm.email"
            type="email"
            placeholder="Enter email address"
          >
        </div>


        <div class="form-group">
          <label>Phone Number</label>

          <input
            v-model="editForm.phoneNumber"
            type="text"
            placeholder="Enter phone number"
          >
        </div>

        <p
          v-if="editError"
          class="error-message"
        >
          {{ editError }}
        </p>


        <div class="form-actions">

          <button
            class="cancel-button"
            @click="closeEditForm"
          >
            Cancel
          </button>

          <button
            class="save-button"
            @click="saveProfile"
          >
            Save Changes
          </button>


        </div>

      </div>

    </div>
    <div
      v-if="showRateForm"
      class="form-overlay"
    >

      <div class="rate-form">

        <div class="form-header">

          <div>
            <h2>Update Hourly Rate</h2>
            <p>Enter your new tutoring rate.</p>
          </div>

          <button
            class="close-button"
            @click="closeRateForm"
          >
            ×
          </button>

        </div>

        <div class="form-group">

          <label>Hourly Rate (R)</label>

          <input
            v-model.number="newHourlyRate"
            type="number"
            min="0"
            step="0.01"
            placeholder="Enter hourly rate"
          >

        </div>


        <p
          v-if="rateError"
          class="error-message"
        >
          {{ rateError }}
        </p>


        <div class="form-actions">

             <button
            class="cancel-button"
            @click="closeRateForm"
          >
            Cancel
          </button>

          <button
            class="save-button"
            @click="saveHourlyRate"
          >
            Update Rate
          </button>

        </div>

      </div>

    </div>

    </main>
</template>


<script>
import { getSession, updateSession } from '@/services/authService'
import { getTutorById, updateTutor } from '@/services/tutorService'

export default {
  name: "TutorProfile",

  data() {
    return {

      session: null,

      tutor: {
        tutorId: "",
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        hourlyRate: null
      },

      showEditForm: false,
      showRateForm: false,

      editError: "",
      rateError: "",

      editForm: {
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: ""
      },

      newHourlyRate: null
    }
  },

   computed: {

    fullName() {

      const name =
        `${this.tutor.firstName} ${this.tutor.lastName}`.trim()

      if (name) {
        return name
      }

      return this.session && this.session.name
    ? this.session.name
    : ""
    },

    initials() {
      const words = this.fullName.trim().split(" ").filter(Boolean)

      if (words.length === 0) {
    return ""
     }

      if (words.length === 1) {
        return words[0].charAt(0).toUpperCase()
      }

      return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
    },

    formattedHourlyRate() {
      const rate = Number(this.tutor.hourlyRate)

      if (this.tutor.hourlyRate === null || this.tutor.hourlyRate === "" || isNaN(rate)) {
        return ""
      }

      return `R${rate.toFixed(2)}`
    }

  },

  async created() {
    const session = getSession()

    if (!session) {
      return
    }

    this.session = session

    if (!session.id) {
      return
    }

    try {
      const tutor = await getTutorById(session.id)

      if (tutor && Object.keys(tutor).length) {
        this.tutor = { ...this.tutor, ...tutor }
      }
    } catch (error) {
      this.tutor.email = session.email || ""
    }
  },

  methods: {

    openEditForm() {

      this.editError = ""

      this.editForm = {
        firstName: this.tutor.firstName,
        lastName: this.tutor.lastName,
        email: this.tutor.email,
        phoneNumber: this.tutor.phoneNumber
      }

      this.showEditForm = true
    },


    closeEditForm() {

      this.showEditForm = false
      this.editError = ""
    },


    async saveProfile() {

      if (
        !this.editForm.firstName ||
        !this.editForm.lastName ||
        !this.editForm.email ||
        !this.editForm.phoneNumber
      ) {

        this.editError =
          "Please complete all fields."

        return
      }


      try {

        const updated = {
          ...this.tutor,
          firstName: this.editForm.firstName,
          lastName: this.editForm.lastName,
          email: this.editForm.email,
          phoneNumber: this.editForm.phoneNumber
        }

        await updateTutor(updated)

        this.tutor = { ...this.tutor, ...updated }

        if (this.session) {
          this.session = updateSession({
            name: `${updated.firstName} ${updated.lastName}`.trim()
          })
        }

        this.closeEditForm()

      } catch (error) {

        this.editError =
          "Failed to save changes. Please try again."
      }
    },


    openRateForm() {

      this.rateError = ""

      this.newHourlyRate =
        this.tutor.hourlyRate

      this.showRateForm = true
    },


    closeRateForm() {

      this.showRateForm = false
      this.rateError = ""
    },


    async saveHourlyRate() {

      if (
        this.newHourlyRate === null ||
        this.newHourlyRate === ""
      ) {

        this.rateError =
          "Please enter an hourly rate."

        return
      }


      if (this.newHourlyRate <= 0) {

        this.rateError =
          "Hourly rate must be greater than 0."

        return
      }


      try {

        const updated = {
          ...this.tutor,
          hourlyRate:
            Number(this.newHourlyRate)
        }

        await updateTutor(updated)

        this.tutor = { ...this.tutor, ...updated }

        this.closeRateForm()

      } catch (error) {

        this.rateError =
          "Failed to update the hourly rate. Please try again."
      }
    }

  }
}
</script>

<style scoped>

.profile-content {
  min-height: 100vh;
  padding: 30px;
  box-sizing: border-box;
  background-color: #f7f8fa;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  color: #2c3e50;
  text-align: left;
}

.profile-header {
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

.profile-header h1 {
  margin: 0;
  font-size: 30px;
}

.header-description {
  margin: 7px 0 0;
  color: #d7dde3;
  font-size: 14px;
}

.header-button {
  background-color: #f28c28;
  color: #ffffff;
  border: none;
  border-radius: 7px;
  padding: 11px 18px;
  font-family: inherit;
  font-weight: bold;
  cursor: pointer;
}

.profile-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
  margin-bottom: 22px;
}

.profile-card {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.profile-avatar {
  width: 85px;
  height: 85px;
  background-color: #2c3e50;
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 15px;
}

.profile-card h2 {
  margin: 0;
  font-size: 20px;
}

.role {
  margin: 5px 0 22px;
  color: #8a94a3;
  font-size: 12px;
}

.rate-box {
  width: 100%;
  padding-top: 18px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.rate-box span {
  color: #8a94a3;
}

.details-card {
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

.information-row {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 16px 5px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
}

.information-row span {
  color: #8a94a3;
}

.information-row strong {
  text-align: right;
}


.rate-section {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rate-section h2 {
  margin: 0;
  font-size: 17px;
}

.rate-section p {
  margin: 5px 0 0;
  color: #8a94a3;
  font-size: 12px;
}

.outline-button {
  background-color: #ffffff;
  color: #f28c28;
  border: 1px solid #f28c28;
  border-radius: 7px;
  padding: 10px 16px;
  font-family: inherit;
  font-weight: bold;
  cursor: pointer;
}

.outline-button:hover {
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

.profile-form,
.rate-form {
  width: 450px;
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
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

@media (max-width: 850px) {

  .profile-grid {
    grid-template-columns: 1fr;
  }

  .profile-header,
  .rate-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  .profile-form,
  .rate-form {
    width: 90%;
  }

}

</style>