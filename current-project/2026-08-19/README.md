# 공개 API 연동 실습 — 날씨 · 대기질

Open-Meteo 공개 API(키 불필요)로 위도/경도 조회 → 날씨 → 대기질을 순서대로 연습하고,
마지막에 이 정보들을 합쳐 "외출해도 되는지"를 한 줄로 판정하는 도구로 정리한 실습.

## 파일 구조

```
2026-08-19/
├── app.py              # 완성본 — 도시 이름 → 날씨+대기질 종합 판정 도구
├── README.md           # 이 문서
└── apiapp2/            # 완성본에 이르기까지의 단계별 연습 코드
    ├── first_call.py   # API 첫 호출 연습 (요청 → JSON 파싱 → 값 꺼내기)
    ├── weather.py       # 도시 이름 → 지오코딩 → 날씨(기온·강수확률) 조회
    ├── air.py           # 도시 이름 → 지오코딩 → 대기질(PM2.5·PM10) 조회
    └── show_json.py     # 응답 JSON을 보기 좋게 출력해보는 연습
```

## app.py — 완성본

사용하는 API (전부 무료, 키 불필요):

- Open-Meteo Geocoding API — 도시 이름 → 위도/경도
- Open-Meteo Forecast API — 기온, 강수확률
- Open-Meteo Air Quality API — 대기질 (미국 AQI 기준)

### 설계 포인트

- 지오코딩이 끝나면 날씨/대기질 요청을 스레드로 동시에 보낸다.
- 각 요청에 타임아웃을 걸고, 한쪽이 실패/지연되어도 나머지 정보만으로 판정을 계속 진행한다.
- Open-Meteo 지오코딩이 한글 도시명을 잘 못 찾는 문제(예: "서울", "대전" 검색 실패/오매칭)를 자체 별칭 테이블로 보완했다.

### 실행

```bash
pip install requests
python app.py 서울
python app.py            # 인자 없이 실행하면 도시 이름을 입력받음
```

## apiapp2/ — 단계별 연습 코드

`first_call.py`(API 호출 감 잡기) → `weather.py` / `air.py`(지오코딩 + 각 API 개별 연동) →
`show_json.py`(응답 구조 살펴보기) 순서로 연습한 뒤, 이 내용을 합쳐 `app.py`를 완성했다.
