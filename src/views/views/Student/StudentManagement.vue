<template>
  <div class="student-management">

    <!-- side bar on the left with the students name and menu buttons -->
    <aside class="student-navigation">

        <div class="profile-section">
            <div class="profile-image">
                {{ initials }}
            </div>

            <div class="profile-details">
                <h3>{{ displayName }}</h3>
                <p>Student</p>
            </div>
        </div>

        <!-- main menu, just the dashboard button -->
        <div class="navigation-section">
            <p class="section-title">MANAGEMENT</p>

            <button
                class="nav-item"
                :class="{ active: currentPage === 'dashboard' }"
                @click="changePage('dashboard')"
            >
                Dashboard
            </button>
        </div>

        <!-- everything about sessions sits under here -->
        <div class="navigation-section">
            <p class="section-title">SESSIONS</p>

            <button
                class="nav-item"
                :class="{ active: currentPage === 'bookings' }"
                @click="changePage('bookings')"
            >
                My Bookings
            </button>

            <button
                class="nav-item"
                :class="{ active: currentPage === 'book' }"
                @click="changePage('book')"
            >
                Book Session
            </button>

            <button
                class="nav-item"
                :class="{ active: isDashboardPanel('history') }"
                @click="changePage('history')"
            >
                Booking History
            </button>
        </div>

        <!-- payments, tutors and profile stuff -->
        <div class="navigation-section">
            <p class="section-title">STUDENT</p>

            <button
                class="nav-item"
                :class="{ active: isDashboardPanel('tutors') }"
                @click="changePage('tutors')"
            >
                Find Tutors
            </button>

            <button
                class="nav-item"
                :class="{ active: isDashboardPanel('payments') }"
                @click="changePage('payments')"
            >
                Payments
            </button>

            <button
                class="nav-item"
                :class="{ active: isDashboardPanel('profile') }"
                @click="changePage('profile')"
            >
                Profile
            </button>

            <button
                class="nav-item logout-item"
                @click="doLogout"
            >
                Logout
            </button>
        </div>

    </aside>

    <!-- all the page content on the right of the side bar -->
    <div class="page-content">

      <!-- little message bar that pops up after you do something -->
      <transition name="fade">
        <p v-if="error" class="banner error-banner">{{ error }}</p>
        <p v-else-if="success" class="banner success-banner">{{ success }}</p>
      </transition>

      <!-- the main dashboard, sessions show here and everything else hides behind the buttons -->
      <StudentDashboard
        v-if="currentPage === 'dashboard'"
        :me="me"
        :tutors="tutors"
        :subjects="subjects"
        :initialPanel="dashboardPanel"
        @change-page="changePage"
        @refresh="loadAll"
        @notify="handleNotify"
        @book-with="bookWith"
        @panel-change="onPanelChange"
      />

      <!-- my bookings page, shows the upcoming and past tables -->
      <StudentBookings
        v-else-if="currentPage === 'bookings'"
        mode="list"
        :me="me"
        :tutors="tutors"
        :subjects="subjects"
        :tutorSubjects="tutorSubjects"
        @refresh="loadAll"
        @notify="handleNotify"
        @change-page="changePage"
      />

      <!-- book session page, same file as bookings just in form mode -->
      <StudentBookings
        v-else-if="currentPage === 'book'"
        mode="form"
        :tutors="tutors"
        :subjects="subjects"
        :tutorSubjects="tutorSubjects"
        :selectedTutorId="selectedTutorId"
        @refresh="loadAll"
        @notify="handleNotify"
        @change-page="changePage"
        @open-payment="onOpenPayment"
      />

      <!-- payments page -->
      <Payment
        v-else-if="currentPage === 'payments'"
        :me="me"
        :tutors="tutors"
        :subjects="subjects"
        :initialBookingId="pendingPaymentId"
        @refresh="loadAll"
        @notify="handleNotify"
        @payment-opened="pendingPaymentId = ''"
      />

    </div>

    <ConfirmDialog
        v-if="showLogoutConfirm"
        message="Are you sure you want to log out?"
        @confirm="confirmLogout"
        @cancel="showLogoutConfirm = false"
    />

  </div>
</template>

<script>
import { getSession, logout } from '@/services/authService'
import { getStudentById } from '@/services/studentService'
import { getAllBookings } from '@/services/bookingService'
import { getAllTutors } from '@/services/tutorService'
import { getAllSubjects } from '@/services/subjectService'
import { request } from '@/services/http'
import StudentDashboard from './StudentDashboard.vue'
import StudentBookings from './StudentBookings.vue'
import Payment from '../Payment/Payment.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

// these menu buttons open panels on the dashboard instead of their own pages
const DASHBOARD_PANELS = ['history', 'tutors', 'profile']

export default {
  name: "StudentManagement",

  components: {
    StudentDashboard,
    StudentBookings,
    Payment,
    ConfirmDialog
  },

  data() {
    return {
      // which page is showing on the right and which dashboard panel is open
      currentPage: "dashboard",
      dashboardPanel: "",
      session: getSession(),
      me: {},
      tutors: [],
      subjects: [],
      tutorSubjects: [],
      selectedTutorId: "",
      pendingPaymentId: "",
      error: "",
      success: "",
      showLogoutConfirm: false
    }
  },

  computed: {
    // name for the side bar, falls back to the login name if needed
    displayName() {
      const name = `${this.me.firstName || ''} ${this.me.lastName || ''}`.trim()

      if (name) {
        return name
      }

      return this.session ? this.session.name : "Student"
    },

    // first letters of the name for the round picture eg JS
    initials() {
      const words = this.displayName.trim().split(" ").filter(Boolean)

      if (words.length === 0) {
        return "S"
      }

      if (words.length === 1) {
        return words[0].charAt(0).toUpperCase()
      }

      return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
    }
  },

  async created() {
    if (this.$route.name === 'profile') {
      this.changePage('profile')
    }
    await this.loadAll()
  },

  mounted() {
    window.addEventListener('focus', this.loadAll)
  },

  beforeUnmount() {
    window.removeEventListener('focus', this.loadAll)
  },

  // if profile gets clicked on the top navbar while already on this page
  watch: {
    dashboardPanel(panel) {
      if (panel === 'history') this.loadAll()
    },
    $route(to) {
      if (to.name === 'profile') {
        this.changePage('profile')
      }
    }
  },

  methods: {
    // pulls the student info, tutors and subjects from the backend
    // if the student cant be found we log out to be safe
    async loadAll() {
      try {
        const [me, bookings, tutors, subjects, tutorSubjects] = await Promise.all([
          getStudentById(this.session.id),
          getAllBookings().catch(() => []),
          getAllTutors(),
          getAllSubjects(),
          request('/tutoring/tutorsubject/getAll', { label: 'Tutor subject' }).catch(() => [])
        ])

        if (!me || !me.studentNumber) {
          logout()
          this.$router.push('/login')
          return
        }

        const bookingsById = new Map()
        for (const booking of [
          ...(Array.isArray(me.bookings) ? me.bookings : []),
          ...(Array.isArray(bookings) ? bookings : [])
        ]) {
          if (!booking || !booking.bookingId) continue
          const key = String(booking.bookingId)
          bookingsById.set(key, { ...bookingsById.get(key), ...booking })
        }

        this.me = { ...me, bookings: Array.from(bookingsById.values()) }
        this.tutors = tutors
        this.subjects = subjects
        this.tutorSubjects = tutorSubjects
      } catch (e) {
        this.error = e.message
      }
    },

    isDashboardPanel(panel) {
      return this.currentPage === 'dashboard' && this.dashboardPanel === panel
    },

    // runs whenever a menu button gets clicked
    // payments, history, tutors and profile open as panels on the dashboard
    // the rest are proper pages
    changePage(page) {
      if (DASHBOARD_PANELS.includes(page)) {
        this.dashboardPanel = page
        this.currentPage = 'dashboard'
      } else {
        this.currentPage = page
        this.dashboardPanel = ''

        if (page !== 'book') {
          this.selectedTutorId = ''
        }
      }

      if (this.$route.name === 'profile' && page !== 'profile') {
        this.$router.push('/student-home')
      }
    },

    // the dashboard reports back when a panel opens or closes so we stay in sync
    onPanelChange(panel) {
      this.dashboardPanel = panel
    },

    // saves the chosen tutor then jumps to the booking form
    bookWith(tutorId) {
      this.selectedTutorId = tutorId
      this.changePage('book')
    },

    // after a booking is created, send the student straight to payment
    onOpenPayment(booking) {
      this.pendingPaymentId = booking && booking.bookingId ? String(booking.bookingId) : ''
      this.changePage('payments')
    },

    // shows the success or error message at the top
    handleNotify({ type, message }) {
      if (type === 'error') {
        this.success = ''
        this.error = message
        return
      }

      this.error = ''
      this.success = message
      setTimeout(() => {
        this.success = ''
      }, 3500)
    },

    doLogout() {
      this.showLogoutConfirm = true
    },

    confirmLogout() {
      this.showLogoutConfirm = false

      logout()
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.student-management {
  display: flex;
  min-height: 100vh;
  background-color: #f7f8fa;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  color: #2c3e50;
}

/* SIDEBAR */
.student-navigation {
    width: 250px;
    min-height: 100vh;
    background-color: #ffffff;
    border-right: 1px solid #e5e7eb;
    padding: 25px 15px;
    box-sizing: border-box;
    text-align: left;
}

.profile-section {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 25px;
    margin-bottom: 25px;
    border-bottom: 1px solid #e5e7eb;
}

.profile-image {
    width: 48px;
    height: 48px;
    background-color: #2c3e50;
    color: #ffffff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 16px;
}

.profile-details h3 {
    margin: 0;
    font-size: 15px;
    color: #2c3e50;
    word-break: break-word;
}

.profile-details p {
    margin: 4px 0 0;
    font-size: 12px;
    color: #8a94a3;
}

.navigation-section {
    margin-bottom: 28px;
}

.section-title {
    font-size: 10px;
    font-weight: bold;
    color: #9ca3af;
    margin: 0 0 10px 10px;
    letter-spacing: 1px;
}

.nav-item {
    display: block;
    width: 100%;
    background: none;
    border: none;
    color: #2c3e50;
    padding: 11px 12px;
    margin-bottom: 5px;
    border-radius: 7px;
    font-family: inherit;
    font-size: 14px;
    text-align: left;
    cursor: pointer;
}

.nav-item:hover {
    background-color: #f7f8fa;
}

.nav-item.active {
    background-color: #f7f8fa;
    color: #2c3e50;
    border-left: 4px solid #f28c28;
    font-weight: bold;
}

.nav-item.logout-item {
    color: #c0392b;
}

.nav-item.logout-item:hover {
    background-color: #fce8e6;
}

/* CONTENT */
.page-content {
  flex: 1;
  min-width: 0;
}

.banner {
  margin: 20px 30px 0;
  padding: 13px 18px;
  border-radius: 8px;
  font-size: 14px;
}

.error-banner {
  background: #fce8e6;
  color: #96281b;
  border: 1px solid #f2b8b5;
}

.success-banner {
  background: #e6f4ec;
  color: #1e7a58;
  border: 1px solid #b7e4cd;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
