import React from 'react';
import { Slot } from './types';
import { supabase } from '@/supabase';
import { useEffect, useState } from 'react';

interface SlotDetailsProps {
  slot: Slot;
  selectedServiceType: string;
}

const SlotDetails: React.FC<SlotDetailsProps> = ({ slot, selectedServiceType }) => {
  const [campaignData, setCampaignData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const inputData = slot.input_data;
  
  // 캠페인 정보 로드
  useEffect(() => {
    const loadCampaignData = async () => {
      if (!slot.product_id) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', slot.product_id)
          .maybeSingle();
          
        if (!error && data) {
          setCampaignData(data);
        }
      } catch (err) {
        console.error('캠페인 정보 로드 중 오류:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadCampaignData();
  }, [slot.product_id]);
  
  if (!inputData) return <div className="mb-2">데이터 없음</div>;
  
  // 키워드 렌더링 함수 - 키워드 배열이 있다면 사용하고, 아니면 keyword1, keyword2, keyword3 사용
  const renderKeywords = () => {
    // 1. keywords 배열 확인 (가장 우선)
    if (inputData.keywords && Array.isArray(inputData.keywords) && inputData.keywords.length > 0) {
      const keywordsList = inputData.keywords.filter(Boolean); // null, undefined, '' 제거
      
      if (keywordsList.length > 0) {
        return (
          <div className="mb-3">
            <strong>키워드 목록:</strong>
            <div className="flex flex-wrap gap-1 mt-1">
              {keywordsList.map((keyword: string, index: number) => (
                <span key={index} className="badge badge-light-primary">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        );
      }
    }
    
    // 2. 개별 키워드 필드 사용
    const keywordsList = [];
    if (inputData.keyword1) keywordsList.push(inputData.keyword1);
    if (inputData.keyword2) keywordsList.push(inputData.keyword2);
    if (inputData.keyword3) keywordsList.push(inputData.keyword3);
    
    // 3. mainKeyword도 키워드가 없는 경우에만 백업으로 사용
    if (keywordsList.length === 0 && inputData.mainKeyword) {
      keywordsList.push(inputData.mainKeyword);
    }
    
    if (keywordsList.length > 0) {
      return (
        <div className="mb-3">
          <strong>키워드:</strong>
          <div className="flex flex-wrap gap-1 mt-1">
            {keywordsList.map((keyword, index) => (
              <span key={index} className="badge badge-light-primary">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  // 단가 렌더링 - 사용자 요청에 따라 제거됨
  const renderPrice = () => {
    return null;
  };

  // 필요하면 추가할 예정 필요 없다면 이대로 진행

  // 모든 추가 필드를 표시하는 뷰
  return (
    <>
    </>
  );
};

export default SlotDetails;