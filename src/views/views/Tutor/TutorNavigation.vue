<template>
  <aside class="tutor-navigation">

    <div class="profile-section">
      <div class="profile-image">
        {{ initials }}
      </div>

      <div class="profile-details">
        <h3>{{ fullName }}</h3>
        <p>Tutor</p>
      </div>
    </div>

    <div class="navigation-section">
      <p class="section-title">MANAGEMENT</p>
      <button
        class="nav-item"
        :class="{ active: activePage === 'dashboard' }"
        @click="changePage('dashboard')"
      >
        Dashboard
      </button>
      <button
        class="nav-item"
        :class="{ active: activePage === 'search' }"
        @click="changePage('search')"
      >
        Search
      </button>
    </div>

    <div class="navigation-section">
      <p class="section-title">SESSIONS</p>
      <button
        class="nav-item"
        :class="{ active: activePage === 'today' }"
        @click="changePage('today')"
      >
        Today's Sessions
      </button>
      <button
        class="nav-item"
        :class="{ active: activePage === 'upcoming' }"
        @click="changePage('upcoming')"
      >
        Upcoming Sessions
      </button>
      <button
        class="nav-item"
        :class="{ active: activePage === 'completed' }"
        @click="changePage('completed')"
      >
        Completed Sessions
      </button>
      <button
        class="nav-item"
        :class="{ active: activePage === 'cancelled' }"
        @click="changePage('cancelled')"
      >
        Cancelled Sessions
      </button>
    </div>

    <div class="navigation-section">
      <p class="section-title">TUTOR</p>
      <button
        class="nav-item"
        :class="{ active: activePage === 'subjects' }"
        @click="changePage('subjects')"
      >
        Subjects Taught
      </button>
      <button
        class="nav-item"
        :class="{ active: activePage === 'availability' }"
        @click="changePage('availability')"
      >
        Availability
      </button>
      <button
        class="nav-item"
        :class="{ active: activePage === 'profile' }"
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

    <ConfirmDialog
      v-if="showLogoutConfirm"
      message="Are you sure you want to log out?"
      @confirm="confirmLogout"
      @cancel="showLogoutConfirm = false"
    />

  </aside>
</template>


<script>
import { getSession, logout } from '@/services/authService'
import { getTutorById } from '@/services/tutorService'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

export default {
    name: "TutorNavigation",

    components: {
        ConfirmDialog
    },

    props: {
        activePage: {
            type: String,
            default: "dashboard"
        }
    },

    data() {
        return {
            session: null,
            firstName: "",
            lastName: "",
            showLogoutConfirm: false
        }
    },

    computed: {
        fullName() {
            const name = `${this.firstName} ${this.lastName}`.trim()

            if (name) {
                return name
            }

            return this.session ? this.session.name : "Tutor"
        },

        initials() {
            const words = this.fullName.trim().split(" ").filter(Boolean)

            if (words.length === 0) {
                return "TN"
            }

            if (words.length === 1) {
                return words[0].charAt(0).toUpperCase()
            }

            return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
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
                this.firstName = tutor.firstName || ""
                this.lastName = tutor.lastName || ""
            }
        } catch (error) {
            this.firstName = ""
            this.lastName = ""
        }
    },

    methods: {
        changePage(page) {
            this.$emit("change-page", page)
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

.tutor-navigation {
    width: 250px;
    min-height: 100vh;
    background-color: #ffffff;
    font-family: Avenir, Helvetica, Arial, sans-serif;
    color: #2c3e50;
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

</style>