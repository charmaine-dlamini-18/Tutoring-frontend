<template>
    <div class="page-layout">

        <main class="page-content" :class="{ narrow: mode === 'form' }">

            <!-- FORM MODE -->
            <template v-if="mode === 'form'">

                <section class="page-header">
                    <div>
                        <p class="header-label">SESSIONS</p>
                        <h1>Book Session</h1>
                        <p class="header-description">
                            Pick a tutor, subject and time that suits you.
                        </p>
                    </div>
                </section>

                <div class="dashboard-card form-card">

                    <div class="card-header">
                        <div>
                            <h2>Make a Tutoring Booking</h2>
                            <p>Your session will be confirmed immediately</p>
                        </div>
                    </div>

                    <form @submit.prevent="createNewBooking">
                        <div class="grid-2">
                            <label>Subject
                                <select v-model="bookingForm.subjectCode" required>
                                    <option value="" disabled>Select a subject</option>
                                    <option v-for="s in subjects" :key="s.subjectCode" :value="s.subjectCode">
                                        {{ s.subjectName }} ({{ s.subjectCode }})
                                    </option>
                                </select>
                            </label>
                            <label>Tutor
                                <select v-model="bookingForm.tutorId" required>
                                    <option value="" disabled>Select a tutor</option>
                                    <option v-for="t in availableTutors" :key="t.tutorId" :value="t.tutorId">
                                        {{ t.firstName }} {{ t.lastName }} &mdash; {{ fmtR(t.hourlyRate) }}/hr
                                    </option>
                                </select>
                            </label>
                            <label>Session Type
                                <select v-model="bookingForm.sessionType" required>
                                    <option value="" disabled>Select type</option>
                                    <option>Online</option>
                                    <option>In-person</option>
                                </select>
                            </label>
                            <label>Duration
                                <select v-model="bookingForm.duration" required>
                                    <option value="" disabled>Select duration</option>
                                    <option value="30">30 minutes</option>
                                    <option value="60">60 minutes</option>
                                    <option value="90">90 minutes</option>
                                    <option value="120">120 minutes</option>
                                </select>
                            </label>
                        </div>
                        <div class="slot-section">
                            <div class="booking-calendar">
                                <div class="calendar-head">
                                    <button
                                        type="button"
                                        class="calendar-nav"
                                        aria-label="Previous month"
                                        @click="changeMonth(-1)"
                                    >
                                        &lsaquo;
                                    </button>

                                    <strong>{{ calendarLabel }}</strong>

                                    <button
                                        type="button"
                                        class="calendar-nav"
                                        aria-label="Next month"
                                        @click="changeMonth(1)"
                                    >
                                        &rsaquo;
                                    </button>
                                </div>

                                <div class="calendar-weekdays">
                                    <span v-for="day in weekdays" :key="day">{{ day }}</span>
                                </div>

                                <div class="calendar-grid">
                                    <button
                                        v-for="cell in calendarDays"
                                        :key="cell.key"
                                        type="button"
                                        class="calendar-day"
                                        :class="{
                                            muted: !cell.inMonth,
                                            available: cell.available,
                                            selected: cell.selected,
                                            today: cell.today,
                                            unavailable: cell.unavailable
                                        }"
                                        :title="cell.unavailable ? 'Tutor is not available on this day' : ''"
                                        :disabled="!cell.available"
                                        @click="selectDate(cell)"
                                    >
                                        {{ cell.day }}
                                    </button>
                                </div>

                                <p v-if="!bookingForm.tutorId" class="slot-hint">
                                    Select a tutor to see the dates they are available.
                                </p>

                                <p v-else class="calendar-legend">
                                    <span class="legend-item">
                                        <span class="legend-dot"></span>
                                        Highlighted dates have open slots
                                    </span>
                                    <span class="legend-item">
                                        <span class="legend-dot unavailable"></span>
                                        Greyed dates are not available
                                    </span>
                                </p>
                            </div>

                            <div class="slot-picker">
                                <p class="slot-title">
                                    Available Time Slots
                                    <span v-if="selectedDateLabel" class="selected-date-label">
                                        &middot; {{ selectedDateLabel }}
                                    </span>
                                </p>

                                <p v-if="!bookingForm.tutorId || !bookingForm.duration" class="slot-hint">
                                    Select a tutor and duration to see available times.
                                </p>

                                <p v-else-if="!bookingForm.date" class="slot-hint">
                                    Pick an available date to see time slots.
                                </p>

                                <p v-else-if="!availableSlots.length" class="slot-hint empty">
                                    No available slots for this date. Try another date or duration.
                                </p>

                                <div v-else class="slot-grid">
                                    <button
                                        v-for="slot in availableSlots"
                                        :key="slot.start"
                                        type="button"
                                        class="slot-chip"
                                        :class="{ selected: bookingForm.startTime === slot.start }"
                                        @click="selectSlot(slot)"
                                    >
                                        {{ slot.start }} &ndash; {{ slot.end }}
                                    </button>
                                </div>
                            </div>
                        </div>

                         <p v-if="availabilityMessage" class="availability-message">
                           {{ availabilityMessage }}
                         </p>
                        <div v-if="estimatedCost !== null" class="cost-estimate">
                            Estimated cost <strong>{{ fmtR(estimatedCost) }}</strong>
                        </div>
                        <button type="submit" class="submit-button block" :disabled="loading">
                            {{ loading ? 'Booking...' : 'Confirm Booking' }}
                        </button>
                    </form>

                </div>

            </template>

            <!-- LIST MODE -->
            <template v-else>

                <section class="page-header">
                    <div>
                        <p class="header-label">SESSIONS</p>
                        <h1>My Bookings</h1>
                        <p class="header-description">
                            Manage your upcoming sessions and payments.
                        </p>
                    </div>

                    <button
                    type="button"
                    class="nav-action-button"
                    @click="changePage('book')"
                    >
                        + New Booking
                    </button>
                </section>

                <div class="dashboard-card">

                    <div class="card-header">
                        <div>
                            <h2>Upcoming Bookings</h2>
                            <p>Sessions you have scheduled</p>
                        </div>
                    </div>

                    <div v-if="!upcomingBookings.length" class="empty-state">
                        <div class="empty-circle">—</div>

                        <h3>Nothing scheduled yet</h3>

                        <p>Book a session with one of our tutors and it will show up here.</p>

                        <button
                        class="outline-button book-cta"
                        @click="changePage('book')"
                        >
                            Book Your First Session
                        </button>
                    </div>

                    <div v-else class="table-scroll">

                        <div class="table-header booking-columns">
                            <span>When</span>
                            <span>Subject</span>
                            <span>Tutor</span>
                            <span>Type</span>
                            <span>Duration</span>
                            <span>Status</span>
                            <span></span>
                        </div>

                        <div
                            v-for="b in upcomingBookings"
                            :key="b.bookingId"
                            class="table-row booking-columns"
                        >
                            <span class="cell-strong">{{ formatDate(b.date) }}</span>
                            <span>{{ subjectName(b.subjectCode) }}</span>
                            <span>{{ tutorName(b) }}</span>
                            <span>{{ b.sessionType }}</span>
                            <span>{{ b.duration }} min</span>
                            <span :class="['status-chip', b.payment ? 'paid' : 'unpaid']">
                                {{ b.payment ? 'Paid' : 'Unpaid' }}
                            </span>
                            <span class="row-actions">
                                <button
                                    v-if="!b.payment"
                                    type="button"
                                    class="small-button"
                                    @click="openPay(b)"
                                >
                                    Pay Now
                                </button>
                                <button
                                    type="button"
                                    class="small-button danger-outline"
                                    @click="cancelBooking(b)"
                                >
                                    Cancel
                                </button>
                            </span>
                        </div>

                    </div>

                </div>

                <p v-if="error" class="error" style="margin: 8px 0">{{ error }}</p>

                <div class="dashboard-card">

                    <div class="card-header">
                        <div>
                            <h2>Past Bookings</h2>
                            <p>Completed and archived sessions</p>
                        </div>
                    </div>

                    <div v-if="!pastBookings.length" class="empty-state slim">
                        <p class="muted">Completed sessions will be archived here.</p>
                    </div>

                    <div v-else class="table-scroll">

                        <div class="table-header booking-columns">
                            <span>When</span>
                            <span>Subject</span>
                            <span>Tutor</span>
                            <span>Type</span>
                            <span>Duration</span>
                            <span>Status</span>
                            <span></span>
                        </div>

                        <div
                            v-for="b in pastBookings"
                            :key="b.bookingId"
                            class="table-row booking-columns row-dim"
                        >
                            <span class="cell-strong">{{ formatDate(b.date) }}</span>
                            <span>{{ subjectName(b.subjectCode) }}</span>
                            <span>{{ tutorName(b) }}</span>
                            <span>{{ b.sessionType }}</span>
                            <span>{{ b.duration }} min</span>
                            <span :class="['status-chip', b.payment ? 'paid' : 'unpaid']">
                                {{ b.payment ? 'Paid' : 'Unpaid' }}
                            </span>
                            <span class="row-actions">
                                <button
                                    v-if="!b.payment"
                                    type="button"
                                    class="small-button"
                                    @click="openPay(b)"
                                >
                                    Pay Now
                                </button>
                            </span>
                        </div>

                    </div>

                    <div v-if="cancelledBookings.length" class="table-scroll">
                        <div class="table-header booking-columns">
                            <span>When</span>
                            <span>Subject</span>
                            <span>Tutor</span>
                            <span>Type</span>
                            <span>Duration</span>
                            <span>Status</span>
                            <span></span>
                        </div>

                        <div
                            v-for="b in cancelledBookings"
                            :key="b.bookingId"
                            class="table-row booking-columns row-dim"
                        >
                            <span class="cell-strong">{{ formatDate(b.cancelledAt || b.date) }}</span>
                            <span>{{ subjectName(b.subjectCode) }}</span>
                            <span>{{ tutorName(b) }}</span>
                            <span>{{ b.sessionType }}</span>
                            <span>{{ b.duration }} min</span>
                            <span class="status-chip cancelled">Cancelled</span>
                            <span class="row-actions"></span>
                        </div>
                    </div>

                </div>

            </template>

        </main>

        <!-- To pay for a booking -->
        <transition name="pop">
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

                                <button class="payment-btn" :disabled="loading" @click="confirmPay">
                                    <span v-if="loading"><span class="spinner-border spinner-border-sm me-2"></span>Processing...</span>
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

    </div>
</template>

<script>
import { getSession } from '@/services/authService'
import { createBooking, deleteBooking } from '@/services/bookingService'
import { createPayment } from '@/services/paymentService'
import { getCancelledBookingsForStudent } from '@/services/cancelledBookingService'

const STANDARD_START = "08:30"
const STANDARD_END = "18:00"

export default {
    name: "StudentBookings",

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

        tutorSubjects: {
            type: Array,
            default: () => []
        },

        mode: {
            type: String,
            default: "list"
        },

        selectedTutorId: {
            type: String,
            default: ""
        }
    },

    data() {
        return {
            loading: false,
            error: "",
            modalError: "",
            availabilityMessage: "",
            session: getSession(),
            payTarget: null,
            paymentForm: { amount: 0, paymentMethod: "" },
            cardName: "",
            cardNumber: "",
            expiryDate: "",
            cvv: "",
            calendarYear: new Date().getFullYear(),
            calendarMonthIndex: new Date().getMonth(),
            availabilityVersion: 0,
            cancelledVersion: 0,
            bookingForm: { tutorId: '', subjectCode: '', sessionType: '', duration: '', date: '', startTime: '' }
        }
    },

    computed: {
        myBookings() {
            return this.me.bookings || []
        },

        // bookings with a date in the future, soonest first
        upcomingBookings() {
            const now = Date.now()
            return this.myBookings
                .filter(b => new Date(b.date).getTime() >= now)
                .sort((a, b) => new Date(a.date) - new Date(b.date))
        },

        // bookings already done, newest first
        pastBookings() {
            const now = Date.now()
            return this.myBookings
                .filter(b => new Date(b.date).getTime() < now)
                .sort((a, b) => new Date(b.date) - new Date(a.date))
        },

        // cancelled bookings for this student (deleted by tutor or admin),
        // shown in history with a "Cancelled" status
        cancelledBookings() {
            void this.cancelledVersion
            const studentNumber = this.me.studentNumber || this.session?.id || ''
            return getCancelledBookingsForStudent(studentNumber)
                .sort((a, b) => {
                    const da = a.cancelledAt ? new Date(a.cancelledAt).getTime() : 0
                    const db = b.cancelledAt ? new Date(b.cancelledAt).getTime() : 0
                    return db - da
                })
        },

        // live price based on the tutors rate and the minutes picked
        estimatedCost() {
            const tutor = this.tutors.find(t => t.tutorId === this.bookingForm.tutorId)
            if (!tutor || !this.bookingForm.duration) return null
            return (Number(tutor.hourlyRate || 0) * Number(this.bookingForm.duration)) / 60
        },

        // tutors who teach the selected subject, or all tutors if none selected
        availableTutors() {
            if (!this.bookingForm.subjectCode) return this.tutors
            const tutorIds = this.tutorSubjects
                .filter(ts => ts.subjectCode === this.bookingForm.subjectCode)
                .map(ts => ts.tutorId)
            return this.tutors.filter(t => tutorIds.includes(t.tutorId))
        },

        calendarLabel() {
            return new Date(this.calendarYear, this.calendarMonthIndex, 1)
                .toLocaleDateString("en-ZA", {
                    month: "long",
                    year: "numeric"
                })
        },

        weekdays() {
            return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        },

        // the 6 week grid for the visible month. Dates are only clickable when
        // the tutor has availability and, once a duration is picked, at least
        // one session of that length still fits.
        calendarDays() {
            const first = new Date(
                this.calendarYear,
                this.calendarMonthIndex,
                1
            )

            const gridStart = new Date(
                this.calendarYear,
                this.calendarMonthIndex,
                1 - first.getDay()
            )

            const todayKey = this.dateKey(new Date())
            const days = []

            for (let i = 0; i < 42; i++) {
                const d = new Date(
                    gridStart.getFullYear(),
                    gridStart.getMonth(),
                    gridStart.getDate() + i
                )

                const key = this.dateKey(d)

                days.push({
                    key,
                    day: d.getDate(),
                    inMonth: d.getMonth() === this.calendarMonthIndex,
                    today: key === todayKey,
                    available: this.isDateAvailable(key),
                    unavailable: this.isDateMarkedUnavailable(key),
                    selected: key === this.bookingForm.date
                })
            }

            return days
        },

        selectedDateLabel() {
            if (!this.bookingForm.date) return ""

            return this.parseDateKey(this.bookingForm.date)
                .toLocaleDateString("en-ZA", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                })
        },

        // every bookable time on the chosen date, filtered by the tutor's
        // availability and sessions already on their calendar
        availableSlots() {
            const { date, duration } = this.bookingForm

            if (!date || !duration) return []

            return this.buildSlotsForDate(date, Number(duration))
        }
    },

    watch: {
        // fills the tutor in automatically when you came from a "book with" button
        selectedTutorId: {
            immediate: true,
            handler(value) {
                if (value) {
                    this.bookingForm.tutorId = value
                }
            }
        },

        // when a subject is picked, auto-fill the tutor if one teaches it
        // but keep a tutor that was already chosen (for example from "Book with")
        'bookingForm.subjectCode'(code) {
            if (!code) return

            const current = this.bookingForm.tutorId
            const currentTeaches = this.tutorSubjects.some(
                ts => ts.subjectCode === code && String(ts.tutorId) === String(current)
            )

            if (current && currentTeaches) return

            const match = this.tutorSubjects.find(ts => ts.subjectCode === code)
            this.bookingForm.tutorId = match ? match.tutorId : ''
        },
        'bookingForm.tutorId'() {
            this.bookingForm.date = ''
            this.bookingForm.startTime = ''
            this.availabilityMessage = ''
            this.focusCalendarOnFirstAvailable()
        },
        'bookingForm.date'() {
            this.bookingForm.startTime = ''
            this.availabilityMessage = ''
        },
        'bookingForm.duration'() {
            this.bookingForm.startTime = ''
            this.availabilityMessage = ''

            if (
                this.bookingForm.date &&
                !this.isDateAvailable(this.bookingForm.date)
            ) {
                this.bookingForm.date = ''
            }
        }
    },

    mounted() {
        window.addEventListener('tutor-availability-updated', this.refreshAvailability)
        window.addEventListener('storage', this.handleStorageChange)
        window.addEventListener('cancelled-bookings-updated', this.refreshCancelled)
    },

    beforeDestroy() {
        window.removeEventListener('tutor-availability-updated', this.refreshAvailability)
        window.removeEventListener('storage', this.handleStorageChange)
        window.removeEventListener('cancelled-bookings-updated', this.refreshCancelled)
    },

    methods: {
        refreshAvailability() {
            this.availabilityVersion += 1
        },

        refreshCancelled() {
            this.cancelledVersion += 1
        },

        handleStorageChange(event) {
            if (
                event.key &&
                event.key.startsWith('tutorUnavailableDates_')
            ) {
                this.refreshAvailability()
            }
        },

        changePage(page) {
            this.$emit("change-page", page)
        },

        notify(type, message) {
            this.$emit("notify", { type, message })
        },

        fmtR(value) {
            return `R${Number(value || 0).toFixed(2)}`
        },

        subjectName(code) {
            const s = this.subjects.find(x => x.subjectCode === code)
            return s ? s.subjectName : code
        },

        tutorForBooking(booking) {
            if (!booking) return null
            const direct = this.tutors.find(
                t => String(t.tutorId) === String(booking.tutorId)
            )
            if (direct) return direct
            for (const t of this.tutors) {
                if ((t.bookings || []).some(b => b.bookingId === booking.bookingId)) {
                    return t
                }
            }
            return null
        },

        tutorName(booking) {
            const target = typeof booking === 'string'
                ? this.myBookings.find(b => String(b.bookingId) === String(booking))
                : booking
            const tutor = this.tutorForBooking(target)
            return tutor ? `${tutor.firstName} ${tutor.lastName}` : 'Unknown'
        },

        formatDate(value) {
            if (!value) return '-'
            return new Date(value).toLocaleString('en-ZA', {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })
        },

        // reads the tutor's explicitly marked unavailable dates from the tutor
        // record fetched from the backend, so a date a tutor marks unavailable
        // is greyed out for every student (not just the browser that saved it).
        // also checks localStorage as a same-browser fallback. touches
        // availabilityVersion so Vue tracks it as a dependency of calendarDays
        // and recomputes when availability changes.
        getTutorAvailability(tutorId) {
          if (!tutorId) return []

          void this.availabilityVersion

          const fromTutors = []
          const tutor = this.tutors.find(
            t => String(t.tutorId) === String(tutorId)
          )
          if (tutor && Array.isArray(tutor.unavailableDates)) {
            fromTutors.push(
              ...tutor.unavailableDates.filter(entry => entry && entry.date)
            )
          }

          let fromStorage = []
          try {
            const saved = JSON.parse(
              localStorage.getItem(`tutorUnavailableDates_${tutorId}`) || "[]"
            )
            fromStorage = Array.isArray(saved)
              ? saved.filter(entry => entry && entry.date)
              : []
          } catch {
            fromStorage = []
          }

          const seen = new Set()
          const merged = []
          for (const entry of [...fromTutors, ...fromStorage]) {
            if (!entry || !entry.date || seen.has(entry.date)) continue
            seen.add(entry.date)
            merged.push(entry)
          }
          return merged
        },

        // the sessions the tutor already has booked on the backend
        getTutorBookings(tutorId) {
            const tutor = this.tutors.find(
                t => String(t.tutorId) === String(tutorId)
            )
            return tutor && Array.isArray(tutor.bookings) ? tutor.bookings : []
        },

        dateKey(value) {
            const year = value.getFullYear()
            const month = String(value.getMonth() + 1).padStart(2, "0")
            const day = String(value.getDate()).padStart(2, "0")

            return `${year}-${month}-${day}`
        },

        // true when the tutor explicitly marked that day as unavailable
        isDateMarkedUnavailable(dateKey) {
            const { tutorId } = this.bookingForm

            if (!tutorId) return false

            return this.getTutorAvailability(tutorId).some(
                entry => String(entry.date).split("T")[0] === dateKey
            )
        },

        // the tutor's working windows for one date. Tutors are available every
        // weekday 08:30 - 18:00 unless they marked that specific day unavailable.
        getAvailabilityWindows(dateKey) {
            const { tutorId } = this.bookingForm

            if (!tutorId) return []

            const selected = this.parseDateKey(dateKey)
            const day = selected.getDay()

            if (day === 0 || day === 6) return []
            if (this.isDateMarkedUnavailable(dateKey)) return []

            return [{ startTime: STANDARD_START, endTime: STANDARD_END }]
        },

        // builds the free start times for a date, removing anything that is in
        // the past or overlaps a session already booked on the tutor.
        buildSlotsForDate(dateKey, durationMinutes) {
            if (!dateKey || !durationMinutes) return []

            const windows = this.getAvailabilityWindows(dateKey)
            if (!windows.length) return []

            const bookings = this.getTutorBookings(this.bookingForm.tutorId)
            const step = 30
            const now = Date.now()
            const seen = new Set()
            const slots = []

            for (const window of windows) {
                const windowStart = this.timeToMinutes(window.startTime)
                const windowEnd = this.timeToMinutes(window.endTime)

                if (windowStart === null || windowEnd === null) continue

                for (
                    let start = windowStart;
                    start + durationMinutes <= windowEnd;
                    start += step
                ) {
                    const startKey = this.minutesToTime(start)

                    if (seen.has(startKey)) continue

                    const startDate = this.parseDateKey(dateKey)
                    startDate.setHours(
                        Math.floor(start / 60),
                        start % 60,
                        0,
                        0
                    )

                    const startMs = startDate.getTime()
                    if (startMs <= now) continue

                    const endMs = startMs + durationMinutes * 60000

                    const conflict = bookings.some(booking => {
                        if (!booking.date) return false

                        const bookedStart = new Date(booking.date).getTime()
                        if (Number.isNaN(bookedStart)) return false

                        const bookedEnd =
                            bookedStart +
                            Number(booking.duration || 60) * 60000

                        return startMs < bookedEnd && endMs > bookedStart
                    })

                    if (conflict) continue

                    seen.add(startKey)
                    slots.push({
                        start: startKey,
                        end: this.minutesToTime(start + durationMinutes)
                    })
                }
            }

            return slots
        },

        isDateAvailable(dateKey) {
            const { tutorId, duration } = this.bookingForm

            if (!tutorId) return false

            const selected = this.parseDateKey(dateKey)
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            if (selected.getTime() < today.getTime()) return false

            if (!this.getAvailabilityWindows(dateKey).length) return false

            const durationMinutes = Number(duration)
            if (!durationMinutes) return true

            return this.buildSlotsForDate(dateKey, durationMinutes).length > 0
        },

        changeMonth(delta) {
            const next = new Date(
                this.calendarYear,
                this.calendarMonthIndex + delta,
                1
            )

            this.calendarYear = next.getFullYear()
            this.calendarMonthIndex = next.getMonth()
        },

        selectDate(cell) {
            if (!cell.available) return

            this.bookingForm.date = cell.key
        },

        // jumps the calendar to the first weekday the tutor is not unavailable
        focusCalendarOnFirstAvailable() {
            const tutorId = this.bookingForm.tutorId
            if (!tutorId) return

            const today = new Date()
            today.setHours(0, 0, 0, 0)

            const unavailable = new Set(
                this.getTutorAvailability(tutorId).map(
                    entry => String(entry.date).split("T")[0]
                )
            )

            let target = today

            for (let i = 0; i < 90; i++) {
                const date = new Date(
                    today.getFullYear(),
                    today.getMonth(),
                    today.getDate() + i
                )

                const day = date.getDay()
                if (day === 0 || day === 6) continue
                if (unavailable.has(this.dateKey(date))) continue

                target = date
                break
            }

            this.calendarYear = target.getFullYear()
            this.calendarMonthIndex = target.getMonth()
        },

        parseDateKey(value) {
            const [year, month, day] = String(value).split("-").map(Number)
            return new Date(year, month - 1, day)
        },

        timeToMinutes(value) {
            const [hours, minutes] = String(value || "").split(":").map(Number)

            if (Number.isNaN(hours) || Number.isNaN(minutes)) return null

            return hours * 60 + minutes
        },

        minutesToTime(totalMinutes) {
            const hours = Math.floor(totalMinutes / 60)
            const minutes = totalMinutes % 60

            return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
        },

        selectSlot(slot) {
            this.bookingForm.startTime = slot.start
            this.availabilityMessage = ""
        },

        checkTutorAvailability() {
            this.availabilityMessage = ""

            const { tutorId, date, duration, startTime } = this.bookingForm

            if (!tutorId || !date || !duration) {
                this.availabilityMessage = "Please select a tutor, date and duration."
                return false
            }

            if (Number.isNaN(this.parseDateKey(date).getTime())) {
                this.availabilityMessage = "Please select a valid date."
                return false
            }

            if (!startTime) {
                this.availabilityMessage = "Please select an available time slot."
                return false
            }

            // The available slots already account for the tutor's working
            // hours and sessions that are booked. If the chosen time is not
            // in that list it has just been taken or is outside availability.
            const slot = this.availableSlots.find(
                item => item.start === startTime
            )

            if (!slot) {
                this.availabilityMessage =
                    "That time is no longer available. Please choose another slot."
                return false
            }

            return true
        },

        // checks the date, saves the booking then jumps back to the list
        async createNewBooking() {
            if (!this.checkTutorAvailability()) {
                return;
            }

            const { tutorId, date, startTime } = this.bookingForm
            const start = this.parseDateKey(date)
            const [hours, minutes] = startTime.split(":").map(Number)
            start.setHours(hours, minutes, 0, 0)

            if (start.getTime() <= Date.now()) {
                this.notify('error', 'Please choose a future date and time.')
                return
            }

            this.loading = true
            try {
                const bookingId = `BK-${Date.now()}`
                const created = await createBooking({
                    bookingId,
                    subjectCode: this.bookingForm.subjectCode,
                    sessionType: this.bookingForm.sessionType,
                    duration: String(this.bookingForm.duration),
                    date: `${date}T${startTime}:00`
                }, tutorId)

                this.bookingForm = { tutorId: '', subjectCode: '', sessionType: '', duration: '', date: '', startTime: '' }
                this.$emit("refresh")
                this.notify('success', 'Booking confirmed! Please complete your payment.')
                this.$emit("open-payment", {
                    bookingId: (created && created.bookingId) || bookingId
                })
            } catch (e) {
                this.notify('error', e.message)
            } finally {
                this.loading = false
            }
        },

        // opens the pay pop up and works out the amount from the tutors rate
        openPay(booking) {
            this.modalError = ""
            this.cardName = ""
            this.cardNumber = ""
            this.expiryDate = ""
            this.cvv = ""
            const tutor = this.tutorForBooking(booking)
            const hours = Number(booking.duration || 60) / 60
            this.paymentForm.amount = tutor ? Number((Number(tutor.hourlyRate || 0) * hours).toFixed(2)) : 0
            this.paymentForm.paymentMethod = this.isInPerson(booking.sessionType) ? "CASH" : "Card"
            this.payTarget = booking
        },

        tutorHourlyRate(booking) {
            const tutor = this.tutorForBooking(booking)
            return tutor ? Number(tutor.hourlyRate || 0) : 0
        },

        closePay() {
            this.payTarget = null
            this.modalError = ""
        },

        // double checks with the student first, then cancels on the backend
        async cancelBooking(booking) {
            if (!window.confirm(`Cancel your ${this.subjectName(booking.subjectCode)} booking on ${this.formatDate(booking.date)}?`)) return

            this.error = ""
            try {
                await deleteBooking(booking.bookingId)
                this.$emit("refresh")
                this.notify('success', 'Booking cancelled.')
            } catch (e) {
                this.error = e.message
            }
        },

        // sends the payment through to the backend
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
            this.loading = true
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
                this.notify('success', 'Payment successful!')
            } catch (e) {
                this.modalError = e.message
            } finally {
                this.loading = false
            }
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
.page-layout {
  display: flex;
  min-height: 100vh;
  background-color: #f7f8fa;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  color: #2c3e50;
  text-align: left;
}

.page-content {
  flex: 1;
  padding: 30px;
  box-sizing: border-box;
}

.page-content.narrow {
  max-width: none;
  width: 100%;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  flex-wrap: wrap;
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

.page-header h1 {
  font-size: 30px;
  margin: 0;
}

.header-description {
  color: #d7dde3;
  font-size: 14px;
  margin: 7px 0 0;
}

.dashboard-card {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 22px;
  margin-bottom: 22px;
}

.form-card {
  border-top: 4px solid #f28c28;
  padding: 26px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 14px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 8px;
}

.card-header h2 {
  font-size: 17px;
  margin: 0;
}

.card-header p {
  color: #8a94a3;
  font-size: 12px;
  margin: 4px 0 0;
}

/* TABLES */
.table-scroll {
  overflow-x: auto;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 1.5fr 1.4fr 1.1fr 1fr 0.9fr 0.9fr 1.4fr;
  padding: 12px 5px;
  align-items: center;
  min-width: 820px;
}

.table-header {
  color: #8a94a3;
  font-size: 10px;
  font-weight: bold;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.table-row {
  border-top: 1px solid #edf1f5;
  font-size: 13px;
}

.row-dim {
  color: #8a94a3;
}

.cell-strong {
  font-weight: bold;
}

.row-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-wrap: wrap;
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

.status-chip.cancelled {
  background: #efeaea;
  color: #a12c1e;
}

/* EMPTY STATES */
.empty-state {
  min-height: 160px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.empty-state.slim {
  min-height: 80px;
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
  color: #8a94a3;
  font-size: 12px;
  margin: 0;
}

.muted {
  color: #8a94a3;
}

.book-cta {
  width: auto;
  margin-top: 16px;
  padding: 10px 18px;
}

.outline-button {
  background-color: #ffffff;
  color: #b35c10;
  border: 1px solid #f28c28;
  border-radius: 7px;
  padding: 12px 18px;
  font-family: inherit;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
}

.outline-button:hover {
  background-color: #fff7ef;
}

/* BUTTONS */
.nav-action-button {
  background-color: rgba(255, 255, 255, 0.14);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 7px;
  padding: 11px 22px;
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

.nav-action-button:hover {
  background-color: #f28c28;
  border-color: #f28c28;
}

.small-button {
  background-color: #2c3e50;
  color: #ffffff;
  border: none;
  border-radius: 7px;
  padding: 7px 13px;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
}

.small-button:hover {
  background-color: #f28c28;
}

.small-button.danger-outline {
  background-color: #ffffff;
  color: #c0392b;
  border: 1px solid #e0a9a2;
}

.small-button.danger-outline:hover {
  background-color: #fbeae8;
}

.submit-button {
  background-color: #2c3e50;
  color: #ffffff;
  border: none;
  border-radius: 7px;
  padding: 12px 18px;
  font-family: inherit;
  font-size: 14px;
  cursor: pointer;
}

.submit-button:hover {
  background-color: #f28c28;
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.submit-button.block {
  display: block;
  width: 100%;
  margin-top: 6px;
}

.error {
  color: #c0392b;
  font-size: 13px;
  margin: 0 0 12px;
}

/* FORM */
form {
  margin-top: 20px;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 600px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
}

label {
  display: flex;
  flex-direction: column;
  gap: 7px;
  font-size: 13px;
  font-weight: bold;
  color: #55657a;
  text-align: left;
  margin-bottom: 16px;
}

input,
select {
  padding: 11px 13px;
  border: 1px solid #c5cfdc;
  border-radius: 7px;
  font-size: 14px;
  font-weight: normal;
  font-family: inherit;
  color: #2c3e50;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

input:focus,
select:focus {
  outline: none;
  border-color: #f28c28;
  box-shadow: 0 0 0 3px rgba(242, 140, 40, 0.18);
}

.cost-estimate {
  background: #fff3e7;
  border: 1px solid #f9d4ae;
  color: #b35c10;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 14px;
  margin-bottom: 18px;
}

/* MODAL */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(23, 37, 51, 0.55);
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
  font-family: inherit;
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

/* TRANSITIONS */
.pop-enter-active {
  transition: opacity 0.2s ease;
}

.pop-enter-active .modal {
  transition: transform 0.2s ease-out;
}

.pop-enter,
.pop-leave-to {
  opacity: 0;
}

.pop-enter .modal {
  transform: scale(0.92) translateY(10px);
}
.slot-section {
  margin-bottom: 18px;
}

.booking-calendar {
  background: #ffffff;
  border: 1px solid #e3e9f2;
  border-radius: 9px;
  padding: 14px 16px;
  margin-bottom: 14px;
}

.calendar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.calendar-head strong {
  font-size: 14px;
  color: #22354d;
}

.calendar-nav {
  width: 30px;
  height: 30px;
  border: 1px solid #c5cfdc;
  border-radius: 6px;
  background: #ffffff;
  color: #2c3e50;
  font-family: inherit;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}

.calendar-nav:hover {
  border-color: #f28c28;
  color: #b35c10;
}

.calendar-weekdays,
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.calendar-weekdays span {
  text-align: center;
  padding: 4px 0;
  color: #8a94a3;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
}

.calendar-day {
  min-height: 36px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: #f3f5f8;
  color: #b7c0cc;
  font-family: inherit;
  font-size: 12px;
  cursor: not-allowed;
}

.calendar-day.muted {
  opacity: 0.4;
}

.calendar-day.unavailable {
  background: #e9edf2;
  border-color: #d9dfe7;
  color: #a3adba;
  text-decoration: line-through;
  cursor: not-allowed;
}

.calendar-day.unavailable:hover {
  border-color: #d9dfe7;
}

.calendar-day.available {
  background: #eaf6f0;
  border-color: #c8e9d8;
  color: #1e7d54;
  font-weight: 600;
  cursor: pointer;
}

.calendar-day.available:hover {
  border-color: #42b983;
}

.calendar-day.selected {
  background: #2c3e50;
  border-color: #2c3e50;
  color: #ffffff;
}

.calendar-day.today {
  box-shadow: inset 0 0 0 1px #f28c28;
}

.calendar-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  margin: 10px 0 0;
  color: #8a94a3;
  font-size: 11px;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #42b983;
}

.legend-dot.unavailable {
  background: #b9c2cd;
}

.slot-picker {
  background: #f8fafc;
  border: 1px solid #e3e9f2;
  border-radius: 9px;
  padding: 14px 16px;
}

.selected-date-label {
  color: #b35c10;
  font-weight: 600;
}

.slot-title {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: bold;
  color: #55657a;
}

.slot-hint {
  margin: 0;
  font-size: 13px;
  color: #8a94a3;
}

.slot-hint.empty {
  color: #b35c10;
}

.slot-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.slot-chip {
  background: #ffffff;
  color: #2c3e50;
  border: 1px solid #c5cfdc;
  border-radius: 7px;
  padding: 8px 12px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease, color 0.15s ease;
}

.slot-chip:hover {
  border-color: #f28c28;
  color: #b35c10;
}

.slot-chip.selected {
  background: #2c3e50;
  border-color: #2c3e50;
  color: #ffffff;
}

.availability-message {
    color: #c0392b;
    font-size: 13px;
    margin: -8px 0 16px;
}
</style>
