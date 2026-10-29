-- ============================================================================
-- PAIRLY DATABASE MIGRATION: 006_connections_chat.sql
-- Description: Connection Request Lifecycle, Real-Time Chat, and Notifications
-- ============================================================================

-- 1. ENUM: connection_status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'connection_status') THEN
    CREATE TYPE connection_status AS ENUM (
      'pending',
      'accepted',
      'declined',
      'cancelled',
      'completed'
    );
  END IF;
END $$;

-- 2. TABLE: connection_requests
CREATE TABLE IF NOT EXISTS public.connection_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  message text CHECK (char_length(message) <= 500),
  match_score int CHECK (match_score >= 0 AND match_score <= 100),
  status connection_status NOT NULL DEFAULT 'pending',
  completion_requested_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  completed_at timestamptz,
  CONSTRAINT check_not_self CHECK (sender_id <> receiver_id)
);

-- Partial unique index to prevent duplicate pending requests
CREATE UNIQUE INDEX IF NOT EXISTS unique_pending_connection_request 
ON public.connection_requests (
  sender_id, 
  receiver_id, 
  COALESCE(listing_id, '00000000-0000-0000-0000-000000000000'::uuid)
)
WHERE status = 'pending';

-- Helpful query indexes
CREATE INDEX IF NOT EXISTS idx_conn_requests_sender ON public.connection_requests(sender_id, status);
CREATE INDEX IF NOT EXISTS idx_conn_requests_receiver ON public.connection_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_conn_requests_listing ON public.connection_requests(listing_id);

-- 3. TABLE: conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL UNIQUE REFERENCES public.connection_requests(id) ON DELETE CASCADE,
  user_a uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_conversation_users CHECK (user_a <> user_b)
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_a ON public.conversations(user_a, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_user_b ON public.conversations(user_b, last_message_at DESC);

-- Trigger: Automatically create conversation when connection request is accepted
CREATE OR REPLACE FUNCTION public.handle_connection_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- When status changes to accepted
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status <> 'accepted') THEN
    NEW.responded_at = now();
    
    INSERT INTO public.conversations (connection_id, user_a, user_b, last_message_at, created_at)
    VALUES (NEW.id, NEW.sender_id, NEW.receiver_id, now(), now())
    ON CONFLICT (connection_id) DO NOTHING;
  END IF;

  -- When status changes to completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
    NEW.completed_at = now();
  END IF;

  -- When status changes to declined or cancelled
  IF (NEW.status = 'declined' OR NEW.status = 'cancelled') AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
    NEW.responded_at = now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_connection_accepted ON public.connection_requests;
CREATE TRIGGER trg_connection_accepted
  BEFORE UPDATE ON public.connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_connection_accepted();

-- 4. TABLE: messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) <= 2000),
  message_type text NOT NULL DEFAULT 'text',
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON public.messages(conversation_id, created_at DESC);

-- Trigger: Update conversations.last_message_at on message insert
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_new_message ON public.messages;
CREATE TRIGGER trg_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_message();

-- 5. TABLE: notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'connection_request','request_accepted','request_declined','new_message','review_received','badge_earned','system'
  title text NOT NULL,
  body text NOT NULL,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
ON public.notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON public.notifications(user_id, is_read) 
WHERE is_read = false;

-- Trigger: Automatic notifications for connection requests and messages
CREATE OR REPLACE FUNCTION public.handle_connection_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_sender_name text;
  v_receiver_name text;
BEGIN
  -- 1. On INSERT of new connection request -> notify receiver
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    SELECT COALESCE(full_name, username, 'A peer') INTO v_sender_name 
    FROM public.profiles WHERE id = NEW.sender_id;

    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.receiver_id,
      'connection_request',
      'New Connection Request',
      v_sender_name || ' sent you a skill exchange request.',
      '/connections?tab=received'
    );
  END IF;

  -- 2. On UPDATE of status
  IF TG_OP = 'UPDATE' THEN
    -- Status becomes accepted -> notify sender
    IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
      SELECT COALESCE(full_name, username, 'Your peer') INTO v_receiver_name 
      FROM public.profiles WHERE id = NEW.receiver_id;

      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (
        NEW.sender_id,
        'request_accepted',
        'Connection Accepted!',
        v_receiver_name || ' accepted your request. Start chatting now!',
        '/messages'
      );
    END IF;

    -- Status becomes declined -> notify sender
    IF NEW.status = 'declined' AND OLD.status = 'pending' THEN
      SELECT COALESCE(full_name, username, 'Your peer') INTO v_receiver_name 
      FROM public.profiles WHERE id = NEW.receiver_id;

      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (
        NEW.sender_id,
        'request_declined',
        'Connection Request Declined',
        v_receiver_name || ' declined your skill exchange request.',
        '/connections?tab=sent'
      );
    END IF;

    -- Completion requested -> notify other participant
    IF NEW.completion_requested_by IS NOT NULL AND (OLD.completion_requested_by IS NULL OR OLD.completion_requested_by <> NEW.completion_requested_by) AND NEW.status = 'accepted' THEN
      DECLARE
        v_other_user uuid;
        v_requester_name text;
      BEGIN
        IF NEW.completion_requested_by = NEW.sender_id THEN
          v_other_user := NEW.receiver_id;
        ELSE
          v_other_user := NEW.sender_id;
        END IF;

        SELECT COALESCE(full_name, username, 'Your partner') INTO v_requester_name 
        FROM public.profiles WHERE id = NEW.completion_requested_by;

        INSERT INTO public.notifications (user_id, type, title, body, link)
        VALUES (
          v_other_user,
          'system',
          'Exchange Completion Requested',
          v_requester_name || ' requested to mark your exchange as completed. Please confirm!',
          '/connections?tab=active'
        );
      END;
    END IF;

    -- Status becomes completed -> notify both participants
    IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES 
        (NEW.sender_id, 'badge_earned', 'Exchange Completed! 🎉', 'Your skill exchange has been marked as completed.', '/connections?tab=completed'),
        (NEW.receiver_id, 'badge_earned', 'Exchange Completed! 🎉', 'Your skill exchange has been marked as completed.', '/connections?tab=completed');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_connection_notification ON public.connection_requests;
CREATE TRIGGER trg_connection_notification
  AFTER INSERT OR UPDATE ON public.connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_connection_notification();

-- Trigger: Notification on new message
CREATE OR REPLACE FUNCTION public.handle_message_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_recipient_id uuid;
  v_sender_name text;
  v_content_preview text;
BEGIN
  -- Determine recipient from conversation
  SELECT 
    CASE 
      WHEN user_a = NEW.sender_id THEN user_b 
      ELSE user_a 
    END INTO v_recipient_id
  FROM public.conversations
  WHERE id = NEW.conversation_id;

  IF v_recipient_id IS NOT NULL THEN
    SELECT COALESCE(full_name, username, 'Someone') INTO v_sender_name
    FROM public.profiles
    WHERE id = NEW.sender_id;

    v_content_preview := substring(NEW.content from 1 for 100);
    IF char_length(NEW.content) > 100 THEN
      v_content_preview := v_content_preview || '...';
    END IF;

    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      v_recipient_id,
      'new_message',
      'New message from ' || v_sender_name,
      v_content_preview,
      '/messages/' || NEW.conversation_id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_message_notification ON public.messages;
CREATE TRIGGER trg_message_notification
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_message_notification();

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 6.1. connection_requests
DROP POLICY IF EXISTS "Users can view their own connection requests" ON public.connection_requests;
CREATE POLICY "Users can view their own connection requests"
  ON public.connection_requests FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Authenticated users can create connection requests" ON public.connection_requests;
CREATE POLICY "Authenticated users can create connection requests"
  ON public.connection_requests FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND auth.uid() <> receiver_id
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = receiver_id AND is_suspended = true
    )
  );

DROP POLICY IF EXISTS "Users can update their connection requests" ON public.connection_requests;
CREATE POLICY "Users can update their connection requests"
  ON public.connection_requests FOR UPDATE
  USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  )
  WITH CHECK (
    -- Receiver can accept or decline
    (auth.uid() = receiver_id AND status IN ('accepted', 'declined'))
    -- Sender can cancel pending
    OR (auth.uid() = sender_id AND status = 'cancelled')
    -- Either can request or confirm completion
    OR ((auth.uid() = sender_id OR auth.uid() = receiver_id) AND (status = 'completed' OR completion_requested_by IS NOT NULL))
  );

-- 6.2. conversations
DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;
CREATE POLICY "Participants can view conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = user_a OR auth.uid() = user_b);

DROP POLICY IF EXISTS "Participants can insert conversations" ON public.conversations;
CREATE POLICY "Participants can insert conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
CREATE POLICY "Participants can update conversations"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = user_a OR auth.uid() = user_b);

-- 6.3. messages
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
CREATE POLICY "Participants can view messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.user_a = auth.uid() OR c.user_b = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Active exchange participants can send messages" ON public.messages;
CREATE POLICY "Active exchange participants can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      JOIN public.connection_requests cr ON cr.id = c.connection_id
      WHERE c.id = conversation_id
      AND (c.user_a = auth.uid() OR c.user_b = auth.uid())
      AND cr.status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "Participants can update message read status" ON public.messages;
CREATE POLICY "Participants can update message read status"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.user_a = auth.uid() OR c.user_b = auth.uid())
    )
  );

-- 6.4. notifications
DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
CREATE POLICY "Users can view their notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
CREATE POLICY "Users can update their notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their notifications" ON public.notifications;
CREATE POLICY "Users can delete their notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 7. REALTIME PUBLICATION
-- ============================================================================
-- Add tables to the supabase_realtime publication
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION WHEN duplicate_object THEN
    -- already added
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN
    -- already added
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.connection_requests;
  EXCEPTION WHEN duplicate_object THEN
    -- already added
  END;
END $$;
