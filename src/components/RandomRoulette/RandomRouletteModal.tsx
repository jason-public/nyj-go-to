import React, { useState, useEffect, useMemo } from 'react';
import { Place } from '../../types/place';
import { Dices, X, Sparkles, Compass, ExternalLink, RotateCcw, MapPin, Sun, Moon, Utensils } from 'lucide-react';
import './RandomRouletteModal.css';

// 남양주시 16개 읍면동 목록 (가나다순)
const REGION_OPTIONS = [
  '전체',
  '금곡동',
  '다산동',
  '별내동',
  '별내면',
  '삼패동',
  '수석동',
  '오남읍',
  '와부읍',
  '일패동',
  '조안면',
  '진건읍',
  '진접읍',
  '퇴계원읍',
  '평내동',
  '호평동',
  '화도읍',
];

export type MealType = 'lunch' | 'dinner' | 'all';

interface RandomRouletteModalProps {
  places: Place[];
  isOpen: boolean;
  onClose: () => void;
  onSelectPlace: (place: Place) => void;
  initialRegion?: string;
}

// 현재 시간 기준 스마트 기본 시간대 결정 (10:30 ~ 15:00 점심, 그 외 저녁)
const getDefaultMealType = (): MealType => {
  const currentHour = new Date().getHours();
  if (currentHour >= 10 && currentHour < 15) {
    return 'lunch';
  }
  return 'dinner';
};

// 점심 추천 적합성 판단 로직
const isLunchSuitable = (place: Place): boolean => {
  const lunchTags = ['국수·면', '분식', '베이커리', '카페', '디저트', '일식', '중식', '양식'];
  const hasLunchTag = place.foodTags.some((tag) => lunchTags.includes(tag));
  if (hasLunchTag) return true;

  if (place.foodTags.includes('한식')) {
    const text = `${place.name} ${place.note || ''}`;
    // 저녁 술자리/구이 중심 제외 키워드
    const heavyDinnerKeywords = ['삼겹살', '숯불구이', '갈비', '소고기', '한우', '곱창', '막창', '장어', '조개'];
    const isHeavyDinner = heavyDinnerKeywords.some((k) => text.includes(k));
    if (!isHeavyDinner) return true;

    // 점심으로 선호되는 한식 키워드
    const lunchKeywords = ['순대국', '백숙', '보리밥', '쌈밥', '찌개', '탕', '국밥', '비빔밥', '칼국수', '설렁탕', '곰탕', '백반', '정식'];
    if (lunchKeywords.some((k) => text.includes(k))) return true;
  }

  // 카페·베이커리도 점심 디저트/브런치로 적합
  if (place.businessCategory === '카페·베이커리·디저트') {
    return true;
  }

  return false;
};

// 저녁 추천 적합성 판단 로직
const isDinnerSuitable = (place: Place): boolean => {
  const dinnerTags = ['고기·구이', '해산물', '양식', '중식', '일식'];
  if (place.foodTags.some((tag) => dinnerTags.includes(tag))) {
    return true;
  }

  if (place.foodTags.includes('한식')) {
    // 든든한 저녁 외식 및 가족 식사로 적합
    return true;
  }

  const text = `${place.name} ${place.note || ''}`;
  const dinnerKeywords = ['고기', '갈비', '삼겹살', '스테이크', '회', '구이', '전골', '탕', '닭', '치킨', '맥주', '와인', '다이닝'];
  if (dinnerKeywords.some((k) => text.includes(k))) {
    return true;
  }

  return false;
};

export const RandomRouletteModal: React.FC<RandomRouletteModalProps> = ({
  places,
  isOpen,
  onClose,
  onSelectPlace,
  initialRegion,
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string>(initialRegion || '전체');
  const [mealType, setMealType] = useState<MealType>(getDefaultMealType());
  const [isRolling, setIsRolling] = useState(false);
  const [displayCandidate, setDisplayCandidate] = useState<Place | null>(null);
  const [selectedResult, setSelectedResult] = useState<Place | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  // 모달 열릴 때 초기 설정 동기화
  useEffect(() => {
    if (isOpen) {
      if (initialRegion && initialRegion.trim() !== '') {
        setSelectedRegion(initialRegion);
      } else {
        setSelectedRegion('전체');
      }
      setMealType(getDefaultMealType());
    }
  }, [isOpen, initialRegion]);

  // 각 읍면동별 총 업소 수 집계 (드롭다운 옵션 표시용)
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    places.forEach((p) => {
      counts[p.sourceRegion] = (counts[p.sourceRegion] || 0) + 1;
    });
    return counts;
  }, [places]);

  // 선택된 지역 및 식사 시간대에 따른 후보군 필터링
  const candidatePlaces = useMemo(() => {
    if (!places || places.length === 0) return [];

    // 1. 지역 필터링
    let filtered = selectedRegion === '전체'
      ? places
      : places.filter((p) => p.sourceRegion === selectedRegion);

    if (filtered.length === 0) {
      filtered = places;
    }

    // 2. 점심/저녁 필터링
    let timeFiltered: Place[] = [];
    if (mealType === 'lunch') {
      timeFiltered = filtered.filter(isLunchSuitable);
    } else if (mealType === 'dinner') {
      timeFiltered = filtered.filter(isDinnerSuitable);
    } else {
      timeFiltered = filtered;
    }

    // 3. 만약 시간대 필터 결과가 0건이면 해당 지역 전체 업소로 안전 폴백
    if (timeFiltered.length === 0) {
      setIsFallbackMode(true);
      return filtered;
    } else {
      setIsFallbackMode(false);
      return timeFiltered;
    }
  }, [places, selectedRegion, mealType]);

  // 후보군이 변경되거나 모달이 열리면 자동으로 룰렛 시작
  useEffect(() => {
    if (isOpen && candidatePlaces.length > 0) {
      startRoulette();
    }
  }, [isOpen, selectedRegion, mealType]);

  const startRoulette = () => {
    if (candidatePlaces.length === 0) return;
    setIsRolling(true);
    setSelectedResult(null);

    let counter = 0;
    const maxIterations = 22;
    const intervalTime = 60;

    const timer = setInterval(() => {
      counter++;
      const randomIdx = Math.floor(Math.random() * candidatePlaces.length);
      setDisplayCandidate(candidatePlaces[randomIdx]);

      if (counter >= maxIterations) {
        clearInterval(timer);
        const finalPlace = candidatePlaces[Math.floor(Math.random() * candidatePlaces.length)];
        setDisplayCandidate(finalPlace);
        setSelectedResult(finalPlace);
        setIsRolling(false);
      }
    }, intervalTime);
  };

  if (!isOpen) return null;

  const currentPlace = selectedResult || displayCandidate || candidatePlaces[0];

  return (
    <div className="roulette-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="roulette-modal-title">
      <div className="roulette-modal-card">
        {/* 모달 헤더 */}
        <div className="roulette-modal-header">
          <div className="roulette-title-group">
            <Dices className="roulette-icon" size={24} />
            <h3 id="roulette-modal-title">오늘 뭐 먹지? 맛집 룰렛</h3>
          </div>
          <button type="button" className="roulette-close-btn" onClick={onClose} aria-label="닫기">
            <X size={20} />
          </button>
        </div>

        {/* 상단 컨트롤 영역: 지역 선택 & 점심/저녁 선택 */}
        <div className="roulette-controls-panel">
          {/* 지역 선택 행 */}
          <div className="roulette-control-row">
            <label htmlFor="roulette-region-select" className="control-label">
              <MapPin size={15} className="control-label-icon" />
              <span>지역 설정</span>
            </label>
            <div className="select-wrapper">
              <select
                id="roulette-region-select"
                className="roulette-region-select"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                disabled={isRolling}
              >
                <option value="전체">남양주시 전체 ({places.length}곳)</option>
                {REGION_OPTIONS.filter((r) => r !== '전체').map((region) => (
                  <option key={region} value={region}>
                    {region} ({regionCounts[region] || 0}곳)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 식사 시간대 선택 탭 행 */}
          <div className="roulette-control-row">
            <span className="control-label">
              <Utensils size={15} className="control-label-icon" />
              <span>식사 시간</span>
            </span>
            <div className="roulette-meal-tabs" role="radiogroup" aria-label="식사 시간대 선택">
              <button
                type="button"
                className={`meal-tab-btn ${mealType === 'lunch' ? 'active' : ''}`}
                onClick={() => setMealType('lunch')}
                disabled={isRolling}
                role="radio"
                aria-checked={mealType === 'lunch'}
              >
                <Sun size={15} className="meal-icon-sun" />
                <span>점심</span>
              </button>
              <button
                type="button"
                className={`meal-tab-btn ${mealType === 'dinner' ? 'active' : ''}`}
                onClick={() => setMealType('dinner')}
                disabled={isRolling}
                role="radio"
                aria-checked={mealType === 'dinner'}
              >
                <Moon size={15} className="meal-icon-moon" />
                <span>저녁</span>
              </button>
              <button
                type="button"
                className={`meal-tab-btn ${mealType === 'all' ? 'active' : ''}`}
                onClick={() => setMealType('all')}
                disabled={isRolling}
                role="radio"
                aria-checked={mealType === 'all'}
              >
                <Sparkles size={14} />
                <span>전체</span>
              </button>
            </div>
          </div>

          {/* 현재 조건 요약 배지 */}
          <div className="roulette-filter-summary">
            <span className="summary-region-chip">{selectedRegion}</span>
            <span className="summary-dot">•</span>
            <span className="summary-meal-chip">
              {mealType === 'lunch' && '☀️ 점심 추천'}
              {mealType === 'dinner' && '🌙 저녁 추천'}
              {mealType === 'all' && '✨ 전체 메뉴'}
            </span>
            <span className="summary-count">
              후보 <strong>{candidatePlaces.length}</strong>곳 중 추첨
            </span>
            {isFallbackMode && (
              <span className="summary-fallback-notice">(해당 시간대 메뉴가 적어 지역 전체로 확장)</span>
            )}
          </div>
        </div>

        {/* 룰렛 디스플레이 영역 */}
        <div className="roulette-display-area">
          <div className={`roulette-result-box ${isRolling ? 'rolling' : 'winner'}`}>
            {/* 시간대별 맞춤 추천 뱃지 */}
            <div className="roulette-badge-row">
              <span className="roulette-region-badge">{currentPlace?.sourceRegion}</span>
              {!isRolling && (
                <span className={`meal-recommend-badge ${mealType}`}>
                  {mealType === 'lunch' && '☀️ 든든한 점심 추천!'}
                  {mealType === 'dinner' && '🌙 맛있는 저녁 외식 추천!'}
                  {mealType === 'all' && '✨ 오늘의 럭키 추천!'}
                </span>
              )}
            </div>

            <h2 className="roulette-place-name">{currentPlace?.name}</h2>
            <span className="roulette-category-badge">{currentPlace?.businessCategory}</span>

            {/* 음식 태그 칩 */}
            {currentPlace?.foodTags && currentPlace.foodTags.length > 0 && (
              <div className="roulette-food-tags">
                {currentPlace.foodTags.map((tag) => (
                  <span key={tag} className="roulette-food-tag">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {currentPlace?.note && (
              <p className="roulette-note">“{currentPlace.note}”</p>
            )}

            <p className="roulette-address">{currentPlace?.address}</p>

            {!isRolling && selectedResult && (
              <div className="winner-badge">
                <Sparkles size={14} />
                <span>남양주시 공식 인스타그램 소개 맛집</span>
              </div>
            )}
          </div>
        </div>

        {/* 모달 액션 푸터 */}
        <div className="roulette-modal-footer">
          <button
            type="button"
            className="roulette-rerun-btn"
            onClick={startRoulette}
            disabled={isRolling}
          >
            <RotateCcw size={16} className={isRolling ? 'spinning' : ''} />
            <span>다른 맛집 다시 뽑기</span>
          </button>

          {selectedResult && (
            <div className="roulette-action-group">
              <button
                type="button"
                className="roulette-view-map-btn"
                onClick={() => {
                  onSelectPlace(selectedResult);
                  onClose();
                }}
              >
                <Compass size={16} />
                <span>지도 & 카드에서 보기</span>
              </button>

              <div className="roulette-links-subgroup">
                <a
                  href={`https://map.naver.com/v5/search/${encodeURIComponent(
                    `${selectedResult.name} 남양주`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="roulette-naver-link"
                  aria-label={`${selectedResult.name} 네이버지도 새 창에서 열기`}
                >
                  <span>네이버지도</span>
                  <ExternalLink size={13} />
                </a>

                <a
                  href={`https://map.kakao.com/link/search/${encodeURIComponent(
                    `${selectedResult.name} 남양주`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="roulette-kakao-link"
                  aria-label={`${selectedResult.name} 카카오맵 새 창에서 열기`}
                >
                  <span>카카오맵</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
