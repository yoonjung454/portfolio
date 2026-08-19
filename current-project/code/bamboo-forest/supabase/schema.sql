-- 대나무숲: Supabase 테이블 & 보안 정책
-- Supabase 대시보드 > SQL Editor 에서 이 파일 전체를 붙여넣고 실행하세요.

create extension if not exists pgcrypto;

create table if not exists public.confessions (
  id uuid primary key default gen_random_uuid(),
  content text not null check (char_length(content) between 1 and 120),
  created_at timestamptz not null default now()
);

create index if not exists confessions_created_at_idx
  on public.confessions (created_at desc);

alter table public.confessions enable row level security;

-- 누구나(익명 포함) 새 고민을 "놓아둘" 수 있음
drop policy if exists "anyone can insert a confession" on public.confessions;
create policy "anyone can insert a confession"
  on public.confessions
  for insert
  to anon
  with check (char_length(content) between 1 and 120);

-- 최근 10분 이내에 올라온 고민만 조회 가능
-- (화면에서 고민은 3분 뒤 사라지므로, 10분은 넉넉한 버퍼입니다)
drop policy if exists "anyone can read recent confessions" on public.confessions;
create policy "anyone can read recent confessions"
  on public.confessions
  for select
  to anon
  using (created_at > now() - interval '10 minutes');

-- update/delete 정책은 만들지 않습니다.
-- 즉, 한 번 숲에 놓인 고민은 누구도(작성자 본인 포함) 수정하거나 지울 수 없습니다.
-- "숲이 가져간 고민은 되돌릴 수 없다"는 컨셉과 자연스럽게 맞아떨어집니다.

-- (선택) 테이블이 계속 쌓이는 것이 신경 쓰인다면,
-- Supabase가 pg_cron 확장을 지원하는 플랜이라면 아래와 같은 예약 작업을 등록해
-- 하루 지난 데이터를 주기적으로 정리할 수 있습니다. (기본으로는 실행되지 않습니다)
--
-- select cron.schedule(
--   'cleanup-old-confessions',
--   '0 * * * *', -- 매시 정각
--   $$ delete from public.confessions where created_at < now() - interval '1 day'; $$
-- );
