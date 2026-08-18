# 미니 장바구니

FastAPI + SQLite로 만든 백엔드와, Next.js로 시작한 프론트엔드로 구성된 간단한 장바구니 웹앱 실습.

## 구성

- `main.py` — FastAPI 백엔드. 상품/장바구니를 SQLite(`products`, `cart` 테이블)에 저장하고, 화면(HTML+JS)까지 같은 서버에서 함께 내려준다.
- `mini_cart/` — Next.js(App Router) 프론트엔드. 아직은 기본 화면 제목만 "미니 장바구니"로 바꾼 상태.

## API (FastAPI)

| Method | 경로 | 설명 |
|---|---|---|
| GET | `/products` | 상품 목록 조회 |
| GET | `/cart` | 장바구니 조회 |
| POST | `/cart` | 장바구니에 상품 추가 (이미 있으면 수량 +1) |
| PATCH | `/cart/{id}` | 장바구니 항목 수량 변경 |
| DELETE | `/cart/{id}` | 장바구니 항목 삭제 |

## 실행

```bash
pip install fastapi uvicorn
uvicorn main:app --reload
```

`http://127.0.0.1:8000` 접속 시 상품 목록 + 장바구니 화면(담기 / +,- 수량 조절 / 삭제 / 총액 표시)을 바로 사용할 수 있다.

## 화면 캡처

`mini_cart/화면캡쳐1.png` — 위 FastAPI 화면을 실제로 실행한 결과. 상품 목록(노트북/키보드/마우스/헤드셋), +/- 버튼과 삭제 버튼이 달린 장바구니, 그 아래 "총 상품 금액" 합계까지 한 화면에서 확인할 수 있다.
