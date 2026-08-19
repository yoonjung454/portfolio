import json #json글자르 사람이 읽을 수 있게 
import requests #파이썬에서 인터넷으로 요청을 보내는 도구

URL = "http://api.open-meteo.com/v1/forecast" #날씨 api 주소
params = { #API에 같이 보낼 조건이나 정보들을 묶어둔 것
    "latitude": 37.55, 
    "longitude": 127.0,
    "current": "temperature_2m,precipitation" #현재 기온과 강수량 받아오기
}

r= requests.get(URL, params=params, timeout=5)#API에 GET 요청, 응답을 최대 5초까지 기다림
data = r.json() #받은 응답을 json형식으로 변환하여 사용
#API 요청 → r에 응답 저장 → r.json() → data에서 값 꺼내기


#cmd에 python first_call.py 입력시 뜨게 함. 
print("key         :",list(data.keys())) 
print("current box :")
print(json.dumps(data["current"], indent=2)) #dumps: data를 json형식으로 변환 indent=2: 들여쓰기 2칸
print("temperature  :", data["current"]["temperature_2m"])
#python first_call.py 입력 → 코드 실행 → API 응답을 r에 저장 → r.json()으로 JSON을 data에 저장 → print()로 CMD에 출력



