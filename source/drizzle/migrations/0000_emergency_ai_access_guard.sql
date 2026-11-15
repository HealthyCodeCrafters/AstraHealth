CREATE TABLE public.emergency_ai_access_guard (
 id text PRIMARY KEY,
 status integer NOT NULL,
 message text NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.emergency_ai_access_guard TO service_role;
ALTER TABLE public.emergency_ai_access_guard ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.emergency_ai_access_guard IS 'Server-only persistent provider access denials. No photographs, symptoms or transcripts are stored.';