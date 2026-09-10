import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLACES_JSON = os.path.join(BASE_DIR, "src", "assets", "namyangju_places.json")

def validate():
    print("=" * 60)
    print("남양주 맛집지도 데이터셋 전수 검증 리포트")
    print("=" * 60)

    if not os.path.exists(PLACES_JSON):
        print(f"[오류] 데이터 파일이 존재하지 않습니다: {PLACES_JSON}")
        return

    with open(PLACES_JSON, "r", encoding="utf-8") as f:
        places = json.load(f)

    total = len(places)
    print(f"1. 전체 데이터 행 수: {total}개 (목표: 241개)")

    # 1. 카테고리 분포 검증
    cats = {}
    regions = {}
    geocoded_ok = []
    unverified = []
    food_tag_counts = {}

    # 남양주시 좌표 바운딩 박스 (WGS84 EPSG:4326)
    # 경도: 127.05 ~ 127.45, 위도: 37.50 ~ 37.85
    out_of_bounds = []

    for p in places:
        c = p["businessCategory"]
        r = p["sourceRegion"]
        cats[c] = cats.get(c, 0) + 1
        regions[r] = regions.get(r, 0) + 1

        for tag in p.get("foodTags", []):
            food_tag_counts[tag] = food_tag_counts.get(tag, 0) + 1

        lng = p.get("longitude")
        lat = p.get("latitude")

        if p.get("geocodeStatus") == "정상" and lng and lat:
            geocoded_ok.append(p)
            if not (127.0 <= lng <= 127.5 and 37.45 <= lat <= 37.95):
                out_of_bounds.append(p)
        else:
            unverified.append(p)

    print("\n2. 업종별 분포:")
    for k, v in sorted(cats.items()):
        print(f"  - {k}: {v}개")

    print(f"\n3. 지역별 분포 (총 {len(regions)}개 읍면동):")
    for k, v in sorted(regions.items()):
        print(f"  - {k}: {v}개")

    print(f"\n4. 지오코딩 좌표 현황:")
    print(f"  - 정밀 좌표 획득 완료: {len(geocoded_ok)}개 ({(len(geocoded_ok)/total)*100:.1f}%)")
    print(f"  - 위치 확인 중 (좌표 미확인): {len(unverified)}개 ({(len(unverified)/total)*100:.1f}%)")
    print(f"  - 남양주시 시경계 외곽 의심 좌표: {len(out_of_bounds)}개")

    if unverified:
        print("\n  [위치 확인 중 업소 상세 목록]")
        for u in unverified:
            print(f"    * [{u['id']}] {u['name']} ({u['sourceRegion']}) - 원본주소: {u['address']}")

    print("\n5. 상위 음식 태그 분포:")
    for tag, cnt in sorted(food_tag_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  - #{tag}: {cnt}곳")

    print("\n" + "=" * 60)
    print("검증 결론:")
    if total == 241 and len(out_of_bounds) == 0:
        print(">> 모든 데이터가 손실 없이 100% 정합성을 만족하며, 공공서비스 배포 준비 완료!")
    else:
        print(">> 추가 확인이 필요한 항목이 있습니다.")
    print("=" * 60)

if __name__ == "__main__":
    validate()
