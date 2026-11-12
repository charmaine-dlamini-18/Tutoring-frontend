<template>
  <div class="tutor-management">

    <TutorNavigation
      :activePage="currentPage"
      @change-page="changePage"
    />

    <div class="page-content">
      <TutorDashboard
        v-if="currentPage === 'dashboard'"
        @change-page="changePage"
      />

      <TodaysSessions v-if="currentPage === 'today'" />

      <UpcomingSessions v-if="currentPage === 'upcoming'" />

      <CompletedSessions v-if="currentPage === 'completed'" />

      <CancelledSessions v-if="currentPage === 'cancelled'" />

      <TutorSubjects v-if="currentPage === 'subjects'" />

      <TutorAvailability v-if="currentPage === 'availability'" />

      <TutorProfile v-if="currentPage === 'profile'" />

      <TutorSearch v-if="currentPage === 'search'" />
    </div>

  </div>
</template>

<script>
import TutorNavigation from './TutorNavigation.vue'
import TutorDashboard from './TutorDashboard.vue'
import TodaysSessions from './TodaysSessions.vue'
import UpcomingSessions from './UpcomingSessions.vue'
import CompletedSessions from './CompletedSessions.vue'
import CancelledSessions from './CancelledSessions.vue'
import TutorSubjects from './TutorSubjects.vue'
import TutorAvailability from './TutorAvailability.vue'
import TutorProfile from './TutorProfile.vue'
import TutorSearch from './TutorSearch.vue'

export default {
  name: "TutorManagement",

  components: {
    TutorNavigation,
    TutorDashboard,
    TodaysSessions,
    UpcomingSessions,
    CompletedSessions,
    CancelledSessions,
    TutorSubjects,
    TutorAvailability,
    TutorProfile,
    TutorSearch
  },

  data() {
    return {
      currentPage: "dashboard"
    }
  },

  methods: {
    changePage(page) {
      this.currentPage = page
    }
  }
}
</script>

<style scoped>
.tutor-management {
  display: flex;
  min-height: 100vh;
  background-color: #f7f8fa;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  color: #2c3e50;
}

.page-content {
  flex: 1;
}
</style>