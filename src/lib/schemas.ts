// src/lib/schemas.ts
import { z } from 'zod'

/**
 * Schema for day hours (open/close times for a single day)
 * Validates HH:mm time format and closed status
 */
export const DayHoursSchema = z.object({
  open: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Open time must be in HH:mm format (00:00 to 23:59)'
  }),
  close: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Close time must be in HH:mm format (00:00 to 23:59)'
  }),
  closed: z.boolean()
})

/**
 * Schema for weekly operating hours
 * Requires hours for all 7 days of the week
 */
export const OperatingHoursSchema = z.object({
  monday: DayHoursSchema,
  tuesday: DayHoursSchema,
  wednesday: DayHoursSchema,
  thursday: DayHoursSchema,
  friday: DayHoursSchema,
  saturday: DayHoursSchema,
  sunday: DayHoursSchema
})

/**
 * Schema for special hours (holidays, exceptions)
 * Validates date format and optional time overrides
 */
export const SpecialHourSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format'
  }),
  reason: z.string().min(1, 'Reason is required').max(200, 'Reason must be 200 characters or less'),
  open: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Open time must be in HH:mm format (00:00 to 23:59)'
  }).optional(),
  close: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Close time must be in HH:mm format (00:00 to 23:59)'
  }).optional(),
  closed: z.boolean()
})

/**
 * Base schema for clinic data (without refinements)
 */
const BaseClinicSchema = z.object({
  name: z.string().min(1, 'Clinic name is required').max(200, 'Clinic name must be 200 characters or less'),
  address: z.string().min(10, 'Address must be at least 10 characters').max(500, 'Address must be 500 characters or less'),
  latitude: z.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
  longitude: z.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
  phone: z.string().regex(/^\+?[0-9\s\-()]+$/, {
    message: 'Phone number must contain only digits, spaces, hyphens, parentheses, and optional + prefix'
  }),
  whatsapp: z.string().regex(/^\+?[0-9\s\-()]+$/, {
    message: 'WhatsApp number must contain only digits, spaces, hyphens, parentheses, and optional + prefix'
  }),
  operating_hours: OperatingHoursSchema,
  special_hours: z.array(SpecialHourSchema).optional()
})

/**
 * Schema for creating a new clinic
 * Validates all required fields including coordinates and operating hours
 * 
 * **Validates: Requirements 1.2, 1.5, 1.6, 7.1, 7.2**
 */
export const CreateClinicSchema = BaseClinicSchema.refine(
  (data) => {
    // Validate that coordinates are not both zero unless intentional
    // Requirement 1.5: Coordinates at exactly (0,0) are considered valid but unlikely
    return !(data.latitude === 0 && data.longitude === 0)
  },
  {
    message: "Coordinates (0,0) are unlikely to be correct. Please verify.",
    path: ["latitude"]
  }
)

/**
 * Schema for updating an existing clinic
 * All fields are optional (partial update)
 * 
 * **Validates: Requirements 1.2, 1.5, 1.6, 7.1, 7.2**
 */
export const UpdateClinicSchema = BaseClinicSchema.partial()

/**
 * Schema for geocoding results
 */
export const GeocodingResultSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  formatted_address: z.string(),
  confidence: z.enum(['high', 'medium', 'low'])
})

/**
 * Schema for availability queries
 */
export const AvailabilityQuerySchema = z.object({
  clinic_id: z.string().uuid('Clinic ID must be a valid UUID'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Start date must be in YYYY-MM-DD format'
  }),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'End date must be in YYYY-MM-DD format'
  })
})

/**
 * Schema for availability results
 */
export const AvailabilityResultSchema = z.object({
  clinic_id: z.string().uuid(),
  available_slots: z.number().int().min(0),
  next_available_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()
})

// Export type inference helpers
export type DayHoursInput = z.infer<typeof DayHoursSchema>
export type OperatingHoursInput = z.infer<typeof OperatingHoursSchema>
export type SpecialHourInput = z.infer<typeof SpecialHourSchema>
export type CreateClinicInput = z.infer<typeof CreateClinicSchema>
export type UpdateClinicInput = z.infer<typeof UpdateClinicSchema>
export type GeocodingResultInput = z.infer<typeof GeocodingResultSchema>
export type AvailabilityQueryInput = z.infer<typeof AvailabilityQuerySchema>
export type AvailabilityResultInput = z.infer<typeof AvailabilityResultSchema>
