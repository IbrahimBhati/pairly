/**
 * Content Safety and Moderation Rules for Pairly
 * Prevents spam, prohibited contact sharing in initial connections, and inappropriate language.
 */

export interface SafetyCheckResult {
  isSafe: boolean
  valid: boolean
  flaggedReason?: string
  warningMessage?: string
  warning?: string
}

// Configurable banned keywords (profanity, scam terms, off-platform solicitation)
export const BANNED_KEYWORDS: string[] = [
  "scam",
  "wire transfer",
  "western union",
  "cashapp me",
  "venmo me",
  "crypto investment",
  "free money",
  "nigerian prince",
  "whatsapp me at",
  "telegram me at",
  "cheat sheet leak",
  "buy essay",
  "pay for exam",
]

// Phone number regex patterns (US, UK, international formats)
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/

// Obvious email address regex
const EMAIL_REGEX = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/

/**
 * Validates text content (listing description, intro message, chat message)
 * @param content Text to analyze
 * @param isInitialMessage Whether this is an initial connection request or first contact
 */
export function validateContentSafety(
  content: string,
  isInitialMessage: boolean = false
): SafetyCheckResult {
  if (!content) return { isSafe: true, valid: true }

  const lower = content.toLowerCase()

  // 1. Check banned keywords
  for (const word of BANNED_KEYWORDS) {
    if (lower.includes(word.toLowerCase())) {
      const msg = `Your message contains disallowed phrases ("${word}"). Please maintain academic integrity and non-monetary community guidelines.`
      return {
        isSafe: false,
        valid: false,
        flaggedReason: "prohibited_language",
        warningMessage: msg,
        warning: msg,
      }
    }
  }

  // 2. Prevent off-platform contact sharing in initial connection requests
  if (isInitialMessage) {
    if (EMAIL_REGEX.test(content)) {
      const msg =
        "For your safety and protection, sharing personal email addresses in initial exchange requests is restricted. Please use Pairly's built-in chat once connected."
      return {
        isSafe: false,
        valid: false,
        flaggedReason: "contact_sharing",
        warningMessage: msg,
        warning: msg,
      }
    }

    if (PHONE_REGEX.test(content)) {
      const msg =
        "For your security, sharing phone numbers in initial exchange requests is restricted. Please coordinate via Pairly's real-time messaging first."
      return {
        isSafe: false,
        valid: false,
        flaggedReason: "contact_sharing",
        warningMessage: msg,
        warning: msg,
      }
    }
  }

  return { isSafe: true, valid: true }
}
