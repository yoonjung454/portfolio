import sys # CMD에서 입력한 도시 이름 가져오는 모듈
import requests # 파이썬에서 인터넷/API에 요청 보내는 도구

GEO_URL = "https://geocoding-api.open-meteo.com/v1/search" # 도시 이름으로 위도 경도 찾는 API
AIR= "https://air-quality-api.open-meteo.com/v1/air-quality" # 위도 경도로 미세먼지 정보 가져오는 API
TIMEOUT =5 #응답을 최대 5초까지 기다림

def find_city(name): # 도시 이름 받아서 위도,경도, 표시용 이름 찾는 함수
    r = requests.get(GEO_URL, params={"name": name, "count": 1}, timeout=TIMEOUT) # GEO API에 도시 이름 보내기, count 1은 결과 한개만
    hit = r.json()["results"][0] # 응답을 json으로 바꾸고 results의 첫번째 결과 가져오기
    return hit["latitude"], hit["longitude"], hit["name"] + "," + hit["country_code"] # 위도 경도 도시이름+국가코드 반환


city=sys.argv[1] if len(sys.argv) > 1 else "Seoul" # CMD에서 도시 입력하면 그 도시, 안하면 Seoul
lat, lon, label = find_city(city) # 함수에서 나온 위도 경도 이름을 각각 저장


params = { 
    "latitude": lat, # 함수에서 가져온 위도
    "longitude": lon, # 함수에서 가져온 경도
    "current": "pm2_5,pm10" # 현재 pm2.5, pm10 요청
} 
cur = requests.get(AIR, params=params, timeout=TIMEOUT).json()["current"] # AIR API 요청하고 json으로 바꾼 뒤 current 값만 가져옴

pm25=cur["pm2_5"] # pm2.5 값 가져오기
grade="good" if pm25 < 16 else ("CAUTION" if pm25 < 35 else "BAD") # pm2.5 수치에 따라서 grade 정하기 

print("city:", label) # 도시 이름 출력
print("pm2.5:", pm25, "μg/m³") # pm2.5 출력
print("pm10:", cur["pm10"], "μg/m³") # pm10 출력
print("grade:", grade) # 등급 출력
import sys # CMD에서 입력한 도시 이름을 가져오기 위한 모듈
import requests # 파이썬에서 인터넷/API에 요청을 보내는 도구

# 전체 흐름: CMD에서 도시 입력 > sys.argv로 도시 이름 가져오기 > find_city() 실행
# >GEO API에서 위도/경도 찾기 > AIR API에 위도 경도 전달
#> 미세먼지 응답 받아서 json으로 변환 > current 데이터 가져오기
#> pm2.5랑 pm10 값 꺼내기 > pm2.5 기준으로 등급 정하기 > print로 CMD에 출력