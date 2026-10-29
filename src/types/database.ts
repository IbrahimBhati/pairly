export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserType = 'student' | 'teacher' | 'professional' | 'community'
export type UserRole = 'user' | 'admin'
export type SkillDirection = 'offered' | 'wanted'
export type SkillProficiency = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export type ListingType = 'exchange' | 'help_request' | 'help_offer'
export type ListingMode = 'online' | 'in_person' | 'both'
export type ListingStatus = 'active' | 'paused' | 'completed' | 'closed'
export type ConnectionStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed'
export type NotificationType =
  | 'connection_request'
  | 'request_accepted'
  | 'request_declined'
  | 'new_message'
  | 'review_received'
  | 'badge_earned'
  | 'system'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          user_type: UserType
          role: UserRole
          city: string | null
          country: string | null
          timezone: string | null
          languages: string[]
          is_verified: boolean
          onboarding_completed: boolean
          is_suspended: boolean
          headline?: string | null
          avg_rating?: number | null
          review_count?: number | null
          completed_exchanges?: number | null
          points?: number | null
          trust_score?: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          user_type?: UserType
          role?: UserRole
          city?: string | null
          country?: string | null
          timezone?: string | null
          languages?: string[]
          is_verified?: boolean
          onboarding_completed?: boolean
          is_suspended?: boolean
          avg_rating?: number
          review_count?: number
          completed_exchanges?: number
          points?: number
          trust_score?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          user_type?: UserType
          role?: UserRole
          city?: string | null
          country?: string | null
          timezone?: string | null
          languages?: string[]
          is_verified?: boolean
          onboarding_completed?: boolean
          is_suspended?: boolean
          avg_rating?: number
          review_count?: number
          completed_exchanges?: number
          points?: number
          trust_score?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: number
          name: string
          slug: string
          icon: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
          icon: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          icon?: string
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
      skills: {
        Row: {
          id: number
          name: string
          category_id: number
          created_at: string
        }
        Insert: {
          id?: number
          name: string
          category_id: number
          created_at?: string
        }
        Update: {
          id?: number
          name?: string
          category_id?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      user_skills: {
        Row: {
          id: string
          user_id: string
          skill_id: number
          direction: SkillDirection
          proficiency: SkillProficiency | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          skill_id: number
          direction: SkillDirection
          proficiency?: SkillProficiency | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          skill_id?: number
          direction?: SkillDirection
          proficiency?: SkillProficiency | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          }
        ]
      }
      listings: {
        Row: {
          id: string
          owner_id: string
          type: ListingType
          title: string
          description: string
          category_id: number | null
          offered_skill_id: number | null
          wanted_skill_id: number | null
          mode: ListingMode
          city: string | null
          availability: string | null
          duration_estimate: string | null
          status: ListingStatus
          view_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          type: ListingType
          title: string
          description: string
          category_id?: number | null
          offered_skill_id?: number | null
          wanted_skill_id?: number | null
          mode?: ListingMode
          city?: string | null
          availability?: string | null
          duration_estimate?: string | null
          status?: ListingStatus
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          type?: ListingType
          title?: string
          description?: string
          category_id?: number | null
          offered_skill_id?: number | null
          wanted_skill_id?: number | null
          mode?: ListingMode
          city?: string | null
          availability?: string | null
          duration_estimate?: string | null
          status?: ListingStatus
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_offered_skill_id_fkey"
            columns: ["offered_skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_wanted_skill_id_fkey"
            columns: ["wanted_skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          }
        ]
      }
      saved_listings: {
        Row: {
          user_id: string
          listing_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          listing_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          listing_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          }
        ]
      },
      connection_requests: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          listing_id: string | null
          message: string | null
          match_score: number | null
          status: ConnectionStatus
          completion_requested_by: string | null
          created_at: string
          responded_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          listing_id?: string | null
          message?: string | null
          match_score?: number | null
          status?: ConnectionStatus
          completion_requested_by?: string | null
          created_at?: string
          responded_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          listing_id?: string | null
          message?: string | null
          match_score?: number | null
          status?: ConnectionStatus
          completion_requested_by?: string | null
          created_at?: string
          responded_at?: string | null
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connection_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_requests_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_requests_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          }
        ]
      },
      conversations: {
        Row: {
          id: string
          connection_id: string
          user_a: string
          user_b: string
          last_message_at: string
          created_at: string
        }
        Insert: {
          id?: string
          connection_id: string
          user_a: string
          user_b: string
          last_message_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          connection_id?: string
          user_a?: string
          user_b?: string
          last_message_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: true
            referencedRelation: "connection_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user_a_fkey"
            columns: ["user_a"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user_b_fkey"
            columns: ["user_b"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      },
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          message_type: string
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          message_type?: string
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          message_type?: string
          read_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      },
      notifications: {
        Row: {
          id: string
          user_id: string
          type: NotificationType
          title: string
          body: string
          link: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: NotificationType
          title: string
          body: string
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: NotificationType
          title?: string
          body?: string
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      },
      reviews: {
        Row: {
          id: string
          connection_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment: string | null
          skills_rating: number | null
          communication_rating: number | null
          punctuality_rating: number | null
          created_at: string
        }
        Insert: {
          id?: string
          connection_id: string
          reviewer_id: string
          reviewee_id: string
          rating: number
          comment?: string | null
          skills_rating?: number | null
          communication_rating?: number | null
          punctuality_rating?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          connection_id?: string
          reviewer_id?: string
          reviewee_id?: string
          rating?: number
          comment?: string | null
          skills_rating?: number | null
          communication_rating?: number | null
          punctuality_rating?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "connection_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      },
      badges: {
        Row: {
          id: number
          slug: string
          name: string
          description: string
          icon: string
          tier: 'bronze' | 'silver' | 'gold'
          criteria: Json
        }
        Insert: {
          id?: number
          slug: string
          name: string
          description: string
          icon: string
          tier: 'bronze' | 'silver' | 'gold'
          criteria: Json
        }
        Update: {
          id?: number
          slug?: string
          name?: string
          description?: string
          icon?: string
          tier?: 'bronze' | 'silver' | 'gold'
          criteria?: Json
        }
        Relationships: []
      },
      user_badges: {
        Row: {
          user_id: string
          badge_id: number
          earned_at: string
        }
        Insert: {
          user_id: string
          badge_id: number
          earned_at?: string
        }
        Update: {
          user_id?: string
          badge_id?: number
          earned_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          }
        ]
      },
      blocks: {
        Row: {
          blocker_id: string
          blocked_id: string
          created_at: string
        }
        Insert: {
          blocker_id: string
          blocked_id: string
          created_at?: string
        }
        Update: {
          blocker_id?: string
          blocked_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      },
      reports: {
        Row: {
          id: string
          reporter_id: string
          reported_user_id: string | null
          reported_listing_id: string | null
          reason: 'spam' | 'harassment' | 'inappropriate_content' | 'scam' | 'fake_profile' | 'other'
          details: string | null
          status: 'open' | 'reviewing' | 'resolved' | 'dismissed'
          admin_notes: string | null
          resolved_by: string | null
          created_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          reporter_id: string
          reported_user_id?: string | null
          reported_listing_id?: string | null
          reason: 'spam' | 'harassment' | 'inappropriate_content' | 'scam' | 'fake_profile' | 'other'
          details?: string | null
          status?: 'open' | 'reviewing' | 'resolved' | 'dismissed'
          admin_notes?: string | null
          resolved_by?: string | null
          created_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          reporter_id?: string
          reported_user_id?: string | null
          reported_listing_id?: string | null
          reason?: 'spam' | 'harassment' | 'inappropriate_content' | 'scam' | 'fake_profile' | 'other'
          details?: string | null
          status?: 'open' | 'reviewing' | 'resolved' | 'dismissed'
          admin_notes?: string | null
          resolved_by?: string | null
          created_at?: string
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_listing_id_fkey"
            columns: ["reported_listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          }
        ]
      },
      verification_requests: {
        Row: {
          id: string
          user_id: string
          method: 'student_id' | 'institution_email' | 'professional_link' | 'government_id'
          document_url: string | null
          note: string | null
          status: 'pending' | 'approved' | 'rejected'
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          method: 'student_id' | 'institution_email' | 'professional_link' | 'government_id'
          document_url?: string | null
          note?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          method?: 'student_id' | 'institution_email' | 'professional_link' | 'government_id'
          document_url?: string | null
          note?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      },
      user_settings: {
        Row: {
          user_id: string
          theme: 'light' | 'dark' | 'system'
          email_notifications: boolean
          notify_new_request: boolean
          notify_messages: boolean
          notify_reviews: boolean
          profile_visibility: 'public' | 'members_only'
          show_city: boolean
          language: string
          updated_at: string
        }
        Insert: {
          user_id: string
          theme?: 'light' | 'dark' | 'system'
          email_notifications?: boolean
          notify_new_request?: boolean
          notify_messages?: boolean
          notify_reviews?: boolean
          profile_visibility?: 'public' | 'members_only'
          show_city?: boolean
          language?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          theme?: 'light' | 'dark' | 'system'
          email_notifications?: boolean
          notify_new_request?: boolean
          notify_messages?: boolean
          notify_reviews?: boolean
          profile_visibility?: 'public' | 'members_only'
          show_city?: boolean
          language?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      },
      admin_audit_log: {
        Row: {
          id: string
          admin_id: string | null
          action: string
          target_type: string
          target_id: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          admin_id?: string | null
          action: string
          target_type: string
          target_id: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string | null
          action?: string
          target_type?: string
          target_id?: string
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_log_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_listing_view_count: {
        Args: {
          target_listing_id: string
        }
        Returns: void
      }
      calculate_match_score: {
        Args: {
          user_a: string
          user_b: string
        }
        Returns: {
          score: number
          matched_you_want: string[]
          matched_they_want: string[]
        }[]
      }
      get_matches_for_user: {
        Args: {
          p_user: string
          p_limit?: number
          p_offset?: number
        }
        Returns: {
          matched_user_id: string
          full_name: string | null
          username: string | null
          avatar_url: string | null
          user_type: UserType
          city: string | null
          country: string | null
          is_verified: boolean
          bio: string | null
          score: number
          matched_you_want: string[]
          matched_they_want: string[]
        }[]
      }
      explore_listings: {
        Args: {
          p_user?: string | null
          p_search?: string | null
          p_category?: number | null
          p_type?: ListingType | null
          p_mode?: ListingMode | null
          p_city?: string | null
          p_min_match?: number | null
          p_sort?: string | null
          p_limit?: number | null
          p_offset?: number | null
        }
        Returns: {
          id: string
          owner_id: string
          type: ListingType
          title: string
          description: string
          category_id: number | null
          category_name: string | null
          offered_skill_id: number | null
          offered_skill_name: string | null
          wanted_skill_id: number | null
          wanted_skill_name: string | null
          mode: ListingMode
          city: string | null
          availability: string | null
          duration_estimate: string | null
          status: ListingStatus
          view_count: number
          created_at: string
          owner_username: string | null
          owner_full_name: string | null
          owner_avatar_url: string | null
          owner_user_type: UserType | null
          owner_is_verified: boolean | null
          owner_city: string | null
          match_score: number
          matched_you_want: string[]
          matched_they_want: string[]
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_admin_analytics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
    }
    Enums: {
      user_type: UserType
      user_role: UserRole
      skill_direction: SkillDirection
      listing_type: ListingType
      listing_mode: ListingMode
      listing_status: ListingStatus
      connection_status: ConnectionStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenient Type Aliases
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Skill = Database['public']['Tables']['skills']['Row']
export type UserSkill = Database['public']['Tables']['user_skills']['Row']
export type Listing = Database['public']['Tables']['listings']['Row']
export type SavedListing = Database['public']['Tables']['saved_listings']['Row']
export type ConnectionRequest = Database['public']['Tables']['connection_requests']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
export type Badge = Database['public']['Tables']['badges']['Row']
export type UserBadge = Database['public']['Tables']['user_badges']['Row']
export type Block = Database['public']['Tables']['blocks']['Row']
export type Report = Database['public']['Tables']['reports']['Row']
export type VerificationRequest = Database['public']['Tables']['verification_requests']['Row']
export type UserSettings = Database['public']['Tables']['user_settings']['Row']
export type AdminAuditLog = Database['public']['Tables']['admin_audit_log']['Row']

// Admin Analytics Aggregation Interface
export interface AdminAnalyticsData {
  total_users: number
  new_this_month: number
  active_listings: number
  completed_exchanges: number
  open_reports: number
  pending_verifications: number
  users_by_type: { type: string; count: number }[]
  listings_by_category: { category: string; count: number }[]
  new_users_daily: { date: string; count: number }[]
  top_offered_skills: { skill: string; count: number }[]
  top_wanted_skills: { skill: string; count: number }[]
}

// Extended Skill with Category
export interface SkillWithCategory extends Skill {
  category: Category
}

// User Skill with populated details
export interface UserSkillWithDetails extends UserSkill {
  skill: SkillWithCategory
}

// Enriched Listing with populated relations
export interface ListingWithDetails extends Listing {
  owner: Profile
  category: Category | null
  offered_skill: Skill | null
  wanted_skill: Skill | null
  is_saved?: boolean
}

// Enriched Connection Request
export interface ConnectionRequestWithDetails extends ConnectionRequest {
  sender: Profile
  receiver: Profile
  listing?: ListingWithDetails | null
}

// Enriched Conversation
export interface ConversationWithDetails extends Conversation {
  other_user: Profile
  connection: ConnectionRequest
  listing?: Listing | null
  last_message?: Message | null
  unread_count?: number
}

// Enriched Message
export interface MessageWithSender extends Message {
  sender: Profile
}

// Enriched Review
export interface ReviewWithDetails extends Review {
  reviewer: Profile
  reviewee: Profile
  connection?: ConnectionRequestWithDetails | null
}

// Enriched User Badge
export interface UserBadgeWithDetails extends UserBadge {
  badge: Badge
}

// Full Match Preview Model for Smart Matching
export interface SmartMatchCandidate {
  user: Profile
  matchPercentage: number
  matchingOfferedSkills: Skill[]
  matchingWantedSkills: Skill[]
}

// Gamification Level Calculation Model
export interface UserLevelInfo {
  level: number
  title: string
  currentPoints: number
  minPoints: number
  maxPoints: number
  progressPercent: number
  nextLevelTitle: string

  // Aliases for convenience
  currentLevel: number
  tierName: string
  totalPoints: number
  nextTierName: string
  pointsToNextLevel: number
  progressPercentage: number
  currentLevelMinPoints: number
  nextLevelMinPoints: number
}

export const LEVEL_TIERS: { level: number; title: string; minPoints: number }[] = [
  { level: 1, title: 'Newcomer', minPoints: 0 },
  { level: 2, title: 'Explorer', minPoints: 100 },
  { level: 3, title: 'Contributor', minPoints: 200 },
  { level: 4, title: 'Mentor', minPoints: 300 },
  { level: 5, title: 'Legend', minPoints: 500 },
]

export function calculateUserLevel(points: number = 0): UserLevelInfo {
  const safePoints = Math.max(0, points)
  let currentTier = LEVEL_TIERS[0]
  let nextTier = LEVEL_TIERS[1]

  for (let i = LEVEL_TIERS.length - 1; i >= 0; i--) {
    if (safePoints >= LEVEL_TIERS[i].minPoints) {
      currentTier = LEVEL_TIERS[i]
      nextTier = LEVEL_TIERS[i + 1] || {
        level: currentTier.level + 1,
        title: 'Grand Legend',
        minPoints: currentTier.minPoints + 200,
      }
      break
    }
  }

  const range = Math.max(1, nextTier.minPoints - currentTier.minPoints)
  const earnedInRange = safePoints - currentTier.minPoints
  const progressPercent = Math.min(100, Math.max(0, Math.round((earnedInRange / range) * 100)))
  const pointsToNextLevel = Math.max(0, nextTier.minPoints - safePoints)

  return {
    level: currentTier.level,
    title: currentTier.title,
    currentPoints: safePoints,
    minPoints: currentTier.minPoints,
    maxPoints: nextTier.minPoints,
    progressPercent,
    nextLevelTitle: nextTier.title,

    // Aliases
    currentLevel: currentTier.level,
    tierName: currentTier.title,
    totalPoints: safePoints,
    nextTierName: nextTier.title,
    pointsToNextLevel,
    progressPercentage: progressPercent,
    currentLevelMinPoints: currentTier.minPoints,
    nextLevelMinPoints: nextTier.minPoints,
  }
}

