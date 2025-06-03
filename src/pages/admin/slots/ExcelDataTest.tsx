import React, { useEffect, useState } from 'react';
import { useAuthContext } from '@/auth';
import { supabase } from '@/supabase';
import { CommonTemplate } from '@/components/pageTemplate';
import { Button } from '@/components/ui/button';
import { Slot } from './components/types';

const ExcelDataTest: React.FC = () => {
  const { currentUser } = useAuthContext();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [rawData, setRawData] = useState<any>(null);

  const fetchTestData = async () => {
    if (!currentUser) {
      return;
    }

    setLoading(true);
    try {
      // Supabase 조인 테스트 - 명시적인 외래 키 사용
      const query = supabase
        .from('slots')
        .select(`
          *,
          users!user_id (
            id,
            full_name,
            email
          ),
          campaigns!product_id (
            id,
            campaign_name,
            service_type,
            unit_price,
            min_quantity,
            deadline,
            logo,
            add_info
          )
        `)
        .limit(5); // 테스트용으로 5개만

      const { data, error } = await query;

      if (error) {
        console.error('Query error:', error);
        return;
      }

      setRawData(data);

      if (data) {

        // ApprovePage와 동일한 데이터 변환
        const enrichedSlots = data.map((slot, index) => {

          // users 처리 - 배열 또는 단일 객체일 수 있음
          let user;
          if (Array.isArray(slot.users)) {
            const usersArray = slot.users;
            user = usersArray.length > 0 ? {
              id: usersArray[0].id,
              full_name: usersArray[0].full_name,
              email: usersArray[0].email
            } : undefined;
          } else if (slot.users && typeof slot.users === 'object') {
            // 단일 객체인 경우
            user = {
              id: slot.users.id,
              full_name: slot.users.full_name,
              email: slot.users.email
            };
          }

          // campaigns 처리 - 배열 또는 단일 객체일 수 있음
          let campaign;
          if (Array.isArray(slot.campaigns)) {
            const campaignsArray = slot.campaigns;
            campaign = campaignsArray.length > 0 ? campaignsArray[0] : null;
          } else if (slot.campaigns && typeof slot.campaigns === 'object') {
            // 단일 객체인 경우
            campaign = slot.campaigns;
          }

          const { users, campaigns, ...slotWithoutJoins } = slot;

          let campaignName = campaign?.campaign_name;
          let campaignLogo;

          if (campaign) {
            if (campaign.add_info && typeof campaign.add_info === 'object' && campaign.add_info.logo_url) {
              campaignLogo = campaign.add_info.logo_url;
            } else {
              campaignLogo = campaign.logo;
            }
          }

          const enrichedSlot = {
            ...slotWithoutJoins,
            user,
            campaign_name: campaignName,
            campaign_logo: campaignLogo,
            campaign
          };

          return enrichedSlot;
        });

        setSlots(enrichedSlots as Slot[]);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const testExcelData = () => {
    if (slots.length === 0) {
      return;
    }

    // 엑셀에서 사용할 필드들 테스트
    const testFields = [
      'id',
      'campaign_name',
      'user.email',
      'user.full_name',
      'input_data.productName',
      'service_type',
      'unit_price'
    ];

    slots.forEach((slot, index) => {

      testFields.forEach(field => {
        let value = '';

        switch (field) {
          case 'id':
            value = slot.id;
            break;
          case 'campaign_name':
            value = slot.campaign?.campaign_name || slot.campaign_name || '';
            break;
          case 'user.email':
            value = slot.user?.email || '';
            break;
          case 'user.full_name':
            value = slot.user?.full_name || '';
            break;
          case 'input_data.productName':
            value = slot.input_data?.productName || '';
            break;
          case 'service_type':
            value = slot.campaign?.service_type || '';
            break;
          case 'unit_price':
            value = slot.campaign?.unit_price ? String(slot.campaign.unit_price) : '';
            break;
        }
      });
    });
  };

  return (
    <CommonTemplate
      title="엑셀 데이터 테스트"
      description="엑셀 다운로드 데이터 확인"
    >
      <div className="p-6 space-y-4">
        <div className="flex gap-4">
          <Button onClick={fetchTestData} disabled={loading}>
            {loading ? '로딩 중...' : '데이터 가져오기'}
          </Button>

          <Button
            onClick={testExcelData}
            disabled={slots.length === 0}
            variant="outline"
          >
            엑셀 데이터 테스트
          </Button>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Raw Data (Supabase에서 받은 원본)</h3>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-xs">
            {rawData ? JSON.stringify(rawData, null, 2) : 'No data'}
          </pre>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Enriched Slots (변환된 데이터)</h3>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-xs">
            {slots.length > 0 ? JSON.stringify(slots, null, 2) : 'No data'}
          </pre>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">데이터 요약</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">ID</th>
                <th className="border p-2">캠페인명</th>
                <th className="border p-2">사용자 이메일</th>
                <th className="border p-2">사용자 이름</th>
                <th className="border p-2">서비스 타입</th>
                <th className="border p-2">단가</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((slot, index) => (
                <tr key={index}>
                  <td className="border p-2">{slot.id}</td>
                  <td className="border p-2">{slot.campaign?.campaign_name || slot.campaign_name || '-'}</td>
                  <td className="border p-2">{slot.user?.email || '-'}</td>
                  <td className="border p-2">{slot.user?.full_name || '-'}</td>
                  <td className="border p-2">{slot.campaign?.service_type || '-'}</td>
                  <td className="border p-2">{slot.campaign?.unit_price ? slot.campaign.unit_price : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </CommonTemplate>
  );
};

export default ExcelDataTest;