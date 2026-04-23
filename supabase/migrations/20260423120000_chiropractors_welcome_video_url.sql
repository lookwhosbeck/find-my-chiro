-- Public intro / vibe-check video: provider-hosted (YouTube, Vimeo, Loom, etc.). URL only; no file storage on Movyn.

ALTER TABLE public.chiropractors
  ADD COLUMN IF NOT EXISTS welcome_video_url text;

COMMENT ON COLUMN public.chiropractors.welcome_video_url IS 'HTTPS link to an intro video on a third-party host (e.g. YouTube unlisted, Vimeo). Null when unset.';
