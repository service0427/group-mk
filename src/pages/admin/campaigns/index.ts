import { CampaignPage } from './CampaignPage';
import { AllCampaignsPage } from './AllCampaignsPage';
import CampaignManagePage from './CampaignManagePage';

/**
 * 캠페인 관련 컴포넌트 export
 * 
 * - CampaignPage: 통합 캠페인 관리 페이지 (URL 파라미터로 서비스 타입 지정)
 *   - 경로 파라미터 사용: /admin/campaigns/ntraffic
 *   - 쿼리 파라미터 사용: /admin/campaigns?service_type=ntraffic
 * 
 * - AllCampaignsPage: 모든 캠페인 통합 관리 페이지 
 *   - 경로: /admin/campaigns/all
 * 
 * - CampaignManagePage: 새로운 캠페인 관리 페이지
 *   - 경로: /admin/campaigns/manage
 */
export {
  CampaignPage,
  AllCampaignsPage,
  CampaignManagePage
};