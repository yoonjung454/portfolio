"""
app.py — 도시 이름으로 날씨 + 대기질을 합쳐서 "외출해도 되는지" 한 줄로 판정하는 도구.

사용하는 공개 API (둘 다 무료, 키 불필요):
  1) Open-Meteo Geocoding API   : 도시 이름 -> 위도/경도
  2) Open-Meteo Forecast API    : 기온, 강수확률
  3) Open-Meteo Air Quality API : 대기질(미국 AQI 기준)

설계 원칙:
  - 지오코딩이 끝난 뒤, 날씨/대기질 호출은 스레드로 동시에 요청한다.
  - 각 요청에는 타임아웃을 걸고, 실패/타임아웃이 나도 프로그램을 멈추지 않는다.
    (한쪽 응답이 늦으면 그 정보만 "알 수 없음" 처리하고 나머지로 판정을 계속 진행)

실행 방법:
  pip install requests
  python app.py 서울
  python app.py            # 인자 없이 실행하면 도시 이름을 입력받음
"""

import sys
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError

import requests

GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"
WEATHER_URL = "https://api.open-meteo.com/v1/forecast"
AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"

REQUEST_TIMEOUT = 5      # 개별 HTTP 요청 타임아웃(초)
OVERALL_TIMEOUT = 8      # 스레드 결과를 기다리는 최대 시간(초)

# Open-Meteo 지오코딩 API(GeoNames 기반)는 한글 도시명 색인이 거의 없어서
# "서울", "인천", "광주" 등을 그대로 검색하면 결과가 아예 없거나(예: 서울,
# 인천, 대구, 광주, 제주는 결과 없음) 엉뚱하게 매칭된다(예: "대전"으로 검색하면
# 실제 대전이 아니라 북한의 동명 마을이 로마자 표기 "Taejŏn"으로 걸림).
# 그래서 흔히 쓰는 한국 도시명은 영문 검색어로 미리 변환해 준다.
KOREAN_CITY_ALIASES = {
    "서울": "Seoul", "부산": "Busan", "인천": "Incheon", "대구": "Daegu",
    "대전": "Daejeon", "광주": "Gwangju", "울산": "Ulsan", "세종": "Sejong",
    "수원": "Suwon", "성남": "Seongnam", "용인": "Yongin", "고양": "Goyang",
    "창원": "Changwon", "청주": "Cheongju", "전주": "Jeonju", "천안": "Cheonan",
    "제주": "Jeju", "포항": "Pohang", "안산": "Ansan", "안양": "Anyang",
    "김해": "Gimhae", "평택": "Pyeongtaek", "의정부": "Uijeongbu",
    "시흥": "Siheung", "파주": "Paju", "김포": "Gimpo", "이천": "Icheon",
    "진주": "Jinju", "여수": "Yeosu", "목포": "Mokpo", "순천": "Suncheon",
    "익산": "Iksan", "군산": "Gunsan", "경주": "Gyeongju", "구미": "Gumi",
    "안동": "Andong", "춘천": "Chuncheon", "원주": "Wonju", "강릉": "Gangneung",
    "속초": "Sokcho",
}

# "서울시", "서울특별시"처럼 행정구역 접미사가 붙어도 매칭되도록 접미사를 뗀다.
_ADMIN_SUFFIXES = ("특별자치시", "특별자치도", "광역시", "특별시", "자치시", "자치도", "시", "군", "구")


def normalize_city_query(city_name):
    """한글 도시명을 Open-Meteo 검색에 잘 걸리는 영문 이름으로 변환한다."""
    trimmed = city_name.strip()
    if trimmed in KOREAN_CITY_ALIASES:
        return KOREAN_CITY_ALIASES[trimmed]
    for suffix in _ADMIN_SUFFIXES:
        if trimmed.endswith(suffix):
            base = trimmed[: -len(suffix)]
            if base in KOREAN_CITY_ALIASES:
                return KOREAN_CITY_ALIASES[base]
    return trimmed


def geocode_city(city_name):
    """
    도시 이름 -> (위도, 경도, 표시용 이름). 실패 시 None.

    주의: Open-Meteo 지오코딩 API는 language=ko를 주면 관련도 랭킹이 오히려
    나빠져 "New York" -> 미국 네브래스카주의 작은 마을 "York" 같은 엉뚱한
    결과가 1순위로 나오는 경우가 있었다. 그래서 language 파라미터 없이 여러
    후보를 받아온 뒤, 인구(population)가 가장 큰 곳을 고른다.
    """
    query = normalize_city_query(city_name)
    try:
        resp = requests.get(
            GEOCODE_URL,
            params={"name": query, "count": 5, "format": "json"},
            timeout=REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
        results = data.get("results")
        if not results:
            return None

        top = max(results, key=lambda r: r.get("population") or 0)
        label = top.get("name", city_name)
        country = top.get("country")
        if country:
            label = f"{label}, {country}"
        return top["latitude"], top["longitude"], label
    except (requests.RequestException, ValueError, KeyError):
        return None


def fetch_weather(lat, lon):
    """
    기온(현재)과 강수확률(앞으로 6시간 중 최댓값)을 반환.
    실패/타임아웃 시 None을 반환하고 호출부에서 "정보 없음"으로 처리한다.
    """
    try:
        resp = requests.get(
            WEATHER_URL,
            params={
                "latitude": lat,
                "longitude": lon,
                "hourly": "temperature_2m,precipitation_probability",
                "current_weather": "true",
                "timezone": "auto",
                "forecast_days": 1,
            },
            timeout=REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()

        current_temp = data["current_weather"]["temperature"]
        current_time = data["current_weather"]["time"]

        hourly_times = data["hourly"]["time"]
        precip_probs = data["hourly"]["precipitation_probability"]

        # 현재 시각과 가장 가까운 hourly 인덱스를 찾는다.
        if current_time in hourly_times:
            idx = hourly_times.index(current_time)
        else:
            idx = 0

        window = precip_probs[idx: idx + 6] or precip_probs[idx: idx + 1]
        max_precip_prob = max(window) if window else None

        return {"temperature": current_temp, "precip_probability": max_precip_prob}
    except (requests.RequestException, ValueError, KeyError, IndexError):
        return None


def fetch_air_quality(lat, lon):
    """
    현재 미국 AQI(us_aqi)를 반환.
    실패/타임아웃 시 None을 반환하고 호출부에서 "정보 없음"으로 처리한다.
    """
    try:
        resp = requests.get(
            AIR_QUALITY_URL,
            params={
                "latitude": lat,
                "longitude": lon,
                "hourly": "us_aqi",
                "timezone": "auto",
                "forecast_days": 1,
            },
            timeout=REQUEST_TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
        aqi_values = data["hourly"]["us_aqi"]
        current_aqi = next((v for v in aqi_values if v is not None), None)
        return {"us_aqi": current_aqi}
    except (requests.RequestException, ValueError, KeyError, StopIteration):
        return None


def judge(weather, air):
    """
    날씨 + 대기질 정보를 종합해 "외출해도 되는지"를 한 줄로 판정한다.
    일부 정보가 없어도(None) 있는 정보만으로 계속 진행한다.
    """
    reasons = []
    verdict = "외출하기 좋아요"
    caution = False
    both_failed = weather is None and air is None

    if weather is None:
        reasons.append("날씨 정보 없음(응답 지연/실패)")
    else:
        temp = weather.get("temperature")
        precip = weather.get("precip_probability")

        if precip is not None and precip >= 60:
            caution = True
            reasons.append(f"강수확률 {precip}% (비 올 가능성 높음)")
        elif precip is not None and precip >= 30:
            reasons.append(f"강수확률 {precip}% (우산 챙기면 안심)")

        if temp is not None and (temp <= 0 or temp >= 33):
            caution = True
            reasons.append(f"기온 {temp}°C (혹한/폭염 주의)")

    if air is None:
        reasons.append("대기질 정보 없음(응답 지연/실패)")
    else:
        aqi = air.get("us_aqi")
        if aqi is not None:
            if aqi > 150:
                caution = True
                reasons.append(f"대기질 나쁨(US AQI {aqi})")
            elif aqi > 100:
                reasons.append(f"대기질 민감군 주의(US AQI {aqi})")

    if caution:
        verdict = "외출 자제를 권장해요"
    elif both_failed:
        verdict = "판정 불가(날씨/대기질 조회 모두 실패)"

    reason_text = " / ".join(reasons) if reasons else "날씨·대기질 모두 양호"
    return f"{verdict} — {reason_text}"


def main():
    # Windows 콘솔의 기본 코드페이지(cp949)는 이모지/특수기호를 인코딩하지 못해
    # UnicodeEncodeError가 날 수 있으므로 표준출력을 UTF-8로 강제한다.
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except AttributeError:
        pass

    if len(sys.argv) > 1:
        city_input = " ".join(sys.argv[1:])
    else:
        city_input = input("도시 이름을 입력하세요: ").strip()

    if not city_input:
        print("도시 이름이 비어 있습니다.")
        return

    geo = geocode_city(city_input)
    if geo is None:
        print(f"'{city_input}' 위치를 찾을 수 없습니다.")
        return

    lat, lon, label = geo

    # 날씨 / 대기질 요청을 동시에 보내고, 느린 쪽 때문에 전체가 멈추지 않게 한다.
    with ThreadPoolExecutor(max_workers=2) as executor:
        weather_future = executor.submit(fetch_weather, lat, lon)
        air_future = executor.submit(fetch_air_quality, lat, lon)

        try:
            weather = weather_future.result(timeout=OVERALL_TIMEOUT)
        except FutureTimeoutError:
            weather = None

        try:
            air = air_future.result(timeout=OVERALL_TIMEOUT)
        except FutureTimeoutError:
            air = None

    print(f"[{label}]")
    print(judge(weather, air))


if __name__ == "__main__":
    main()
