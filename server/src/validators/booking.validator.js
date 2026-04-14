const {
  z,
  objectIdSchema,
  paginationQuerySchema,
} = require('./common.validator')

const createBookingSchema = z
  .object({
    trainerId: objectIdSchema,
    slotStart: z.coerce.date(),
    slotEnd: z.coerce.date(),
    notes: z.string().max(400).optional(),
  })
  .refine((value) => value.slotEnd > value.slotStart, {
    message: 'slotEnd must be later than slotStart',
    path: ['slotEnd'],
  })

const bookingStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
})

const bookingIdParamSchema = z.object({
  bookingId: objectIdSchema,
})

const bookingListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
})

module.exports = {
  createBookingSchema,
  bookingStatusSchema,
  bookingIdParamSchema,
  bookingListQuerySchema,
}
