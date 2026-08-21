# 2025년 하반기 가장 인기 있었던 AI 도구 조사 보고서

**작성일**: 2026년 8월 7일
**조사 대상 기간**: 2025년 7월 ~ 12월 (하반기)

---

## 1. 개요

2025년 하반기는 생성형 AI 시장에서 챗봇 간 경쟁이 본격화되고, 코딩·이미지·영상 생성 등 세부 카테고리별로 강자가 뚜렷해진 시기였다. 본 보고서는 "2025년 하반기 가장 인기 있었던 AI 도구"를 파악하기 위해 웹 트래픽 데이터, 업계 리포트, 개발자 설문, 국내 랭킹 서비스 등 복수의 출처를 교차 검증하여 작성되었다.

### 조사 방법론

| 구분 | 조사 방법 | 활용 지표 | 대표 출처 |
|---|---|---|---|
| 웹 트래픽 분석 | Similarweb 등 트래픽 집계 서비스 데이터 확인 | 월간 방문수, 전월 대비 성장률 | Similarweb |
| 업계 리포트 | VC·리서치 기관의 소비자 AI 앱 랭킹 분석 | Top 100 앱 순위, 카테고리별 1위 | a16z |
| 개발자 설문 | 대규모 개발자 대상 설문조사 결과 확인 | 사용률(%), 신뢰도, 만족도 | Stack Overflow, JetBrains |
| 국내 랭킹 서비스 | 국내 전문 매체의 종합 점수 랭킹 확인 | 웹트래픽+소셜버즈+전문가평가 종합점수 | AI매터스 |
| 교차 검증 | 위 4개 출처의 순위를 비교하여 공통적으로 상위권에 오른 도구 확인 | - | - |

---

## 2. 종합 결과: 2025년 하반기 최고 인기 AI 도구

여러 출처를 종합한 결과, **범용 AI 챗봇 부문에서는 OpenAI의 ChatGPT가 압도적 1위**를 유지했다. 다만 하반기 내내 Anthropic의 Claude와 Google의 Gemini가 빠르게 성장하며 격차를 좁혔고, 카테고리(코딩, 이미지, 영상 등)를 세분화하면 각 분야에서 서로 다른 강자가 존재하는 "분화(fragmentation)" 현상이 뚜렷했다.

### 2-1. 글로벌 웹 트래픽 순위 (Similarweb, 2025년 8월 기준)

| 순위 | 도구 | 월간 방문수 | 전월 대비 성장률 | 비고 |
|---|---|---|---|---|
| 1 | ChatGPT | 약 58.5억 회 | +2.2% | 웹·앱 모두 압도적 1위 |
| 2 | Google Gemini | 약 7.2억 회 | +3.4% | 검색 결합형 강점 |
| 3 | DeepSeek | 약 3.2억 회 | -8.9% | 상반기 대비 급락세 |
| 4 | Claude | 약 1.5억 회 | **+18.6%** | 하반기 최대 성장폭 |
| 5 | Perplexity | 약 1.5억 회 | +5.4% | AI 검색 특화 |

![AI 챗봇 웹 트래픽 순위 차트](https://quickchart.io/chart?c=%7B%22type%22:%22bar%22,%22data%22:%7B%22labels%22:%5B%22ChatGPT%22,%22Gemini%22,%22DeepSeek%22,%22Claude%22,%22Perplexity%22%5D,%22datasets%22:%5B%7B%22label%22:%22Monthly%20Visits%20(Billions,%20Aug%202025)%22,%22data%22:%5B5.846,0.723,0.319,0.148,0.148%5D,%22backgroundColor%22:%5B%22%2310a37f%22,%22%234285f4%22,%22%234d6bfe%22,%22%23d97757%22,%22%2320808d%22%5D%7D%5D%7D,%22options%22:%7B%22title%22:%7B%22display%22:true,%22text%22:%22AI%20Chatbot%20Web%20Traffic%20Ranking%20-%20Aug%202025%20(Similarweb)%22%7D%7D%7D)
*(출처: Similarweb 데이터를 바탕으로 QuickChart로 시각화)*

### 2-2. 국내(한국) 생성형 AI Top 10 (AI매터스, 2025년 6~10월 종합점수)

| 순위 | 도구 | 종합점수 | 유형 |
|---|---|---|---|
| 1 | ChatGPT | 86.8 | 범용 |
| 2 | 제미나이(Gemini) | 84.8 | 범용 |
| 3 | 노션AI | 73.2 | 생산성 |
| 4 | 클로드(Claude) | 70.4 | 범용 |
| 5 | 미드저니 | 63.8 | 이미지 생성 |
| 6 | 미리캔버스 | 63.4 | 디자인(국내) |
| 7 | 퍼플렉시티 | 62.6 | AI 검색 |
| 8 | 그록(Grok) | 62.4 | 범용 |
| 9 | 딥시크 | 61.6 | 범용(중국) |
| 10 | 뤼튼 | 60.2 | 범용(국내) |

국내 시장에서는 글로벌 서비스가 상위권을 차지한 가운데, **미리캔버스·뤼튼 등 국내 서비스가 한국 특화 전략**으로 Top 10에 진입한 점이 특징적이다.

---

## 3. 카테고리별 상세 분석

### 3-1. 범용 챗봇/어시스턴트

ChatGPT는 앱 기준 일간 재방문율(스티키니스) **43.87%**로 경쟁 서비스를 크게 앞섰으며, Gemini(5.59%)나 Perplexity·DeepSeek(약 20%)보다 훨씬 높은 고착도를 보였다. 다만 성장률 측면에서는 2026년 1월 기준 Claude 유료 구독자가 전년 대비 200% 이상, Gemini가 258% 성장하는 등 후발주자의 추격이 거셌다.

### 3-2. AI 코딩 도구 — 별도의 강자 구도

코딩 보조 도구 시장은 챗봇 시장과 전혀 다른 순위를 보였다.

| 도구 | 2025 Stack Overflow 설문 채택률 | 시장 점유율(유료 기준) | 특징 |
|---|---|---|---|
| GitHub Copilot | 68% | 약 42% | 기업 도입률 1위, 2026년 1월 유료 구독 470만 명 |
| Cursor | 18% | 18% (18개월 만에 급성장) | 개발자 선호 에디터, ARR 20억 달러 |
| Claude Code | 10% | - | JetBrains 설문 "가장 사랑받는 도구" 46%로 1위 |

전체 개발자의 **70%가 2~4개의 AI 코딩 도구를 동시에 사용**하는 것으로 나타났으며, "Cursor로 편집하고 Claude Code로 복잡한 작업을 처리"하는 조합이 대표적인 사용 패턴으로 확인됐다.

### 3-3. 이미지·영상 생성 도구

- **이미지 생성**: 미드저니(Midjourney)가 여전히 존재감을 유지했으나, ChatGPT·Gemini에 이미지 생성 기능이 기본 탑재되면서 단독 이미지 도구의 순위(Top 100 앱 기준 46위)는 하락했다.
- **영상 생성**: OpenAI의 **Sora 2**가 2025년 하반기 출시 이후 가장 시각적으로 정교한 결과물로 주목받았으며, 그 직전에는 2025년 10월 공개된 Google **Veo 3.1**이 대화·효과음까지 지원하며 틱톡 바이럴 영상 상당수를 만들어냈다. 이 외 Kling AI, Hailuo, Pixverse 등 중국계 영상 생성 모델도 순위권에 올랐다.
- **음악/음성**: 음악 생성은 Suno, 음성 합성은 ElevenLabs가 각 분야 1위 자리를 지켰다.

---

## 4. 하반기 핵심 트렌드

1. **"단일 도구 → 복수 도구" 사용 패턴 확산**: ChatGPT의 절대적 지배력은 유지되었지만, 사용자들이 목적에 따라 Claude(코딩·추론), Gemini(검색·긴 컨텍스트), Perplexity(리서치) 등을 병행 사용하는 경향이 강해졌다.
2. **Claude의 약진**: 웹 트래픽 성장률(+18.6%, 8월 기준)과 유료 구독자 증가율(+200% YoY) 모두에서 하반기 최고 성장세를 기록했고, 코딩 분야에서는 만족도 1위를 차지했다.
3. **DeepSeek의 하락**: 상반기 화제성 대비 하반기 트래픽이 크게 감소(-8.9%, 전월 대비)하며 초기 돌풍이 다소 잦아드는 모습을 보였다.
4. **카테고리 세분화**: "가장 인기 있는 AI 도구"는 더 이상 하나로 답할 수 없으며, 범용 챗봇(ChatGPT)·코딩(GitHub Copilot/Claude Code)·이미지(Midjourney)·영상(Sora 2/Veo 3.1) 등 영역별 1위가 각각 존재하는 구도가 고착화됐다.

---

## 5. 결론

종합적으로, **2025년 하반기 가장 인기 있었던 AI 도구는 범용성과 사용자 규모 면에서 여전히 OpenAI의 ChatGPT**였다. 웹·앱 트래픽, 국내외 종합 랭킹, 개발자 설문 등 조사한 모든 출처에서 ChatGPT가 1위를 차지했다. 그러나 "인기"의 기준을 성장 속도나 특정 전문 영역으로 좁히면 결과는 달라진다. 성장률 기준으로는 **Claude**가 하반기 가장 두드러진 도구였고, 코딩 영역에서는 **GitHub Copilot(채택률)**과 **Claude Code(만족도)**가, 영상 생성에서는 **Sora 2**가 각 분야의 강자로 부상했다. 즉, 2025년 하반기는 'ChatGPT 독주 체제'에서 '영역별 특화 경쟁 체제'로 이동하는 전환점이었다고 평가할 수 있다.

---

## 참고 자료 (출처 링크)

- [Similarweb – Top AI Tools: Most Used Gen-AI in August 2025](https://www.similarweb.com/blog/marketing/seo/most-used-ai/)
- [Andreessen Horowitz – The Top 100 Gen AI Consumer Apps, 6th Edition](https://a16z.com/100-gen-ai-apps-6/)
- [AI매터스 – 2025년 하반기 한국 생성형 AI 시장 분석](https://aimatters.co.kr/news-report/feature-article/34395/)
- [AI매터스 – 14만 대화 분석, 1등 AI는?](https://aimatters.co.kr/news-report/ai-report/35536/)
- [Stack Overflow – 2025 Developer Survey: AI](https://survey.stackoverflow.co/2025/ai/)
- [Stack Overflow Blog – 2025 Developer Survey Results 발표](https://stackoverflow.blog/2025/12/29/developers-remain-willing-but-reluctant-to-use-ai-the-2025-developer-survey-results-are-here/)
- [JetBrains Blog – Which AI Coding Tools Do Developers Actually Use at Work?](https://blog.jetbrains.com/research/2026/04/which-ai-coding-tools-do-developers-actually-use-at-work/)
- [First Page Sage – Top Generative AI Chatbots by Market Share](https://firstpagesage.com/reports/top-generative-ai-chatbots/)

---

*본 보고서는 공개된 웹 검색 결과와 업계 리포트를 종합·교차 검증하여 작성되었으며, 일부 지표는 조사 시점(2026년 8월) 기준 최신 자료를 활용해 2025년 하반기 상황을 소급 정리한 것임을 밝힌다.*