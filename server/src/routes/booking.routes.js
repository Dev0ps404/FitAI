const { Router } = require('express')
const requireAuth = require('../middlewares/requireAuth')
const authorizeRoles = require('../middlewares/authorizeRoles')
const validateRequest = require('../middlewares/validateRequest')
const { USER_ROLES } = require('../config/constants')
const {
  createBookingSchema,
  bookingStatusSchema,
  bookingIdParamSchema,
  bookingPaymentSchema,
  bookingListQuerySchema,
} = require('../validators/booking.validator')
const {
  createBooking,
  listBookings,
  updateBookingStatus,
  cancelBooking,
  processBookingPayment,
} = require('../controllers/booking/booking.controller')

const bookingRouter = Router()

bookingRouter.use(requireAuth)

bookingRouter.get(
  '/',
  validateRequest({ query: bookingListQuerySchema }),
  listBookings,
)
bookingRouter.post(
  '/',
  authorizeRoles(USER_ROLES.USER, USER_ROLES.ADMIN),
  validateRequest({ body: createBookingSchema }),
  createBooking,
)
bookingRouter.patch(
  '/:bookingId/status',
  authorizeRoles(USER_ROLES.TRAINER, USER_ROLES.ADMIN),
  validateRequest({ params: bookingIdParamSchema, body: bookingStatusSchema }),
  updateBookingStatus,
)
bookingRouter.patch(
  '/:bookingId/cancel',
  validateRequest({ params: bookingIdParamSchema }),
  cancelBooking,
)
bookingRouter.patch(
  '/:bookingId/pay',
  authorizeRoles(USER_ROLES.USER, USER_ROLES.ADMIN),
  validateRequest({ params: bookingIdParamSchema, body: bookingPaymentSchema }),
  processBookingPayment,
)

module.exports = bookingRouter
