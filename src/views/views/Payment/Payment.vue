<template>
  <div class="payment-page">
    <header class="page-header">
      <div class="header-text">
        <p class="header-label">STUDENT PORTAL</p>
        <h1>Payments</h1>
        <p class="header-description">Manage your booking payments and view payment history</p>
      </div>
    </header>

    <section class="stat-grid">
      <div class="stat-card">
        <span class="stat-label">Total paid</span>
        <strong class="stat-value">{{ fmtR(totalSpent) }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">Outstanding</span>
        <strong class="stat-value outstanding">{{ fmtR(totalOutstanding) }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">Paid bookings</span>
        <strong class="stat-value">{{ paidBookings.length }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">Unpaid bookings</span>
        <strong class="stat-value" :class="{ outstanding: unpaidBookings.length > 0 }">{{ unpaidBookings.length }}</strong>
      </div>
    </section>

    <!-- Unpaid Bookings -->
    <div class="dashboard-card">
      <div class="card-header">
        <div>
          <h2>Unpaid Bookings</h2>
          <p>Bookings awaiting payment</p>
        </div>
        <span class="count-badge" v-if="unpaidBookings.length">{{ unpaidBookings.length }}</span>
      </div>

      <div v-if="unpaidBookings.length" class="table-scroll">
        <div class="table-header unpaid-columns">
          <span>Date</span>
          <span>Subject</span>
          <span>Tutor</span>
          <span>Type</span>
          <span>Duration</span>
          <span>Amount due</span>
          <span></span>
        </div>
        <div
          class="table-row unpaid-columns"
          v-for="b in unpaidBookings"
          :key="b.bookingId"
        >
          <span>{{ formatDate(b.date) }}</span>
          <span>{{ subjectName(b.subjectCode) }}</span>
          <span>{{ tutorName(b) }}</span>
          <span>{{ b.sessionType || '—' }}</span>
          <span>{{ b.duration ? b.duration + ' min' : '—' }}</span>
          <span class="cell-strong">{{ fmtR(amountDue(b)) }}</span>
          <span class="row-actions-cell">
            <button class="pay-now-button" @click="openPay(b)">Pay Now</button>
            <button class="cancel-now-button" @click="cancelBooking(b)">Cancel</button>
          </span>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-circle">&#10003;</div>
        <h3>All caught up</h3>
        <p>You have no unpaid bookings</p>
      </div>
    </div>

    <!-- Payment History -->
    <div class="dashboard-card">
      <div class="card-header">
        <div>
          <h2>Payment History</h2>
          <p>All completed transactions</p>
        </div>
      </div>

      <div v-if="recentPayments.length" class="table-scroll">
        <div class="table-header payment-history-columns">
          <span>Reference</span>
          <span>Date</span>
          <span>Subject</span>
          <span>Amount</span>
          <span>Method</span>
          <span>Status</span>
        </div>
        <div
          class="table-row payment-history-columns"
          v-for="p in recentPayments"
          :key="p.paymentRef"
        >
          <span class="mono">{{ p.paymentRef }}</span>
          <span>{{ formatDate(p.paymentDate) }}</span>
          <span>{{ subjectName(p._subjectCode) }}</span>
          <span class="cell-strong">{{ fmtR(p.amount) }}</span>
          <span>{{ p.paymentMethod || '—' }}</span>
          <span>
            <span class="status-chip paid">PAID</span>
          </span>
        </div>
      </div>

      <div v-else class="empty-state">
          <div class="empty-circle">R</div>
        <h3>No payments yet</h3>
        <p>Payment records will appear here once you pay for a booking</p>
      </div>
    </div>

    <!-- Pay Modal -->
    <transition name="pop">
      <div v-if="payTarget" class="modal-backdrop" @click.self="closePay">
        <div class="modal">
          <div class="modal-head">
            <button type="button" class="back-btn" @click="closePay">
              <i class="bi bi-arrow-left"></i>
            </button>
            <h3>Payment</h3>
            <button class="close-x" @click="closePay">&times;</button>
          </div>

          <div class="modal-body-layout">
            <!-- Left: Payment Summary -->
            <div class="modal-left">
              <div class="payment-card">
                <div class="section-title">Payment Summary</div>
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
                    <span class="info-label">Session</span>
                    <span class="session-badge">{{ formatSessionType(payTarget.sessionType) }}</span>
                  </div>
                </div>
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

            <!-- Right: Online Payment -->
            <div class="modal-right">
              <div class="payment-card">
                <div class="section-title">Online Payment</div>
                <div class="payment-option selected">
                  <div class="payment-option-content">
                    <div class="payment-icon"><i class="bi bi-credit-card"></i></div>
                    <div>
                      <div class="payment-option-title">Pay by Card</div>
                      <p class="payment-option-text">Enter your card details to continue.</p>
                    </div>
                  </div>
                </div>

                <div class="card-details">
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

                <button class="payment-btn" :disabled="paying || !paymentForm.paymentMethod" @click="confirmPay">
                  <span v-if="paying"><span class="spinner-border spinner-border-sm me-2"></span>Processing...</span>
                  <span v-else>
                    <i class="bi bi-credit-card me-2"></i>
                    {{ 'Pay ' + fmtR(paymentForm.amount) }}
                  </span>
                </button>

                <div class="secure-text">
                  <i class="bi bi-info-circle"></i>
                  Online payment option
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
import { createPayment } from '@/services/paymentService'
import { deleteBooking } from '@/services/bookingService'

export default {
  name: 'StudentPaymentPage',

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
    initialBookingId: {
      type: String,
      default: ''
    }
  },

  data() {
    return {
      handledInitialId: '',
      payTarget: null,
      paymentForm: { amount: 0, paymentMethod: '' },
      modalError: '',
      paying: false,
      cardName: '',
      cardNumber: '',
      expiryDate: '',
      cvv: ''
    }
  },

  computed: {
    myBookings() {
      return this.me.bookings || []
    },

    unpaidBookings() {
      return this.myBookings
        .filter(b => !b.payment)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
    },

    paidBookings() {
      return this.myBookings
        .filter(b => b.payment)
        .sort((a, b) => new Date(b.payment.paymentDate) - new Date(a.payment.paymentDate))
    },

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

    totalSpent() {
      return this.myBookings.reduce((sum, b) => sum + Number(b.payment ? b.payment.amount : 0), 0)
    },

    totalOutstanding() {
      return this.unpaidBookings.reduce((sum, b) => sum + Number(this.amountDue(b)), 0)
    }
  },

  watch: {
    initialBookingId: {
      immediate: true,
      handler() {
        this.tryOpenInitialBooking()
      }
    },
    myBookings: {
      deep: true,
      handler() {
        this.tryOpenInitialBooking()
      }
    }
  },

  methods: {
    // opens the payment pop up for a booking that was just created
    tryOpenInitialBooking() {
      const id = this.initialBookingId
      if (!id || this.handledInitialId === id) return

      const booking = this.myBookings.find(
        b => String(b.bookingId) === String(id)
      )
      if (!booking) return

      this.handledInitialId = id
      this.openPay(booking)
      this.$emit('payment-opened')
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

    tutorHourlyRate(booking) {
      const t = this.tutorForBooking(booking)
      return t ? Number(t.hourlyRate || 0) : 0
    },

    amountDue(booking) {
      const rate = this.tutorHourlyRate(booking)
      return Number((rate * (Number(booking.duration || 60) / 60)).toFixed(2))
    },

    openPay(booking) {
      this.modalError = ''
      this.cardName = ''
      this.cardNumber = ''
      this.expiryDate = ''
      this.cvv = ''
      this.paymentForm.amount = this.amountDue(booking)
      this.paymentForm.paymentMethod = 'Card'
      this.payTarget = booking
    },

    closePay() {
      this.payTarget = null
      this.modalError = ''
    },

    // there is no dedicated cancel endpoint yet, so remove the booking
    async cancelBooking(booking) {
      if (!window.confirm(`Cancel your ${this.subjectName(booking.subjectCode)} booking on ${this.formatDate(booking.date)}?`)) return

      try {
        await deleteBooking(booking.bookingId)
        this.$emit('refresh')
        this.$emit('notify', { type: 'success', message: 'Booking cancelled.' })
      } catch (e) {
        this.$emit('notify', { type: 'error', message: e.message })
      }
    },

    async confirmPay() {
      this.modalError = ''
      if (this.paymentForm.amount <= 0) {
        this.modalError = 'The payment amount could not be calculated.'
        return
      }
      if (this.paymentForm.paymentMethod === 'Card') {
        if (!this.cardName || !this.cardNumber || !this.expiryDate || !this.cvv) {
          this.modalError = 'Please complete your card details.'
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
          status: 'PAID',
          booking: { bookingId: this.payTarget.bookingId }
        })
        this.closePay()
        this.$emit('refresh')
        this.$emit('notify', { type: 'success', message: 'Payment successful!' })
      } catch (e) {
        this.modalError = e.message
      } finally {
        this.paying = false
      }
    },

    fmtR(value) {
      return `R${Number(value || 0).toFixed(2)}`
    },

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

    formatDate(value) {
      if (!value) return '-'
      return new Date(value).toLocaleString('en-ZA', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
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
.payment-page {
  padding: 30px;
  min-height: 100vh;
  background-color: #f7f8fa;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  color: #2c3e50;
  text-align: left;
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

.header-text { min-width: 0; }

.header-label {
  color: #f28c28;
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 1.5px;
  margin: 0 0 7px;
}

.page-header h1 { font-size: 30px; margin: 0; }

.header-description {
  color: #d7dde3;
  font-size: 14px;
  margin: 7px 0 0;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  margin-bottom: 22px;
}

.stat-card {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 18px 20px;
}

.stat-label {
  display: block;
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  color: #8a94a3;
  margin-bottom: 6px;
}

.stat-value {
  display: block;
  font-size: 24px;
  color: #2c3e50;
}

.stat-value.outstanding { color: #c0392b; }

.dashboard-card {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 22px;
  margin-bottom: 22px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 14px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 8px;
}

.card-header h2 { font-size: 17px; margin: 0; }
.card-header p { color: #8a94a3; font-size: 12px; margin: 4px 0 0; }

.count-badge {
  background-color: #fce8e6;
  color: #c0392b;
  font-size: 12px;
  font-weight: bold;
  padding: 3px 10px;
  border-radius: 999px;
}

.table-scroll { overflow-x: auto; }

.table-header,
.table-row {
  display: grid;
  padding: 12px 5px;
  align-items: center;
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

.unpaid-columns {
  grid-template-columns: 1.4fr 1.3fr 1.1fr 0.8fr 0.8fr 0.9fr 0.9fr;
  min-width: 800px;
}

.payment-history-columns {
  grid-template-columns: 1.2fr 1.3fr 1.2fr 0.9fr 0.9fr 0.8fr;
  min-width: 700px;
}

.cell-strong { font-weight: bold; }

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

.row-actions-cell {
  justify-self: end;
  display: flex;
  gap: 8px;
}

.cancel-now-button {
  background-color: #ffffff;
  color: #c0392b;
  border: 1px solid #e0a9a2;
  border-radius: 7px;
  padding: 7px 14px;
  font-family: inherit;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  white-space: nowrap;
}

.cancel-now-button:hover { background-color: #fbeae8; }

.pay-now-button {
  background-color: #f28c28;
  color: #ffffff;
  border: none;
  border-radius: 7px;
  padding: 7px 14px;
  font-family: inherit;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  white-space: nowrap;
}

.pay-now-button:hover { background-color: #2c3e50; }

.empty-state {
  min-height: 160px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.empty-circle {
  width: 38px;
  height: 38px;
  background-color: #e6f4ec;
  color: #1e7a58;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 10px;
}

.empty-state h3 { margin: 0 0 5px; font-size: 14px; }
.empty-state p { color: #8a94a3; font-size: 12px; margin: 0; }

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

.modal-head h3 { margin: 0; font-size: 20px; color: #2c3e50; font-weight: 700; }

.back-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background-color: white;
  color: #2c3e50;
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

.close-x:hover { color: #2c3e50; }

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
  color: #2c3e50;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 18px;
}

.booking-info {
  background-color: #fff7ef;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
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
  background-color: #fff3e7;
  color: #2c3e50;
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
  color: #2c3e50;
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

.payment-option:hover { border-color: #f28c28; }

.payment-option.selected {
  border: 2px solid #f28c28;
  background-color: #fff7ef;
}

.payment-option-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.payment-option input { accent-color: #2c3e50; }

.payment-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background-color: #fff3e7;
  color: #2c3e50;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 20px;
}

.payment-option-title { font-size: 14px; font-weight: 600; }
.payment-option-text { font-size: 11px; color: #777; margin: 2px 0 0; }

.card-details { margin-top: 20px; }

.form-label { font-size: 12px; font-weight: 600; margin-bottom: 6px; }

.form-control {
  background-color: #f1f1f1;
  border: none;
  border-radius: 8px;
  padding: 11px;
  font-size: 13px;
}

.form-control:focus {
  background-color: #f1f1f1;
  border: 1px solid #f28c28;
  box-shadow: none;
}

.mb-3 { margin-bottom: 12px; }

.row { display: flex; gap: 12px; }
.col-6 { flex: 1; }

.modal-error {
  margin: 12px 0;
  color: #c0392b;
  font-size: 12px;
}

.payment-btn {
  width: 100%;
  border: none;
  border-radius: 8px;
  background-color: #2c3e50;
  color: white;
  padding: 13px;
  margin-top: 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.payment-btn:hover { background-color: #1f2d3a; }
.payment-btn:disabled { opacity: 0.7; cursor: not-allowed; }

.secure-text {
  text-align: center;
  color: #888;
  font-size: 11px;
  margin-top: 12px;
}

.pop-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.pop-enter {
  opacity: 0;
  transform: scale(0.95);
}

.pop-leave-active {
  transition: opacity 0.15s ease;
}

.pop-leave-to { opacity: 0; }

@media (max-width: 767px) {
  .modal-body-layout { flex-direction: column; }
  .modal { max-width: 480px; }
}
</style>
