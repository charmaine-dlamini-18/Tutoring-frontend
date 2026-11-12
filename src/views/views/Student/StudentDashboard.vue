<template>
    <div class="dashboard-layout">

        <main class="dashboard-content">

            <section class="dashboard-header">
                <div class="header-text">
                    <p class="header-label">STUDENT PORTAL</p>
                    <h1>Welcome back, {{ fullName }}</h1>
                    <p class="header-description">
                        Here are your upcoming sessions.
                    </p>
                </div>
            </section>

            <!-- quick action buttons, pressing one swaps the view below to that section -->
            <section class="quick-actions">

                <div class="action-buttons">

                    <button
                    class="action-button new-booking"
                    @click="changePage('book')"
                    >
                        <span class="action-label">BOOKING</span>
                        <span class="action-text">+ New Booking</span>
                    </button>

                    <button
                    class="action-button payments"
                    :class="{ active: activePanel === 'payments' }"
                    @click="togglePanel('payments')"
                    >
                        <span class="action-label">PAYMENTS</span>
                        <span class="action-text">Payments</span>
                    </button>

                    <button
                    class="action-button history"
                    :class="{ active: activePanel === 'history' }"
                    @click="togglePanel('history')"
                    >
                        <span class="action-label">HISTORY</span>
                        <span class="action-text">Booking History</span>
                    </button>

                    <button
                    class="action-button tutors"
                    :class="{ active: activePanel === 'tutors' }"
                    @click="togglePanel('tutors')"
                    >
                        <span class="action-label">TUTORS</span>
                        <span class="action-text">Find Tutors</span>
                    </button>

                </div>

            </section>

            <!-- upcoming sessions table, this is the default view until a button above gets pressed -->
            <section v-if="!activePanel" class="dashboard-row">

                <div class="dashboard-card large-card">

                    <div class="card-header">
                        <div>
                            <h2>Upcoming Sessions</h2>
                            <p>Your next scheduled tutoring sessions</p>
                        </div>

                        <button
                            class="text-button"
                            @click="changePage('bookings')"
                        >
                            Manage Bookings
                        </button>
                    </div>

                    <template v-if="upcomingBookings.length">

                        <div class="table-header session-columns">
                            <span>Date</span>
                            <span>Subject</span>
                            <span>Tutor</span>
                            <span>Time</span>
                            <span>Type</span>
                        </div>

                        <div
                            v-for="b in upcomingBookings"
                            :key="b.bookingId"
                            class="table-row session-columns"
                        >
                            <span class="cell-strong">{{ formatDate(b.date) }}</span>
                            <span>{{ subjectName(b.subjectCode) }}</span>
                            <span>{{ tutorName(b) }}</span>
                            <span>{{ formatTime(b.date) }}</span>
                            <span>{{ b.sessionType }}</span>
                        </div>

                    </template>

                    <div v-else class="empty-state">
                        <div class="empty-circle">—</div>

                        <h3>No sessions scheduled</h3>

                        <p>
                            You don't have any tutoring sessions booked yet.
                        </p>
                    </div>

                </div>

                <!-- quick counts of the students activity -->
                <div class="dashboard-card side-card">

                    <div class="card-header">
                        <div>
                            <h2>Session Overview</h2>
                            <p>Your tutoring activity</p>
                        </div>
                    </div>

                    <div class="overview-list">

                        <div class="overview-item">
                            <div>
                                <span class="overview-dot"></span>
                                <span>Upcoming</span>
                            </div>

                            <strong>{{ upcomingBookings.length }}</strong>
                        </div>

                        <div class="overview-item">
                            <div>
                                <span class="overview-dot"></span>
                                <span>Completed</span>
                            </div>

                            <strong>{{ pastBookings.length }}</strong>
                        </div>

                        <div class="overview-item">
                            <div>
                                <span class="overview-dot"></span>
                                <span>Awaiting Payment</span>
                            </div>

                            <strong>{{ unpaidCount }}</strong>
                        </div>

                    </div>

                </div>

            </section>

            <!-- PAYMENTS PANEL -->
            <transition name="fade">
                <div v-if="activePanel === 'payments'" class="dashboard-card full-width-panel">

                    <div class="card-header">
                        <div>
                            <h2>Make a Payment</h2>
                            <p>{{ unpaidCount }} booking{{ unpaidCount === 1 ? '' : 's' }} awaiting payment &middot; {{ fmtR(totalSpent) }} paid so far</p>
                        </div>
                    </div>

                    <template v-if="unpaidBookings.length">

                        <p class="section-subtitle">Awaiting Payment</p>

                        <div class="table-scroll">

                            <div class="table-header unpaid-columns">
                                <span>When</span>
                                <span>Subject</span>
                                <span>Tutor</span>
                                <span>Type</span>
                                <span>Duration</span>
                                <span>Amount Due</span>
                                <span></span>
                            </div>

                            <div
                                v-for="b in unpaidBookings"
                                :key="b.bookingId"
                                class="table-row unpaid-columns"
                            >
                                <span class="cell-strong">{{ formatDate(b.date) }}</span>
                                <span>{{ subjectName(b.subjectCode) }}</span>
                                <span>{{ tutorName(b) }}</span>
                                <span>{{ b.sessionType }}</span>
                                <span>{{ b.duration }} min</span>
                                <span class="cell-strong">{{ fmtR(amountDue(b)) }}</span>
                                <span class="row-actions-cell">
                                    <button
                                        type="button"
                                        class="pay-now-button"
                                        @click="openPay(b)"
                                    >
                                        Pay Now
                                    </button>
                                </span>
                            </div>

                        </div>

                    </template>

                    <div v-else class="settled-note">
                        You're all settled up - no bookings are awaiting payment.
                    </div>

                    <template v-if="recentPayments.length">

                        <p class="section-subtitle spaced">Payment History</p>

                        <div class="table-scroll">

                            <div class="table-header payment-columns">
                                <span>Reference</span>
                                <span>Amount</span>
                                <span>Date Paid</span>
                                <span>Method</span>
                                <span>Status</span>
                                <span>For</span>
                            </div>

                            <div
                                v-for="p in recentPayments"
                                :key="p.paymentRef"
                                class="table-row payment-columns"
                            >
                                <span class="mono">{{ p.paymentRef }}</span>
                                <span class="cell-strong">{{ fmtR(p.amount) }}</span>
                                <span>{{ formatDate(p.paymentDate) }}</span>
                                <span>{{ p.paymentMethod }}</span>
                                <span :class="['status-chip', 'paid']">{{ p.status }}</span>
                                <span>{{ subjectName(p._subjectCode) }} &mdash; {{ formatDate(p._bookingDate) }}</span>
                            </div>

                        </div>

                    </template>

                </div>
            </transition>

            <!-- HISTORY PANEL -->
            <transition name="fade">
                <div v-if="activePanel === 'history'" class="dashboard-card full-width-panel">

                    <div class="card-header">
                        <div>
                            <h2>Booking History</h2>
                            <p>Every booking you have made, newest first</p>
                        </div>
                    </div>

                    <template v-if="sortedHistory.length">

                        <div class="table-scroll">

                            <div class="table-header history-columns">
                                <span>Booking ID</span>
                                <span>Date</span>
                                <span>Subject</span>
                                <span>Tutor</span>
                                <span>Type</span>
                                <span>Duration</span>
                                <span>Amount</span>
                                <span>Status</span>
                            </div>

                            <div
                                v-for="b in sortedHistory"
                                :key="b.bookingId"
                                class="table-row history-columns"
                            >
                                <span class="mono">{{ b.bookingId }}</span>
                                <span class="cell-strong">{{ formatDate(b.date) }}</span>
                                <span>{{ subjectName(b.subjectCode) }}</span>
                                <span>{{ tutorName(b) }}</span>
                                <span>{{ b.sessionType }}</span>
                                <span>{{ b.duration }} min</span>
                                <span class="cell-strong">{{ b.payment ? fmtR(b.payment.amount) : '&mdash;' }}</span>
                                <span :class="['status-chip', b.payment ? 'paid' : 'unpaid']">
                                    {{ b.payment ? 'Paid' : 'Unpaid' }}
                                </span>
                            </div>

                        </div>

                    </template>

                    <div v-else class="empty-state">
                        <div class="empty-circle">—</div>

                        <h3>No history yet</h3>

                        <p>Every booking you make is recorded here.</p>
                    </div>

                </div>
            </transition>

            <!-- TUTORS PANEL: a card for each tutor, opens from the Find Tutors button -->
            <transition name="fade">
                <div v-if="activePanel === 'tutors'" class="panel-section">

                    <div v-if="!tutors.length" class="dashboard-card">

                        <div class="empty-state">
                            <div class="empty-circle">—</div>

                            <h3>No tutors listed yet</h3>

                            <p>Check back soon - tutors appear here as they join.</p>
                        </div>

                    </div>

                    <div v-else class="tutor-grid">

                        <div v-for="t in tutors" :key="t.tutorId" class="tutor-card">

                            <div class="tutor-top">
                                <div class="tutor-avatar">{{ t.firstName.charAt(0) }}{{ t.lastName.charAt(0) }}</div>

                                <div class="tutor-name">
                                    <h3>{{ t.firstName }} {{ t.lastName }}</h3>
                                    <p>{{ t.tutorId }}</p>
                                </div>
                            </div>

                            <span class="rate-badge">{{ fmtR(t.hourlyRate) }}/hr</span>

                            <div class="tutor-meta">
                                <p>&#9993; {{ t.email }}</p>
                                <p>&#128222; {{ t.phoneNumber }}</p>
                            </div>

                            <button
                            type="button"
                            class="book-button"
                            @click="$emit('book-with', t.tutorId)"
                            >
                                Book with {{ t.firstName }}
                            </button>

                        </div>

                    </div>

                </div>
            </transition>

            <!-- PROFILE PANEL: edit form, opens from the Profile button on the banner -->
            <transition name="fade">
                <div v-if="activePanel === 'profile'" class="panel-section narrow">
                    <StudentProfile
                        embedded
                        :me="me"
                        @refresh="$emit('refresh')"
                        @notify="forwardNotify"
                    />
                </div>
            </transition>

            <!-- PAY MODAL -->
            <transition name="fade">
                <div v-if="payTarget" class="modal-backdrop" @click.self="closePay">
                    <div class="modal">
                        <div class="modal-head">
                            <button type="button" class="back-btn" @click="closePay">
                                <i class="bi bi-arrow-left"></i>
                            </button>
                            <h3>Payment</h3>
                            <button type="button" class="close-x" @click="closePay">&times;</button>
                        </div>

                        <div class="modal-body-layout">
                            <!-- Left: Booking Details + Summary -->
                            <div class="modal-left">
                                <div class="payment-card">
                                    <div class="section-title">Booking Details</div>
                                    <div class="booking-info">
                                        <div class="info-row">
                                            <span class="info-label">Booking ID</span>
                                            <span class="info-value">{{ payTarget.bookingId }}</span>
                                        </div>
                                        <div class="info-row">
                                            <span class="info-label">Subject</span>
                                            <span class="info-value">{{ subjectName(payTarget.subjectCode) }}</span>
                                        </div>
                                        <div class="info-row">
                                            <span class="info-label">Date</span>
                                            <span class="info-value">{{ formatDate(payTarget.date) }}</span>
                                        </div>
                                        <div class="info-row">
                                            <span class="info-label">Duration</span>
                                            <span class="info-value">{{ payTarget.duration }} minutes</span>
                                        </div>
                                        <div class="info-row">
                                            <span class="info-label">Tutor</span>
                                            <span class="info-value">{{ tutorName(payTarget) }}</span>
                                        </div>
                                        <div class="info-row">
                                            <span class="info-label">Hourly Rate</span>
                                            <span class="info-value">R{{ tutorHourlyRate(payTarget).toFixed(2) }}</span>
                                        </div>
                                        <div class="info-row">
                                            <span class="info-label">Session</span>
                                            <span class="session-badge">{{ formatSessionType(payTarget.sessionType) }}</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="payment-card">
                                    <div class="section-title">Payment Summary</div>
                                    <div class="price-row">
                                        <span class="price-label">Tutor hourly rate</span>
                                        <span class="price-value">R{{ tutorHourlyRate(payTarget).toFixed(2) }}</span>
                                    </div>
                                    <div class="price-row">
                                        <span class="price-label">Duration</span>
                                        <span class="price-value">{{ (Number(payTarget.duration || 0) / 60).toFixed(2) }} hour(s)</span>
                                    </div>
                                    <div class="price-summary">
                                        <div class="total-row">
                                            <span class="total-label">Total</span>
                                            <span class="total-amount">R{{ paymentForm.amount.toFixed(2) }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Right: Payment Method -->
                            <div class="modal-right">
                                <div class="payment-card">
                                    <div class="section-title">Payment Method</div>

                                    <div
                                        class="payment-option"
                                        :class="{ selected: paymentForm.paymentMethod === 'CASH' }"
                                        @click="paymentForm.paymentMethod = 'CASH'"
                                    >
                                        <div class="payment-option-content">
                                            <input type="radio" value="CASH" v-model="paymentForm.paymentMethod">
                                            <div class="payment-icon"><i class="bi bi-cash"></i></div>
                                            <div>
                                                <div class="payment-option-title">Pay in Person</div>
                                                <p class="payment-option-text">Pay the tutor directly during your session.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        class="payment-option"
                                        :class="{ selected: paymentForm.paymentMethod === 'Card' }"
                                        @click="paymentForm.paymentMethod = 'Card'"
                                    >
                                        <div class="payment-option-content">
                                            <input type="radio" value="Card" v-model="paymentForm.paymentMethod">
                                            <div class="payment-icon"><i class="bi bi-credit-card"></i></div>
                                            <div>
                                                <div class="payment-option-title">Online Payment</div>
                                                <p class="payment-option-text">Pay securely using your card.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div v-if="paymentForm.paymentMethod === 'CASH'" class="in-person-info">
                                        <div class="info-flex">
                                            <i class="bi bi-info-circle"></i>
                                            <div>
                                                <h6>Pay the tutor in person</h6>
                                                <p>You will pay the tutor directly during your session. The payment will remain pending until the tutor confirms that payment has been received.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div v-if="paymentForm.paymentMethod === 'Card'" class="card-details">
                                        <div class="mb-3">
                                            <label class="form-label">Cardholder Name</label>
                                            <input type="text" class="form-control" v-model="cardName" placeholder="Enter cardholder name">
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Card Number</label>
                                            <input type="text" class="form-control" v-model="cardNumber" placeholder="1234 5678 9012 3456">
                                        </div>
                                        <div class="row">
                                            <div class="col-6">
                                                <label class="form-label">Expiry Date</label>
                                                <input type="text" class="form-control" v-model="expiryDate" placeholder="MM / YY">
                                            </div>
                                            <div class="col-6">
                                                <label class="form-label">CVV</label>
                                                <input type="password" class="form-control" v-model="cvv" placeholder="•••">
                                            </div>
                                        </div>
                                    </div>

                                    <p v-if="modalError" class="modal-error">{{ modalError }}</p>

                                    <button class="payment-btn" :disabled="paying" @click="confirmPay">
                                        <span v-if="paying"><span class="spinner-border spinner-border-sm me-2"></span>Processing...</span>
                                        <span v-else>
                                            <i v-if="paymentForm.paymentMethod === 'Card'" class="bi bi-lock-fill me-2"></i>
                                            <i v-else class="bi bi-check-circle me-2"></i>
                                            {{ paymentForm.paymentMethod === 'Card' ? 'Pay ' + fmtR(paymentForm.amount) : 'Confirm Payment' }}
                                        </span>
                                    </button>

                                    <div v-if="paymentForm.paymentMethod === 'Card'" class="secure-text">
                                        <i class="bi bi-shield-check"></i>
                                        Your payment information is secure.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </transition>

        </main>

    </div>
</template>

<script>
import StudentProfile from './StudentProfile.vue'
import { createPayment } from '@/services/paymentService'

export default {
    name: "StudentDashboard",

    components: {
        StudentProfile
    },

    // all of this info gets passed down from StudentManagement
    props: {
        me: {
            type: Object,
            default: () => ({})
        },

        tutors: {
            type: Array,
            default: () => []
        },

        subjects: {
            type: Array,
            default: () => []
        },

        initialPanel: {
            type: String,
            default: ""
        }
    },

    data() {
        return {
            activePanel: "",
            payTarget: null,
            paymentForm: { amount: 0, paymentMethod: "" },
            modalError: "",
            paying: false,
            cardName: "",
            cardNumber: "",
            expiryDate: "",
            cvv: ""
        }
    },

    // lets the side bar open a panel here from outside the page
    // an empty value closes any open panel and goes back to the default view
    watch: {
        initialPanel: {
            immediate: true,
            handler(value) {
                this.activePanel = value || ""
            }
        }
    },

    computed: {
        // quick way to get the bookings list
        myBookings() {
            return this.me.bookings || []
        },

        // full name used in the welcome message
        fullName() {
            const name = `${this.me.firstName || ''} ${this.me.lastName || ''}`.trim()

            if (name) {
                return name
            }

            return "Student"
        },

        // sessions that havent happened yet, soonest first
        upcomingBookings() {
            const now = Date.now()
            return this.myBookings
                .filter(b => new Date(b.date).getTime() >= now)
                .sort((a, b) => new Date(a.date) - new Date(b.date))
        },

        // sessions already done, newest first
        pastBookings() {
            const now = Date.now()
            return this.myBookings
                .filter(b => new Date(b.date).getTime() < now)
                .sort((a, b) => new Date(b.date) - new Date(a.date))
        },

        // every booking sorted newest first
        sortedHistory() {
            return [...this.myBookings].sort((a, b) => new Date(b.date) - new Date(a.date))
        },

        // pulls the payment info out of each booking, newest first
        recentPayments() {
            return this.myBookings
                .filter(b => b.payment)
                .map(b => ({
                    ...b.payment,
                    _subjectCode: b.subjectCode,
                    _bookingDate: b.date
                }))
                .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
        },

        // bookings with no payment yet, soonest first
        unpaidBookings() {
            return this.myBookings
                .filter(b => !b.payment)
                .sort((a, b) => new Date(a.date) - new Date(b.date))
        },

        unpaidCount() {
            return this.unpaidBookings.length
        },

        // adds up every payment made so far
        totalSpent() {
            return this.myBookings.reduce((sum, b) => sum + Number(b.payment ? b.payment.amount : 0), 0)
        }
    },

    methods: {
        changePage(page) {
            this.$emit("change-page", page)
        },

        // opens the clicked panel, or closes it if its already open
        togglePanel(name) {
            this.activePanel = this.activePanel === name ? "" : name
            this.$emit("panel-change", this.activePanel)
        },

        forwardNotify(notification) {
            this.$emit("notify", notification)
        },

        // the tutor of a booking. The API sends the tutor ID with the booking,
        // because students do not receive other people's bookings.
        tutorForBooking(booking) {
            if (!booking) return null
            const direct = this.tutors.find(
                t => String(t.tutorId) === String(booking.tutorId)
            )
            if (direct) return direct
            return this.tutors.find(
                t => (t.bookings || []).some(x => x.bookingId === booking.bookingId)
            ) || null
        },

        // what the student owes for a booking, based on the tutors hourly rate
        amountDue(booking) {
            const tutor = this.tutorForBooking(booking)
            if (!tutor) return 0
            return Number((Number(tutor.hourlyRate || 0) * (Number(booking.duration || 60) / 60)).toFixed(2))
        },

        tutorHourlyRate(booking) {
            const tutor = this.tutorForBooking(booking)
            return tutor ? Number(tutor.hourlyRate || 0) : 0
        },

        // opens the pay window with the amount already worked out
        openPay(booking) {
            this.modalError = ""
            this.cardName = ""
            this.cardNumber = ""
            this.expiryDate = ""
            this.cvv = ""
            this.paymentForm.amount = this.amountDue(booking)
            this.paymentForm.paymentMethod = this.isInPerson(booking.sessionType) ? "CASH" : "Card"
            this.payTarget = booking
        },

        closePay() {
            this.payTarget = null
            this.modalError = ""
        },

        // saves the payment to the database and links it to the booking
        async confirmPay() {
            this.modalError = ""
            if (!this.paymentForm.paymentMethod) {
                this.modalError = "Please select a payment method."
                return
            }
            if (this.paymentForm.amount <= 0) {
                this.modalError = "The payment amount could not be calculated."
                return
            }
            if (this.paymentForm.paymentMethod === "Card") {
                if (!this.cardName || !this.cardNumber || !this.expiryDate || !this.cvv) {
                    this.modalError = "Please complete your card details."
                    return
                }
            }
            this.paying = true
            try {
                await createPayment({
                    paymentRef: `PM-${Date.now()}`,
                    amount: this.paymentForm.amount,
                    paymentDate: new Date().toISOString().slice(0, 19),
                    paymentMethod: this.paymentForm.paymentMethod,
                    status: this.paymentForm.paymentMethod === 'CASH' ? 'PENDING' : 'PAID',
                    booking: { bookingId: this.payTarget.bookingId }
                })
                this.closePay()
                this.$emit("refresh")
                this.$emit("notify", { type: 'success', message: 'Payment successful!' })
            } catch (e) {
                this.modalError = e.message
            } finally {
                this.paying = false
            }
        },

        // formats a number as rands like R150.00
        fmtR(value) {
            return `R${Number(value || 0).toFixed(2)}`
        },

        // looks up a subjects full name from its code
        subjectName(code) {
            const s = this.subjects.find(x => x.subjectCode === code)
            return s ? s.subjectName : code
        },

        tutorName(booking) {
            const target = typeof booking === 'string'
                ? this.myBookings.find(b => String(b.bookingId) === String(booking))
                : booking
            const tutor = this.tutorForBooking(target)
            return tutor ? `${tutor.firstName} ${tutor.lastName}` : 'Unknown'
        },

        // readable date like 12 Mar 2026, 14:30
        formatDate(value) {
            if (!value) return '-'
            return new Date(value).toLocaleString('en-ZA', {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })
        },

        formatTime(value) {
            if (!value) return '-'
            return new Date(value).toLocaleTimeString('en-ZA', {
                hour: '2-digit', minute: '2-digit'
            })
        },

        formatSessionType(type) {
            if (!type) return 'Not specified'
            return this.isInPerson(type) ? 'In-person' : 'Online'
        },

        isInPerson(type) {
            if (!type) return true
            const t = String(type).toUpperCase().replace(/[\s-]/g, '')
            return t === 'INPERSON'
        }
    }
}
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f4f7fc;
  background-image:
    radial-gradient(circle at 92% 6%, rgba(59, 130, 246, 0.12), transparent 40%),
    linear-gradient(180deg, #f7f9fc 0%, #eef3f9 100%);
  font-family: Avenir, Helvetica, Arial, sans-serif;
  color: #2c3e50;
  text-align: left;
}

.dashboard-content {
  flex: 1;
  padding: 30px;
  box-sizing: border-box;
}

.dashboard-header {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
  background: linear-gradient(135deg, #1f2d45 0%, #2c3e50 48%, #355a72 100%);
  color: #ffffff;
  padding: 34px 32px;
  border: 1px solid rgba(242, 140, 40, 0.32);
  border-radius: 18px;
  margin-bottom: 22px;
  box-shadow: 0 14px 34px rgba(31, 45, 69, 0.22);
}

.dashboard-header::after {
  content: "";
  position: absolute;
  width: 220px;
  height: 220px;
  left: -80px;
  bottom: -130px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.35), transparent 68%);
  pointer-events: none;
}

.header-text {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.header-label {
  display: inline-block;
  color: #ffb066;
  font-size: 10px;
  font-weight: bold;
  letter-spacing: 1.6px;
  margin: 0 0 9px;
  padding: 5px 12px;
  border: 1px solid rgba(242, 140, 40, 0.45);
  border-radius: 999px;
  background: rgba(242, 140, 40, 0.15);
}

.dashboard-header h1 {
  font-size: 30px;
  margin: 0;
}

.header-description {
  color: #d7dde3;
  font-size: 15px;
  margin: 7px 0 0;
}

.ghost-button {
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.45);
  color: #ffffff;
  border-radius: 7px;
  padding: 11px 22px;
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
  white-space: nowrap;
}

.ghost-button:hover,
.ghost-button.active {
  background-color: #f28c28;
  border-color: #f28c28;
}

/* QUICK ACTIONS */
.quick-actions {
  margin-bottom: 22px;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

/* compact version of the tutor dashboard summary cards */
.action-button {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  text-align: left;
  padding: 12px 14px;
  border: 1px solid #f7d3ab;
  border-top: 3px solid #f28c28;
  border-radius: 12px;
  background: linear-gradient(135deg, #fff8ef 0%, #ffe7cf 100%);
  color: #22354d;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(242, 140, 40, 0.1);
  transition: transform 0.15s ease, box-shadow 0.15s ease, filter 0.15s ease;
}

.action-label {
  color: #b35c10;
  font-size: 9px;
  font-weight: bold;
  letter-spacing: 1.1px;
}

.action-text {
  font-size: 13px;
  font-weight: 600;
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(242, 140, 40, 0.18);
}

.action-button.active {
  filter: brightness(0.98);
  box-shadow: inset 0 0 0 2px rgba(239, 125, 19, 0.45),
    0 8px 18px rgba(242, 140, 40, 0.2);
}

.action-button.payments {
  background: linear-gradient(135deg, #f0f6ff 0%, #dbe8ff 100%);
  border-color: #c7d9fb;
  border-top-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.action-button.payments .action-label {
  color: #2563a8;
}

.action-button.payments:hover {
  box-shadow: 0 8px 18px rgba(59, 130, 246, 0.18);
}

.action-button.history {
  background: linear-gradient(135deg, #edfaf4 0%, #d5f0e5 100%);
  border-color: #bfe7d5;
  border-top-color: #2e9e7a;
  box-shadow: 0 4px 12px rgba(46, 158, 122, 0.1);
}

.action-button.history .action-label {
  color: #1e7a58;
}

.action-button.history:hover {
  box-shadow: 0 8px 18px rgba(46, 158, 122, 0.18);
}

.action-button.tutors {
  background: linear-gradient(135deg, #fdf2f1 0%, #f8dcd9 100%);
  border-color: #f4c9c5;
  border-top-color: #d9534f;
  box-shadow: 0 4px 12px rgba(217, 83, 79, 0.1);
}

.action-button.tutors .action-label {
  color: #b03a34;
}

.action-button.tutors:hover {
  box-shadow: 0 8px 18px rgba(217, 83, 79, 0.18);
}

/* PANELS */
.panel-section {
  animation: panel-in 0.25s ease;
}

.panel-section.narrow {
  max-width: 860px;
}

/* TUTOR CARDS */
.tutor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 18px;
  margin-bottom: 22px;
}

.tutor-card {
  background:
    linear-gradient(180deg, #ffffff 0%, #fffaf4 100%) padding-box,
    linear-gradient(135deg, rgba(242, 140, 40, 0.75), rgba(255, 196, 133, 0.35)) border-box;
  border: 1.5px solid transparent;
  border-radius: 16px;
  padding: 22px;
  box-shadow: 0 6px 18px rgba(44, 62, 80, 0.07);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.tutor-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 32px rgba(239, 125, 19, 0.18);
}

.tutor-top {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tutor-avatar {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #2c3e50 0%, #3d566e 60%, #f28c28 160%);
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(44, 62, 80, 0.22);
}

.tutor-name h3 {
  margin: 0;
  font-size: 15px;
}

.tutor-name p {
  margin: 4px 0 0;
  font-size: 11px;
  color: #8a94a3;
}

.rate-badge {
  display: inline-block;
  margin-top: 14px;
  background: linear-gradient(135deg, #fff3e7 0%, #ffe3c7 100%);
  color: #b35c10;
  font-weight: bold;
  font-size: 13px;
  padding: 5px 12px;
  border: 1px solid rgba(242, 140, 40, 0.35);
  border-radius: 999px;
  white-space: nowrap;
}

.tutor-meta {
  margin: 16px 0 18px;
  border-top: 1px solid #edf1f5;
  padding-top: 14px;
}

.tutor-meta p {
  margin: 6px 0;
  font-size: 13px;
  color: #55657a;
  word-break: break-all;
}

.book-button {
  display: block;
  width: 100%;
  background: linear-gradient(135deg, #2c3e50 0%, #3d566e 100%);
  color: #ffffff;
  border: none;
  border-radius: 9px;
  padding: 11px 18px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
}

.book-button:hover {
  background: linear-gradient(135deg, #f5a24a 0%, #ef7d13 100%);
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(239, 125, 19, 0.3);
}

@keyframes panel-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-enter-active {
  transition: opacity 0.2s ease;
}

.fade-enter {
  opacity: 0;
}

.dashboard-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 22px;
}

.full-width-panel,
.panel-section .dashboard-card {
  margin-bottom: 22px;
}

.dashboard-card {
  background:
    linear-gradient(#ffffff, #ffffff) padding-box,
    linear-gradient(135deg, rgba(242, 140, 40, 0.55), rgba(59, 130, 246, 0.35)) border-box;
  border: 1.5px solid transparent;
  border-radius: 16px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(44, 62, 80, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 14px;
  border-bottom: 1px solid #eef3f9;
  margin-bottom: 8px;
}

.card-header h2 {
  font-size: 17px;
  margin: 0;
  color: #22354d;
}

.card-header p {
  color: #8a94a3;
  font-size: 14px;
  margin: 4px 0 0;
}

.empty-state {
  min-height: 160px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.empty-circle {
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, #fff3e7 0%, #ffe0c2 100%);
  color: #d9760f;
  border: 1px solid rgba(242, 140, 40, 0.3);
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
  color: #8a94a3;
  font-size: 14px;
  margin: 0;
}

.table-scroll {
  overflow-x: auto;
}

.table-header,
.table-row {
  display: grid;
  padding: 12px 5px;
  align-items: center;
}

.table-header {
  color: #64748b;
  font-size: 10px;
  font-weight: bold;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  background: linear-gradient(90deg, #fff5e9 0%, #f1f6ff 100%);
  border: 1px solid #edf2f9;
  border-radius: 10px;
}

.table-row {
  border-top: 1px solid #edf1f5;
  font-size: 13px;
  border-radius: 8px;
  transition: background-color 0.15s ease, box-shadow 0.15s ease;
}

.table-row:hover {
  background-color: #f9fbff;
  box-shadow: inset 3px 0 0 #f28c28;
}

.session-columns {
  grid-template-columns: 1.4fr 1.4fr 1.1fr 0.8fr 0.9fr;
}

.payment-columns {
  grid-template-columns: 1.1fr 0.8fr 1.3fr 0.8fr 0.9fr 1.6fr;
  min-width: 820px;
}

.history-columns {
  grid-template-columns: 1.2fr 1.5fr 1.3fr 1.1fr 1fr 0.9fr 0.9fr 0.9fr;
  min-width: 1000px;
}

.cell-strong {
  font-weight: bold;
}

.mono {
  font-family: monospace;
  font-size: 12px;
  color: #61748a;
}

.status-chip {
  justify-self: start;
  padding: 3px 11px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: bold;
  white-space: nowrap;
}

.status-chip.paid {
  background: #e6f4ec;
  color: #1e7a58;
}

.status-chip.unpaid {
  background: #fce8e6;
  color: #c0392b;
}

.overview-list {
  padding-top: 10px;
}

.overview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 10px;
  border-bottom: 1px solid #eef2f7;
  border-radius: 8px;
  font-size: 12px;
  transition: background-color 0.15s ease;
}

.overview-item:hover {
  background-color: #f9fbff;
}

.overview-item div {
  display: flex;
  align-items: center;
  gap: 8px;
}

.overview-dot {
  width: 10px;
  height: 10px;
  background-color: #f28c28;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgba(242, 140, 40, 0.16);
}

.overview-item:nth-child(2) .overview-dot {
  background-color: #2e9e7a;
  box-shadow: 0 0 0 4px rgba(46, 158, 122, 0.16);
}

.overview-item:nth-child(3) .overview-dot {
  background-color: #d9534f;
  box-shadow: 0 0 0 4px rgba(217, 83, 79, 0.16);
}

.overview-item strong {
  font-size: 18px;
  color: #22354d;
}

.overview-item:nth-child(1) strong {
  color: #b35c10;
}

.overview-item:nth-child(2) strong {
  color: #1e7a58;
}

.overview-item:nth-child(3) strong {
  color: #b03a34;
}

.text-button {
  border: none;
  background: none;
  color: #f28c28;
  font-family: inherit;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
}

.text-button:hover {
  text-decoration: underline;
}

/* PAYMENTS PANEL */
.section-subtitle {
  margin: 18px 0 6px;
  font-size: 13px;
  font-weight: bold;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #8a94a3;
}

.section-subtitle.spaced {
  margin-top: 26px;
}

.unpaid-columns {
  grid-template-columns: 1.5fr 1.3fr 1.1fr 0.9fr 0.8fr 0.9fr 0.8fr;
  min-width: 900px;
}

.row-actions-cell {
  justify-self: end;
}

.pay-now-button {
  background: linear-gradient(135deg, #f5a24a 0%, #ef7d13 100%);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 7px 14px;
  font-family: inherit;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 3px 10px rgba(239, 125, 19, 0.28);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.pay-now-button:hover {
  background: linear-gradient(135deg, #2c3e50 0%, #3d566e 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(44, 62, 80, 0.25);
}

.settled-note {
  padding: 16px;
  background: linear-gradient(135deg, #e6f4ec 0%, #d5efe2 100%);
  border: 1px solid #b7e4cd;
  border-radius: 10px;
  color: #1e7a58;
  font-size: 13px;
}

/* PAY MODAL */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(44, 62, 80, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 20px;
}

.modal {
  width: 100%;
  max-width: 860px;
  max-height: 90vh;
  overflow-y: auto;
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-sizing: border-box;
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 16px;
}

.modal-head h3 {
  margin: 0;
  font-size: 20px;
  color: #062b67;
  font-weight: 700;
}

.back-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background-color: white;
  color: #062b67;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: auto;
}

.close-x {
  border: none;
  background: none;
  font-size: 22px;
  line-height: 1;
  color: #8a94a3;
  cursor: pointer;
}

.close-x:hover {
  color: #2c3e50;
}

.modal-error {
  margin: 12px 0;
  color: #c0392b;
  font-size: 12px;
}

.modal-body-layout {
  display: flex;
  gap: 16px;
}

.modal-left, .modal-right {
  flex: 1;
  min-width: 0;
}

.payment-card {
  background-color: white;
  border: 1px solid #e3e9f2;
  border-top: 3px solid #f28c28;
  border-radius: 15px;
  padding: 22px;
  margin-bottom: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

.section-title {
  color: #062b67;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 18px;
}

.booking-info {
  background-color: #f1f1f1;
  border-radius: 10px;
  padding: 15px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;
  font-size: 13px;
}

.info-row:last-child { margin-bottom: 0; }
.info-label { color: #777; }
.info-value { font-weight: 600; text-align: right; }

.session-badge {
  background-color: #e4edff;
  color: #062b67;
  border-radius: 20px;
  padding: 5px 12px;
  font-size: 11px;
  font-weight: 600;
}

.price-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 10px;
}

.price-label { color: #777; }
.price-value { font-weight: 600; }

.price-summary {
  border-top: 1px solid #ddd;
  padding-top: 18px;
  margin-top: 20px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-label { font-size: 15px; font-weight: 700; }

.total-amount {
  color: #062b67;
  font-size: 22px;
  font-weight: 700;
}

.payment-option {
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: 0.2s;
}

.payment-option:hover { border-color: #2563eb; }

.payment-option.selected {
  border: 2px solid #2563eb;
  background-color: #f4f7ff;
}

.payment-option-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.payment-option input { accent-color: #062b67; }

.payment-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: #e9efff;
  color: #062b67;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
}

.payment-option-title { font-size: 14px; font-weight: 600; }
.payment-option-text { font-size: 11px; color: #777; margin: 2px 0 0; }

.in-person-info {
  background-color: #f4f7ff;
  border-radius: 10px;
  padding: 15px;
  margin-top: 18px;
}

.info-flex {
  display: flex;
  gap: 12px;
}

.in-person-info i { color: #2563eb; font-size: 22px; }
.in-person-info h6 { color: #062b67; font-size: 14px; font-weight: 700; margin: 0 0 4px; }
.in-person-info p { color: #666; font-size: 12px; margin: 0; line-height: 1.5; }

.card-details { margin-top: 20px; }

.form-label { font-size: 12px; font-weight: 600; margin-bottom: 6px; }

.form-control {
  background-color: #f1f1f1;
  border: none;
  border-radius: 8px;
  padding: 11px;
  font-size: 13px;
  width: 100%;
  box-sizing: border-box;
}

.form-control:focus {
  background-color: #f1f1f1;
  border: 1px solid #2563eb;
  box-shadow: none;
  outline: none;
}

.mb-3 { margin-bottom: 12px; }

.row { display: flex; gap: 12px; }
.col-6 { flex: 1; }

.payment-btn {
  width: 100%;
  border: none;
  border-radius: 8px;
  background-color: #062b67;
  color: white;
  padding: 13px;
  margin-top: 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.payment-btn:hover { background-color: #041f4d; }
.payment-btn:disabled { opacity: 0.7; cursor: not-allowed; }

.secure-text {
  text-align: center;
  color: #888;
  font-size: 11px;
  margin-top: 12px;
}

@media (max-width: 767px) {
  .modal { max-width: 480px; }
  .modal-body-layout { flex-direction: column; }
}

@media (max-width: 1050px) {

  .dashboard-row {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {

  .action-buttons {
    grid-template-columns: 1fr;
  }
}
</style>
