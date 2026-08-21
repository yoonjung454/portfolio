import sys # 도시 이름을 가져오는 모듈
import requests # API 요청을 보내기 위한 라이브러리

GEO = "http://geocoding-api.open-meteo.com/v1/search" #위도랑 경도를 가져오게 하는 
FORECAST = "http://api.open-meteo.com/v1/forecast"  # 받아온 위도, 경도를 여기로
TIMEOUT = 5 #응답을 5초 동안 기다림

#함수는 호출되었을 때 해석하기 
def find_city(name): #함수 만들기, 도시 이름을 받아 위도/ 경도표시용 이름을 찾는 함수
    """도시 이름 -> (위도, 경도, 표시용 이름)""" #함수가 어떤 작업을 하는지 설명
    r = requests.get(GEO,params={"name": name, "count": 1},timeout=TIMEOUT)  # GEO API에 도시 이름 전달 /COUNT1: 검색결과 한개만 가져옴. 
    hit = r.json()["results"][0] #HIT변수에 API 응답을 JSON으로 변환한 뒤 results의 첫 번째 결과를 가져옴
    label = hit["name"] + "," + hit["country_code"] # 도시이름, 도시코드 가져오기
    return hit["latitude"], hit["longitude"], label #함수실행했을때 이 내용을 반환하겠다. 위도, 경도, 도시이름, 도시코드를 반환
#도시 이름 입력 → GEO API 요청 → 위도/경도 찾기 → return으로 값 반환

city = sys.argv[1] if len(sys.argv) > 1 else "Seoul" #CMD에서 도시 이름을 입력했으면 그 도시 사용, 입력 안 했으면 Seoul 사용
lat, lon, label = find_city(city) #find_city()가 반환한 위도, 경도, 이름을 일대일로 매칭

params = {
    "latitude": lat, #함수에서 매칭된 위도 
    "longitude": lon, #함수에서 매칭된 경도 
    "current": "temperature_2m", #현재 기온 요청
    "hourly": "precipitation_probability", # 강수 확률 요청
    "forecast_days": 1, #하루치 날씨 정보만 요청
}

r = requests.get(FORECAST, params=params, timeout=TIMEOUT) #FORECAST API에 위도, 경도와 날씨 조건을 보내고 응답을 r에 저장

data = r.json() #변수 r에 들어있는 JSON 응답을 파이썬에서 사용할 수 있게 변환

temp = data["current"]["temperature_2m"] #current 안에서 현재 기온 값을 가져옴
rain = data["hourly"]["precipitation_probability"][0] #시간별 강수확률 중 첫 번째 값을 가져옴

print("city:", label) #도시 이름 출력
print("temperature:", temp, "°C") #현재 기온 출력 
print("rain probability:", rain, "%") #강수확률 출력



# 전체 흐름: CMD에서 도시 입력 > sys.argv로 도시 이름 가져오기 > find_city() 실행
#> GEO API에서 위도/경도 찾기 > FORECAST API에 위도/경도 전달 > 날씨 응답을 r에 저장 
# > r.json()으로 data에 저장>기온/강수확률 꺼내기 > print()로 CMD에 출력