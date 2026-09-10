import { FilterState } from '../types/place';

/**
 * URL 쿼리 파라미터로부터 필터 상태를 복원합니다.
 */
export function getFilterStateFromUrl(): Partial<FilterState> {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const state: Partial<FilterState> = {};

  const query = params.get('q');
  if (query) state.searchQuery = query;

  const regions = params.get('regions');
  if (regions) state.selectedRegions = regions.split(',').filter(Boolean);

  const categories = params.get('categories');
  if (categories) state.selectedCategories = categories.split(',').filter(Boolean);

  const tags = params.get('tags');
  if (tags) state.selectedFoodTags = tags.split(',').filter(Boolean);

  const sort = params.get('sort');
  if (sort === 'name' || sort === 'region' || sort === 'distance') {
    state.sortBy = sort;
  }

  const view = params.get('view');
  if (view === 'card' || view === 'table') {
    state.viewMode = view;
  }

  const station = params.get('station');
  if (station) {
    state.selectedStationId = station;
  }

  const fav = params.get('fav');
  if (fav === '1') {
    state.onlyFavorites = true;
  }

  return state;
}

/**
 * 필터 상태를 브라우저 URL 쿼리 파라미터에 동기화합니다. (새로고침 없이 히스토리 업데이트)
 */
export function syncFilterStateToUrl(state: FilterState) {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams();

  if (state.searchQuery.trim()) {
    params.set('q', state.searchQuery.trim());
  }
  if (state.selectedRegions.length > 0) {
    params.set('regions', state.selectedRegions.join(','));
  }
  if (state.selectedCategories.length > 0) {
    params.set('categories', state.selectedCategories.join(','));
  }
  if (state.selectedFoodTags.length > 0) {
    params.set('tags', state.selectedFoodTags.join(','));
  }
  if (state.selectedStationId) {
    params.set('station', state.selectedStationId);
  }
  if (state.onlyFavorites) {
    params.set('fav', '1');
  }
  if (state.sortBy !== 'name') {
    params.set('sort', state.sortBy);
  }
  if (state.viewMode !== 'card') {
    params.set('view', state.viewMode);
  }

  const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
  window.history.replaceState(null, '', newUrl);
}
