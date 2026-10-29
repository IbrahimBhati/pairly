import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

export type LoginInput = z.infer<typeof loginSchema>

export const signupSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
    email: z.string().email("Please enter a valid university or personal email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    terms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and community guidelines",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type SignupInput = z.infer<typeof signupSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

export const userTypeSchema = z.enum(["student", "teacher", "professional", "community"])
export const userRoleSchema = z.enum(["user", "admin"])
export const skillDirectionSchema = z.enum(["offered", "wanted"])
export const proficiencySchema = z.enum(["beginner", "intermediate", "advanced", "expert"])

export const profileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, underscores, and dashes allowed"),
  full_name: z.string().min(2, "Full name must be at least 2 characters").max(100),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional().or(z.literal("")),
  user_type: userTypeSchema,
  city: z.string().max(100).optional().or(z.literal("")),
  country: z.string().max(100).optional().or(z.literal("")),
  timezone: z.string().optional().or(z.literal("")),
  languages: z.array(z.string()).default([]),
})

export const userSkillSchema = z.object({
  skill_id: z.number().int().positive("Please select a valid skill"),
  direction: skillDirectionSchema,
  proficiency: proficiencySchema.optional().nullable(),
}).refine(
  (data) => {
    if (data.direction === "offered") {
      return !!data.proficiency
    }
    return true
  },
  {
    message: "Proficiency is required for offered skills",
    path: ["proficiency"],
  }
)

export const onboardingStep1Schema = z.object({
  full_name: z.string().min(2, "Please enter your full name"),
  username: z.string().min(3, "Username must be at least 3 characters").max(30),
  user_type: userTypeSchema,
  bio: z.string().max(500).optional(),
})

export const onboardingStep2Schema = z.object({
  offeredSkills: z
    .array(
      z.object({
        skill_id: z.number(),
        proficiency: proficiencySchema,
      })
    )
    .min(1, "Please select at least 1 skill you can offer"),
  wantedSkills: z
    .array(
      z.object({
        skill_id: z.number(),
      })
    )
    .min(1, "Please select at least 1 skill you want to learn"),
})

export const matchFilterSchema = z.object({
  userType: userTypeSchema.optional(),
  categorySlug: z.string().optional(),
  minMatchScore: z.number().min(0).max(100).default(50),
  searchQuery: z.string().optional(),
})

export const listingTypeSchema = z.enum(["exchange", "help_request", "help_offer"])
export const listingModeSchema = z.enum(["online", "in_person", "both"])
export const listingStatusSchema = z.enum(["active", "paused", "completed", "closed"])

export const listingFormSchema = z
  .object({
    type: listingTypeSchema,
    title: z
      .string()
      .min(5, "Title must be at least 5 characters")
      .max(100, "Title cannot exceed 100 characters"),
    description: z
      .string()
      .min(20, "Please provide at least 20 characters explaining what you want to exchange or achieve")
      .max(2000, "Description cannot exceed 2000 characters"),
    category_id: z.coerce.number().int().positive("Please select a category"),
    offered_skill_id: z.coerce.number().int().positive().nullable().optional(),
    wanted_skill_id: z.coerce.number().int().positive().nullable().optional(),
    mode: listingModeSchema.default("online"),
    city: z.string().max(100).optional().nullable(),
    availability: z.string().max(100).optional().nullable(),
    duration_estimate: z.string().max(100).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.type === "exchange") {
        return !!data.offered_skill_id && !!data.wanted_skill_id
      }
      if (data.type === "help_offer") {
        return !!data.offered_skill_id
      }
      if (data.type === "help_request") {
        return !!data.wanted_skill_id
      }
      return true
    },
    {
      message: "Please select the required skill(s) for this listing type",
      path: ["type"],
    }
  )
  .refine(
    (data) => {
      if ((data.mode === "in_person" || data.mode === "both") && (!data.city || data.city.trim().length === 0)) {
        return false
      }
      return true
    },
    {
      message: "City is required for in-person or hybrid exchanges",
      path: ["city"],
    }
  )

export type ListingFormInput = z.infer<typeof listingFormSchema>

export const profileUpdateSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  userType: userTypeSchema,
  bio: z.string().max(280, "Bio cannot exceed 280 characters").optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  country: z.string().max(100).optional().or(z.literal("")),
  languages: z.array(z.string()).min(1, "Select at least 1 language"),
  avatarUrl: z.string().optional().or(z.literal("")),
})

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>

