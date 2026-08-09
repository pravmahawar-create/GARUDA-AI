-- GARUDA Customer Memory — Supabase schema
-- Run this in Supabase Dashboard > SQL Editor (or: supabase db push).
-- Safe to re-run: create-if-not-exists + idempotent policies.

-- 1. Conversations (owned by auth.users)
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Messages (linked to a conversation and the owning user)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at);
create index if not exists messages_user_created_idx
  on public.messages (user_id, created_at);
create index if not exists conversations_user_updated_idx
  on public.conversations (user_id, updated_at desc);

-- 3. Keep conversation.updated_at fresh whenever a message is added
create or replace function public.touch_conversation() returns trigger language plpgsql security definer as $$
begin
  update public.conversations set updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation();

-- 4. Ready-made list view: conversation + message count + latest message preview
create or replace view public.conversation_previews
with (security_invoker = true) as
select
  c.id,
  c.user_id,
  c.title,
  c.created_at,
  c.updated_at,
  (
    select count(*) from public.messages m where m.conversation_id = c.id
  ) as message_count,
  (
    select m.content from public.messages m
    where m.conversation_id = c.id
    order by m.created_at desc, m.id desc
    limit 1
  ) as last_message
from public.conversations c;

-- 5. Row Level Security: a user can only see/manage their own rows
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "users own conversations" on public.conversations;
create policy "users own conversations"
  on public.conversations for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users own messages" on public.messages;
create policy "users own messages"
  on public.messages for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);