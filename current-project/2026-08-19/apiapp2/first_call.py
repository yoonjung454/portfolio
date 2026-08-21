import requests  # API 요청을 보내기 위한 라이브러리

URL = "http://api.open-meteo.com/v1/forecast"  #날씨API 주소

params = {
    "latitude": 37.55,  #위도
    "longitude": 127.0,  #경도
    "current": "temperature_2m,precipitation"  #현재 기온, 강수량 요청
}

r = requests.get(URL, params=params, timeout=5)  #GET 방식으로 API 요청,응답을 최대 5초 기다림

print("Status Code:", r.status_code)  #상태 코드 출력
print("ok?:", r.ok)  #요청 성공 여부
print("first 60 ch:", r.text[:60])  #응답 내용의 앞 60글자만 출력