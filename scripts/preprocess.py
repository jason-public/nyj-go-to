import csv
import json
import os
import re
import urllib.request
import urllib.parse
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

# 파일 경로
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE_DIR, "남양주맛집_최신통합.csv")
RULES_PATH = os.path.join(BASE_DIR, "scripts", "food_tag_rules.json")
OUTPUT_JSON_PATH = os.path.join(BASE_DIR, "src", "assets", "namyangju_places.json")

# VWorld API Key
VWORLD_KEY = os.environ.get("VWORLD_API_KEY", "7209B6A2-8394-467E-AF8C-75E0279312C2")

# 규칙 로드
with open(RULES_PATH, "r", encoding="utf-8") as rf:
    rules_data = json.load(rf)

rules = rules_data.get("rules", [])
manual_overrides = rules_data.get("manual_overrides", {})

def clean_address(addr):
    cleaned = re.sub(r'[\(（].*?[\)）]', '', addr)
    parts = cleaned.split(',')
    base = parts[0].strip()
    base = re.sub(r'\s+(?:지하\s*)?\d+(?:층|호|동|가동|나동).*$', '', base)
    base = re.sub(r'\s+(?:센타프라자|상가동|동익미라벨|청송빌딩|힐스테이트|1층|2층|3층).*$', '', base)
    return base.strip()

def extract_food_tags(name, category, note):
    # 수동 보정이 있는 경우 우선 적용
    if name in manual_overrides:
        return manual_overrides[name], "확정"
    
    tags = set()
    text = f"{name} {note}".lower()

    for r in rules:
        tag = r["tag"]
        allowed_cats = r.get("categories", [])
        if allowed_cats and category not in allowed_cats:
            continue
        
        for kw in r["keywords"]:
            if kw.lower() in text:
                tags.add(tag)
                break
    
    # 기본 업종 기반 fallback (명확한 근거가 있는 경우)
    if not tags:
        if category == "카페·베이커리·디저트":
            if "베이커리" in name or "빵" in name:
                tags.add("베이커리")
            elif "떡" in name:
                tags.add("디저트")
            else:
                tags.add("카페")
        elif "고기" in note or "삼겹살" in note or "갈비" in note:
            tags.add("고기·구이")
        elif "칼국수" in note or "국수" in note:
            tags.add("국수·면")
        elif "중식" in note or "중국집" in note:
            tags.add("중식")
        elif "스시" in note or "초밥" in note:
            tags.add("일식")

    if not tags:
        return ["미분류"], "미분류"
    
    return sorted(list(tags)), "추론"

# 행정구역 코드 매핑 (법정동 / 행정동 기준)
REGION_CODES = {
    "와부읍": ("4136025000", "와부읍", "읍"),
    "진접읍": ("4136025300", "진접읍", "읍"),
    "화도읍": ("4136025600", "화도읍", "읍"),
    "진건읍": ("4136025900", "진건읍", "읍"),
    "오남읍": ("4136026200", "오남읍", "읍"),
    "별내면": ("4136031000", "별내면", "면"),
    "퇴계원읍": ("4136026500", "퇴계원읍", "읍"),
    "수동면": ("4136034000", "수동면", "면"),
    "조안면": ("4136036000", "조안면", "면"),
    "호평동": ("4136051000", "호평동", "행정동"),
    "평내동": ("4136052000", "평내동", "행정동"),
    "금곡동": ("4136053000", "금곡동", "행정동"),
    "다산동": ("4136054500", "다산동", "행정동"),
    "별내동": ("4136057000", "별내동", "행정동"),
    "삼패동": ("4136054000", "양정동(삼패동)", "법정동"),
    "일패동": ("4136054000", "양정동(일패동)", "법정동"),
    "수석동": ("4136056500", "다산2동(수석동)", "법정동")
}

def geocode_vworld(address):
    for addr_type in ["ROAD", "PARCEL"]:
        params = {
            "service": "address",
            "request": "getcoord",
            "version": "2.0",
            "crs": "epsg:4326",
            "address": address,
            "refine": "true",
            "simple": "false",
            "format": "json",
            "type": addr_type,
            "key": VWORLD_KEY
        }
        url = "https://api.vworld.kr/req/address?" + urllib.parse.urlencode(params)
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                res = json.loads(resp.read().decode('utf-8'))
                if res.get("response", {}).get("status") == "OK":
                    p = res["response"]["result"]["point"]
                    return float(p["x"]), float(p["y"])
        except Exception:
            pass
        time.sleep(0.01)
    return None

def main():
    print(f"Reading CSV from: {CSV_PATH}")
    rows = []
    with open(CSV_PATH, mode='r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for i, r in enumerate(reader, 1):
            rows.append({
                "num": i,
                "region": r["지역"].strip(),
                "category": r["분류"].strip(),
                "name": r["식당/상호명"].strip(),
                "address": r["도로명 주소 / 위치"].strip(),
                "note": r["비고"].strip()
            })

    print(f"Total rows in CSV: {len(rows)}")

    # 결과 데이터 생성
    os.makedirs(os.path.dirname(OUTPUT_JSON_PATH), exist_ok=True)
    
    # 캐시 파일이 있으면 로드
    cache_path = os.path.join(BASE_DIR, "scripts", "geocode_cache.json")
    cache = {}
    if os.path.exists(cache_path):
        try:
            with open(cache_path, "r", encoding="utf-8") as cf:
                cache = json.load(cf)
        except Exception:
            cache = {}

    places = []
    geocode_ok = 0
    geocode_fail = 0

    for item in rows:
        place_id = f"NYJ-{item['num']:03d}"
        raw_addr = item["address"]
        norm_addr = clean_address(raw_addr)
        
        # 지오코딩 캐시 확인
        pt = None
        if norm_addr in cache:
            pt = cache[norm_addr]
        else:
            pt = geocode_vworld(norm_addr)
            if not pt and raw_addr != norm_addr:
                pt = geocode_vworld(raw_addr)
            if pt:
                cache[norm_addr] = pt

        # 바운딩 박스 검증 (남양주시 인근 범위)
        if pt and (127.0 <= pt[0] <= 127.5) and (37.45 <= pt[1] <= 37.95):
            lng, lat = pt[0], pt[1]
            geo_status = "정상"
            geo_source = "VWorld Geocoder"
            geocode_ok += 1
        else:
            lng, lat = None, None
            geo_status = "위치 확인 중"
            geo_source = None
            geocode_fail += 1

        # 음식 태그 추출
        food_tags, class_status = extract_food_tags(item["name"], item["category"], item["note"])

        # 행정경계 코드
        b_code, b_name, b_type = REGION_CODES.get(item["region"], (None, item["region"], "미확인"))

        place_obj = {
            "id": place_id,
            "name": item["name"],
            "sourceRegion": item["region"],
            "businessCategory": item["category"],
            "address": raw_addr,
            "normalizedAddress": norm_addr,
            "note": item["note"] if item["note"] else None,
            "foodTags": food_tags,
            "classificationStatus": class_status,
            "longitude": lng,
            "latitude": lat,
            "geocodeStatus": geo_status,
            "geocodeSource": geo_source,
            "boundaryCode": b_code,
            "boundaryName": b_name,
            "boundaryType": b_type,
            "imageUrl": None,
            "instagramUrl": None,
            "verifiedAt": None
        }
        places.append(place_obj)

    # 캐시 저장
    with open(cache_path, "w", encoding="utf-8") as cf:
        json.dump(cache, cf, ensure_ascii=False, indent=2)

    # 최종 JSON 파일 저장
    with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as out:
        json.dump(places, out, ensure_ascii=False, indent=2)

    print(f"\nSuccessfully generated {len(places)} items in {OUTPUT_JSON_PATH}")
    print(f"- 정상 좌표: {geocode_ok}개")
    print(f"- 위치 확인 중: {geocode_fail}개")
    
    # 카테고리별 집계
    cat_counts = {}
    region_counts = {}
    for p in places:
        c = p["businessCategory"]
        r = p["sourceRegion"]
        cat_counts[c] = cat_counts.get(c, 0) + 1
        region_counts[r] = region_counts.get(r, 0) + 1
    
    print("\n--- 카테고리 집계 ---")
    for k, v in sorted(cat_counts.items()):
        print(f"{k}: {v}")
        
    print("\n--- 지역별 집계 ---")
    for k, v in sorted(region_counts.items()):
        print(f"{k}: {v}")

if __name__ == "__main__":
    main()
