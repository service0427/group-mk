import React from 'react';
import { Slot } from './types';

interface SlotDetailsProps {
  slot: Slot;
  selectedServiceType: string;
}

const SlotDetails: React.FC<SlotDetailsProps> = ({ slot, selectedServiceType }) => {
  const inputData = slot.input_data;
  if (!inputData) return <div className="mb-2">데이터 없음</div>;
  
  // 키워드 정보 가져오기 함수
  const getKeywordInfo = (inputData: any) => {
    if (!inputData) return [];
    
    // keywords 배열이 있는지 확인
    if (inputData.keywords && Array.isArray(inputData.keywords)) {
      return inputData.keywords;
    }
    
    // 서비스 타입에 따라 다른 필드에서 키워드 가져오기
    let keyword = null;
    switch (selectedServiceType) {
      case 'NaverTraffic':
      case 'NaverShopTraffic':
      case 'NaverAuto':
        keyword = inputData.keyword;
        break;
      case 'CoupangTraffic':
        keyword = inputData.search_term;
        break;
      case 'NaverPlaceSave':
      case 'NaverPlaceShare':
      case 'NaverPlaceTraffic':
        keyword = inputData.place_name;
        break;
      case 'OhouseTraffic':
        keyword = '오늘의집'; // 특정 키워드가 없는 경우
        break;
      default:
        keyword = inputData.keyword;
        break;
    }
    
    return keyword ? [keyword] : [];
  };
  
  // 키워드 렌더링 함수
  const renderKeywords = () => {
    const keywords = getKeywordInfo(inputData);
    if (keywords.length > 0) {
      return (
        <div className="mb-3">
          <strong>키워드:</strong>
          <div className="flex flex-wrap gap-1 mt-1">
            {keywords.map((keyword, index) => (
              <span key={index} className="badge badge-light">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };
  
  // 서비스 타입에 따라 다른 필드를 렌더링
  let details = null;
  switch (selectedServiceType) {
    case 'NaverTraffic':
    case 'NaverShopTraffic':
      details = (
        <div className="mb-2">
          <strong>네이버 URL:</strong> {inputData.url || '-'}
        </div>
      );
      break;
    case 'NaverPlaceSave':
    case 'NaverPlaceShare':
    case 'NaverPlaceTraffic':
      details = (
        <>
          <div className="mb-2">
            <strong>장소명:</strong> {inputData.place_name || '-'}
          </div>
          <div className="mb-2">
            <strong>장소 ID:</strong> {inputData.place_id || '-'}
          </div>
        </>
      );
      break;
    case 'CoupangTraffic':
      details = (
        <>
          <div className="mb-2">
            <strong>상품 URL:</strong> {inputData.product_url || '-'}
          </div>
          <div className="mb-2">
            <strong>검색어:</strong> {inputData.search_term || '-'}
          </div>
        </>
      );
      break;
    case 'OhouseTraffic':
      details = (
        <div className="mb-2">
          <strong>오늘의집 URL:</strong> {inputData.ohouse_url || '-'}
        </div>
      );
      break;
    case 'NaverAuto':
      details = (
        <div className="mb-2">
          <strong>네이버 ID:</strong> {inputData.naver_id || '-'}
        </div>
      );
      break;
    default:
      details = null;
  }
  
  return (
    <>
      {details}
      {renderKeywords()}
      {!details && (
        <div className="mb-2">
          <strong>상세 정보:</strong>
          <pre className="mt-1 bg-light p-2 rounded" style={{ fontSize: '0.8rem', maxHeight: '200px', overflow: 'auto' }}>
            {JSON.stringify(inputData, null, 2)}
          </pre>
        </div>
      )}
    </>
  );
};

export default SlotDetails;