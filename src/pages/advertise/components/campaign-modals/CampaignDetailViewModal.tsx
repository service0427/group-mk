import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle
} from '@/components/ui/dialog';
import { KeenIcon } from '@/components';
import { toAbsoluteUrl } from '@/utils';
import { getStatusColorClass, CampaignDetailData as ICampaignDetailData } from '@/utils/CampaignFormat';

// 기존 인터페이스를 유틸리티에서 가져온 인터페이스로 대체

interface CampaignDetailViewModalProps {
  open: boolean;
  onClose: () => void;
  campaign: ICampaignDetailData | null;
}

const CampaignDetailViewModal: React.FC<CampaignDetailViewModalProps> = ({
  open,
  onClose,
  campaign
}) => {
  if (!campaign) return null;

  // 유틸리티 함수를 사용하므로 로컬 함수가 필요 없습니다

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="bg-background py-4 px-6 border-b">
          <DialogTitle className="text-lg font-medium text-foreground">캠페인 상세정보</DialogTitle>
        </DialogHeader>
        <DialogBody className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-6">
            {/* 헤더 정보 */}
            <div className="flex items-center gap-4">
              <img
                src={campaign.logo.startsWith('/media') ? toAbsoluteUrl(campaign.logo) : toAbsoluteUrl(`/media/${campaign.logo}`)}
                className="rounded-full size-16 shrink-0"
                alt={campaign.campaignName}
                onError={(e) => {
                  // 이미지 로드 실패 시 기본 이미지 사용
                  (e.target as HTMLImageElement).src = toAbsoluteUrl('/media/animal/svg/lion.svg');
                }}
              />
              <div>
                <h2 className="text-xl font-semibold text-foreground">{campaign.campaignName}</h2>
                <div className="mt-1">
                  <span className={`badge ${campaign.status.color} badge-outline rounded-[30px] h-auto py-1`}>
                    <span className={`size-1.5 rounded-full bg-${getStatusColorClass(campaign.status.color)} me-1.5`}></span>
                    {campaign.status.label}
                  </span>
                </div>
              </div>
            </div>

            {/* 캠페인 정보 테이블 */}
            <div className="overflow-hidden border border-border rounded-lg mb-6">
              <table className="min-w-full divide-y divide-border">
                <tbody className="divide-y divide-border">
                  <tr>
                    <th className="px-4 py-3 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                      건당 단가
                    </th>
                    <td className="px-4 py-3 text-md text-foreground">
                      {campaign.unitPrice ? (campaign.unitPrice.endsWith('원') ? campaign.unitPrice : `${campaign.unitPrice} 원`) : '1,000 원'}
                    </td>
                  </tr>
                  <tr>
                    <th className="px-4 py-3 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                      최소수량
                    </th>
                    <td className="px-4 py-3 text-md text-foreground">
                      {campaign.minQuantity ? (campaign.minQuantity.endsWith('개') ? campaign.minQuantity : `${campaign.minQuantity} 개`) : '0 개'}
                    </td>
                  </tr>
                  {campaign.additionalLogic && campaign.additionalLogic !== '없음' && (
                    <tr>
                      <th className="px-4 py-3 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                        추가로직
                      </th>
                      <td className="px-4 py-3 text-md text-foreground">
                        {campaign.additionalLogic ? (campaign.additionalLogic.endsWith('개') ? campaign.additionalLogic : `${campaign.additionalLogic} 개`) : '0 개'}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <th className="px-4 py-3 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                      상승효율
                    </th>
                    <td className="px-4 py-3 text-md text-foreground">
                      {campaign.efficiency ? (campaign.efficiency.endsWith('%') ? campaign.efficiency : `${campaign.efficiency} %`) : '0 %'}
                    </td>
                  </tr>
                  <tr>
                    <th className="px-4 py-3 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                      접수마감시간
                    </th>
                    <td className="px-4 py-3 text-md text-foreground">
                      {campaign.deadline}
                    </td>
                  </tr>
                  <tr>
                    <th className="px-4 py-3 bg-muted text-left text-md font-medium text-muted-foreground uppercase tracking-wider">
                      캠페인 설명
                    </th>
                    <td className="px-4 py-3 text-md text-foreground whitespace-pre-line">
                      {campaign.description}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 캠페인 상세설명 */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-foreground mb-2">캠페인 상세설명</h3>
              <div className="bg-background border border-border p-4 rounded text-md text-foreground whitespace-pre-line">
                {campaign.detailedDescription ? 
                  campaign.detailedDescription : 
                  (campaign.description || '상세 설명이 없습니다.')}
              </div>
            </div>
            
            {/* 가이드라인 */}
            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">캠페인 가이드라인</h3>
              <div className="bg-muted p-4 rounded text-md text-muted-foreground">
                <ul className="list-disc list-inside space-y-1">
                  <li>해당 캠페인 건당 단가는 {campaign.unitPrice || '1,000'}원입니다.</li>
                  <li>캠페인 접수 시간은 {campaign.deadline}까지 입니다.</li>
                  <li>최소 작업 수량은 {campaign.minQuantity}개 입니다.</li>
                  {campaign.additionalLogic && campaign.additionalLogic !== '없음' && (
                    <li>추가로직 필요 수량은 {campaign.additionalLogic}입니다.</li>
                  )}
                  <li>데이터는 24시간 내에 집계되며, 결과는 대시보드에서 확인할 수 있습니다.</li>
                </ul>
              </div>
            </div>
          </div>
        </DialogBody>
        <DialogFooter className="px-6 py-4 border-t flex justify-end">
          <button onClick={onClose} className="btn btn-md btn-primary">
            확인
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { CampaignDetailViewModal };