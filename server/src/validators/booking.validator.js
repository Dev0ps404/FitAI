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

const bookingPaymentSchema = z
  .object({
    paymentMethod: z.enum(['card', 'wallet']).default('card'),
    promoCode: z
      .string()
      .trim()
      .max(32)
      .transform((value) => value.toUpperCase())
      .optional(),
    cardholderName: z.string().trim().min(2).max(80).optional(),
    cardLast4: z
      .string()
      .trim()
      .regex(/^\d{4}$/)
      .optional(),
  })
  .superRefine((value, ctx) => {
    if (value.paymentMethod !== 'card') {
      return
    }

    if (!value.cardholderName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cardholderName'],
        message: 'cardholderName is required for card payment',
      })
    }

    if (!value.cardLast4) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cardLast4'],
        message: 'cardLast4 is required for card payment',
      })
    }
  })

const bookingListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']).optional(),
})

module.exports = {
  createBookingSchema,
  bookingStatusSchema,
  bookingIdParamSchema,
  bookingPaymentSchema,
  bookingListQuerySchema,
}
