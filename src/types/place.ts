// 업소 데이터 타입 정의
export interface Place {
  id: string;                      // 고유 ID (예: NYJ-001)
  name: string;                    // 식당/상호명
  sourceRegion: string;            // 원본 지역 (16개 읍면동)
  businessCategory: '음식점' | '카페·베이커리·디저트' | '기타 먹거리' | string; // 업종
  address: string;                 // 원본 도로명 주소
  normalizedAddress: string;       // 정규화된 지오코딩 주소
  note: string | null;             // 비고 (원본 메뉴/설명/별칭)
  foodTags: string[];              // 음식 종류 태그 (한식, 중식, 고기·구이 등)
  classificationStatus: '확정' | '추론' | '미분류'; // 분류 신뢰도
  longitude: number | null;        // 경도 (EPSG:4326)
  latitude: number | null;         // 위도 (EPSG:4326)
  geocodeStatus: '정상' | '위치 확인 중' | '시경계외_검토필요';
  geocodeSource: string | null;    // 좌표 출처 (예: VWorld Geocoder)
  boundaryCode: string | null;     // 행정구역 코드
  boundaryName: string | null;     // 행정구역 명칭
  boundaryType: string | null;     // 읍, 면, 행정동, 법정동
  imageUrl: string | null;         // 사진 URL (임의 생성 금지, 원본 없을 시 null)
  instagramUrl: string | null;     // 인스타그램 게시물 URL
  verifiedAt: string | null;       // 검증 일시
  distanceKm?: number;             // 사용자 현재 위치로부터의 거리(km)
  isFavorite?: boolean;            // 즐겨찾기(찜) 여부
}

// 필터 상태 인터페이스
export interface FilterState {
  searchQuery: string;             // 통합 검색어 (상호명, 주소, 비고)
  selectedRegions: string[];       // 선택된 읍면동 (복수 선택 OR)
  selectedCategories: string[];    // 선택된 업종 (복수 선택 OR)
  selectedFoodTags: string[];      // 선택된 음식 종류 (복수 선택 OR)
  selectedStationId: string | null;// 선택된 전철역 ID (반경 1.5km 필터)
  onlyFavorites: boolean;          // 찜한 맛집만 모아보기
  sortBy: 'name' | 'region' | 'distance'; // 정렬 기준 (상호명 가나다, 지역명, 내 위치 거리순)
  viewMode: 'card' | 'table';      // 보기 모드 (카드보드 vs 테이블)
}

// 사용자 위치 인터페이스
export interface UserLocation {
  longitude: number;
  latitude: number;
  address?: string;
  accuracy?: number;
}
