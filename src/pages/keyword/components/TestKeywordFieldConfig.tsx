import React from 'react';
import { useKeywordFieldConfig } from '../hooks/useKeywordFieldConfig';

interface TestKeywordFieldConfigProps {
  campaignType: string;
}

export const TestKeywordFieldConfig: React.FC<TestKeywordFieldConfigProps> = ({ campaignType }) => {
  const { config, loading, error, orderedFields } = useKeywordFieldConfig(campaignType);

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>에러: {error}</div>;
  if (!config) return <div>설정이 없습니다 (기본값 사용)</div>;

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-bold mb-4">
        {campaignType} 필드 설정
      </h3>
      
      <div className="mb-4">
        <h4 className="font-semibold">설명:</h4>
        <p>{config.ui_config.description}</p>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold">필드 목록 (순서대로):</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">필드명</th>
              <th className="text-left p-2">라벨</th>
              <th className="text-left p-2">플레이스홀더</th>
              <th className="text-left p-2">필수</th>
              <th className="text-left p-2">순서</th>
            </tr>
          </thead>
          <tbody>
            {orderedFields.map(field => (
              <tr key={field.fieldName} className="border-b">
                <td className="p-2">{field.fieldName}</td>
                <td className="p-2">{field.label}</td>
                <td className="p-2">{field.placeholder}</td>
                <td className="p-2">{field.required ? '✓' : ''}</td>
                <td className="p-2">{field.order}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold">리스트 헤더:</h4>
        <p>{config.ui_config.listHeaders.join(', ')}</p>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold">숨김 필드:</h4>
        <p>{config.ui_config.hiddenFields.join(', ') || '없음'}</p>
      </div>

      <div className="mb-4">
        <h4 className="font-semibold">필수 필드:</h4>
        <p>{config.ui_config.requiredFields.join(', ')}</p>
      </div>
    </div>
  );
};