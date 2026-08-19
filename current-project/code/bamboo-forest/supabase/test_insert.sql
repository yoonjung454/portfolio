-- 테스트용 가짜 고민 1건 삽입 (Supabase SQL Editor에서 실행)
insert into public.confessions (content)
values ('테스트로 남겨보는 고민이에요 🍃');

-- 방금 넣은 데이터가 잘 들어갔는지 확인
select * from public.confessions order by created_at desc limit 5;
