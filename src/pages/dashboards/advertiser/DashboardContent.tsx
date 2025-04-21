import React, { useEffect, useState } from 'react';
import { StatCard } from '@/pages/dashboards/components';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table';
import { useResponsive } from '@/hooks';
import { formatCurrency, formatCurrencyInTenThousand } from '@/utils/Format';

interface AdvertiserStats {
  campaigns: { count: number; trend: number };
  leads: { count: number; trend: number };
  impressions: { count: number; trend: number };
  clicks: { count: number; trend: number };
}

export const DashboardContent: React.FC = () => {
  // 모바일 화면 감지 (md 이하인지 여부)
  const isMobile = useResponsive('down', 'md');

  const [stats, setStats] = useState<AdvertiserStats>({
    campaigns: { count: 0, trend: 0 },
    leads: { count: 0, trend: 0 },
    impressions: { count: 0, trend: 0 },
    clicks: { count: 0, trend: 0 },
  });

  // 캠페인 폼 상태 관리
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    goal: '',
    budget: '',
    dailyBudget: '',
    startDate: '',
    endDate: ''
  });

  // 캠페인 성과 필터 상태
  const [selectedCampaign, setSelectedCampaign] = useState('여름 신상품 프로모션');

  useEffect(() => {
    // 실제 구현에서는 API 호출
    setStats({
      campaigns: { count: 3, trend: 1 },
      leads: { count: 157, trend: 12 },
      impressions: { count: 45810, trend: 8 },
      clicks: { count: 1254, trend: 15 },
    });
  }, []);

  const campaigns = [
    ['AD-2023-001', '여름 신상품 프로모션', 'ACTIVE', '7월 15일', 250000, '15,000 / 37,500', '40%'],
    ['AD-2023-002', '가을 시즌 특별 할인', 'SCHEDULED', '9월 1일', 350000, '예약 중', '0%'],
    ['AD-2023-003', '겨울 선물 기획전', 'DRAFT', '12월 1일', 500000, '준비 중', '0%'],
  ];

  // 캠페인 폼 상태 업데이트 핸들러
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCampaignForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 캠페인 생성 핸들러
  const handleCreateCampaign = () => {
    // 필수 항목 검증
    if (!campaignForm.name || !campaignForm.goal || !campaignForm.budget) {
      alert('캠페인 이름, 목표, 예산은 필수 항목입니다.');
      return;
    }

    console.log('캠페인 생성:', campaignForm);
    // API 호출 또는 상태 업데이트 로직 구현

    // 폼 초기화
    setCampaignForm({
      name: '',
      goal: '',
      budget: '',
      dailyBudget: '',
      startDate: '',
      endDate: ''
    });
  };

  return (
    <>
      {/* 첫 번째 줄: 4개의 통계 카드 컨테이너 - 반응형 */}
      <div className="container mb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div>
            <StatCard
              title="활성 캠페인"
              value={stats.campaigns.count}
              unit="개"
              trend={stats.campaigns.trend}
              keenIcon="users"
              iconColor="primary"
            />
          </div>
          <div>
            <StatCard
              title="총 리드"
              value={stats.leads.count}
              unit="명"
              trend={stats.leads.trend}
              keenIcon="code"
              iconColor="success"
            />
          </div>
          <div>
            <StatCard
              title="총 노출 수"
              value={stats.impressions.count}
              unit="회"
              trend={stats.impressions.trend}
              keenIcon="database"
              iconColor="warning"
            />
          </div>
          <div>
            <StatCard
              title="총 클릭 수"
              value={stats.clicks.count}
              unit="회"
              trend={stats.clicks.trend}
              keenIcon="timer"
              iconColor="info"
            />
          </div>
        </div>
      </div>

      {/* 두 번째 줄: 캠페인 생성 & 캠페인 목록 */}
      <div className="container mb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <div className="card h-100">
              <div className="card-header border-0 pt-5 pb-0">
                <h3 className="card-title align-items-start flex-column">
                  <span className="card-label fw-bold text-gray-800">캠페인 만들기</span>
                </h3>
              </div>
              <div className="card-body py-3">
                <div className="form-group mb-3">
                  <label className="form-label fw-semibold">캠페인 이름</label>
                  <input
                    type="text"
                    className="input w-full px-2 py-1 border rounded"
                    placeholder="캠페인 이름을 입력하세요"
                    name="name"
                    value={campaignForm.name}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-group mb-3">
                  <label className="form-label fw-semibold">목표</label>
                  <select
                    className="form-select w-full px-2 py-1 border rounded"
                    aria-label="캠페인 목표 선택"
                    name="goal"
                    value={campaignForm.goal}
                    onChange={handleFormChange}
                  >
                    <option value="">목표를 선택하세요</option>
                    <option value="awareness">브랜드 인지도</option>
                    <option value="consideration">고려</option>
                    <option value="conversion">전환</option>
                  </select>
                </div>
                <div className="form-group mb-3">
                  <label className="form-label fw-semibold">예산</label>
                  <div className="input-group flex">
                    <span className="input-group-text px-2 py-1 border rounded-l-md border-r-0 bg-gray-100">₩</span>
                    <input
                      type="number"
                      className="input w-full px-2 py-1 border rounded-r-md border-l-0"
                      placeholder="예산을 입력하세요"
                      name="budget"
                      value={campaignForm.budget}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>
                <div className="form-group mb-3">
                  <label className="form-label fw-semibold">일일 예산 한도</label>
                  <div className="input-group flex">
                    <span className="input-group-text px-2 py-1 border rounded-l-md border-r-0 bg-gray-100">₩</span>
                    <input
                      type="number"
                      className="input w-full px-2 py-1 border rounded-r-md border-l-0"
                      placeholder="일일 한도를 입력하세요"
                      name="dailyBudget"
                      value={campaignForm.dailyBudget}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>
                <div className="form-group mb-3">
                  <label className="form-label fw-semibold">기간</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="date"
                        className="input w-full px-2 py-1 border rounded"
                        name="startDate"
                        value={campaignForm.startDate}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div>
                      <input
                        type="date"
                        className="input w-full px-2 py-1 border rounded"
                        name="endDate"
                        value={campaignForm.endDate}
                        onChange={handleFormChange}
                      />
                    </div>
                  </div>
                </div>
                <button
                  className="btn btn-primary w-100 px-4 py-2 bg-blue-600 text-white rounded"
                  onClick={handleCreateCampaign}
                >
                  캠페인 만들기
                </button>
              </div>
            </div>
          </div>
          <div>
            <div className="card h-100">
              <div className="card-header border-0 pt-5 pb-0">
                <h3 className="card-title align-items-start flex-column">
                  <span className="card-label fw-bold text-gray-800">내 캠페인</span>
                </h3>
                <div className="card-toolbar">
                  <Button variant="outline" size="sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                    </svg>
                    필터
                  </Button>
                </div>
              </div>
              <div className="card-body px-0 overflow-y-auto">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-100 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="py-2 px-4" style={{ minWidth: '200px' }}>캠페인</TableHead>
                        <TableHead className="py-2 px-4 text-center whitespace-nowrap" style={{ minWidth: '100px' }}>상태</TableHead>
                        <TableHead className="py-2 px-4 text-center whitespace-nowrap" style={{ minWidth: '150px' }}>진행률</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.map((campaign, index) => (
                        <TableRow key={index} className="border-b border-gray-200 hover:bg-muted/50">
                          <TableCell className="py-2 px-4">
                            <div className="flex flex-col py-1">
                              <span className="font-medium">{campaign[1]}</span>
                              <span className="text-muted-foreground text-sm">{campaign[0]}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-2 px-4 text-center">
                            <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${campaign[2] === 'ACTIVE'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' :
                                campaign[2] === 'SCHEDULED'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                              }`}>
                              {campaign[2] === 'ACTIVE' ? '진행 중' :
                                campaign[2] === 'SCHEDULED' ? '예약됨' : '초안'}
                            </span>
                          </TableCell>
                          <TableCell className="py-2 px-4 text-center">
                            <div className="flex items-center justify-center">
                              <div className="h-2 w-full rounded bg-gray-200 overflow-hidden mr-2">
                                <div
                                  className="bg-blue-500 h-2 rounded"
                                  style={{ width: campaign[6] }}
                                ></div>
                              </div>
                              <span className="text-muted-foreground whitespace-nowrap ml-1">
                                {campaign[6]}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 세 번째 줄: 캠페인 성과 */}
      <div className="container mb-10">
        <div className="grid grid-cols-1 gap-5">
          <div>
            <div className="card">
              <div className="card-header border-0 pt-5">
                <h3 className="card-title align-items-start flex-column">
                  <span className="card-label fw-bold text-gray-800">캠페인 성과</span>
                </h3>
                <div className="card-toolbar">
                  <select
                    className="form-select form-select-sm form-select-solid px-2 py-1 border rounded"
                    style={{ maxWidth: '200px' }}
                    value={selectedCampaign}
                    onChange={(e) => setSelectedCampaign(e.target.value)}
                  >
                    <option value="여름 신상품 프로모션">여름 신상품 프로모션</option>
                    <option value="가을 시즌 특별 할인">가을 시즌 특별 할인</option>
                    <option value="겨울 선물 기획전">겨울 선물 기획전</option>
                  </select>
                </div>
              </div>
              <div className="card-body py-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <div className="d-flex flex-stack mb-5">
                      <div className="d-flex align-items-center me-5">
                        <div className="symbol symbol-50px me-4">
                          <span className="symbol-label bg-light-primary">
                            <i className="fas fa-eye text-primary fs-2"></i>
                          </span>
                        </div>
                        <div className="d-flex flex-column">
                          <a href="#" className="text-gray-800 text-hover-primary fs-5 fw-bold">노출 수</a>
                          <div className="fs-6 fw-semibold text-gray-500">총 노출: 37,500회</div>
                        </div>
                      </div>
                      <div className="d-flex justify-content-end">
                        <span className="fs-2 fw-bolder text-gray-800">15,000</span>
                      </div>
                    </div>
                    <div className="separator separator-dashed my-3"></div>
                    <div className="d-flex flex-stack mb-5">
                      <div className="d-flex align-items-center me-5">
                        <div className="symbol symbol-50px me-4">
                          <span className="symbol-label bg-light-warning">
                            <i className="fas fa-mouse-pointer text-warning fs-2"></i>
                          </span>
                        </div>
                        <div className="d-flex flex-column">
                          <a href="#" className="text-gray-800 text-hover-primary fs-5 fw-bold">클릭 수</a>
                          <div className="fs-6 fw-semibold text-gray-500">클릭률: 3.2%</div>
                        </div>
                      </div>
                      <div className="d-flex justify-content-end">
                        <span className="fs-2 fw-bolder text-gray-800">480</span>
                      </div>
                    </div>
                    <div className="separator separator-dashed my-3"></div>
                    <div className="d-flex flex-stack mb-5">
                      <div className="d-flex align-items-center me-5">
                        <div className="symbol symbol-50px me-4">
                          <span className="symbol-label bg-light-success">
                            <i className="fas fa-user-check text-success fs-2"></i>
                          </span>
                        </div>
                        <div className="d-flex flex-column">
                          <a href="#" className="text-gray-800 text-hover-primary fs-5 fw-bold">전환 수</a>
                          <div className="fs-6 fw-semibold text-gray-500">전환율: 1.2%</div>
                        </div>
                      </div>
                      <div className="d-flex justify-content-end">
                        <span className="fs-2 fw-bolder text-gray-800">38</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-5">
                      <div className="text-gray-800 fw-bold fs-5 mb-4">진행 상황</div>
                      <div className="progress h-12px rounded mb-3">
                        <div className="progress-bar bg-primary rounded" role="progressbar" style={{ width: '40%' }}></div>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mt-2">
                        <div className="fw-semibold text-gray-500">예산 소진율</div>
                        <div className="fw-bold text-gray-700">40% 완료</div>
                      </div>
                    </div>
                    <div className="card card-bordered border-gray-300 bg-light-primary p-6">
                      <div className="d-flex justify-content-between mb-4">
                        <div className="text-gray-800 fw-bolder fs-6">예산 정보</div>
                        <div className="text-primary fw-bolder fs-6">
                          {isMobile
                            ? formatCurrencyInTenThousand(250000)
                            : formatCurrency(250000)}
                        </div>
                      </div>
                      <div className="d-flex justify-content-between mb-3">
                        <div className="text-gray-600 fw-semibold">소진 금액</div>
                        <div className="text-gray-700 fw-bold">
                          {isMobile
                            ? formatCurrencyInTenThousand(100000)
                            : formatCurrency(100000)}
                        </div>
                      </div>
                      <div className="d-flex justify-content-between mb-3">
                        <div className="text-gray-600 fw-semibold">남은 금액</div>
                        <div className="text-gray-700 fw-bold">
                          {isMobile
                            ? formatCurrencyInTenThousand(150000)
                            : formatCurrency(150000)}
                        </div>
                      </div>
                      <div className="d-flex justify-content-between">
                        <div className="text-gray-600 fw-semibold">1회 클릭당 평균 비용</div>
                        <div className="text-gray-700 fw-bold">
                          {isMobile
                            ? formatCurrencyInTenThousand(208)
                            : formatCurrency(208)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 네 번째 줄: 광고 미리보기 */}
      <div className="container mb-10">
        <div className="grid grid-cols-1 gap-5">
          <div>
            <div className="card">
              <div className="card-header border-0 pt-5">
                <h3 className="card-title align-items-start flex-column">
                  <span className="card-label fw-bold text-gray-800">광고 미리보기</span>
                </h3>
                <div className="card-toolbar">
                  <button className="btn btn-sm btn-primary px-3 py-1 text-sm bg-blue-600 text-white rounded">
                    <i className="fas fa-plus fs-7 me-1"></i> 새 광고 만들기
                  </button>
                </div>
              </div>
              <div className="card-body py-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <div className="card card-bordered shadow-sm h-100">
                      <div className="card-header bg-light-secondary py-5">
                        <div className="d-flex align-items-center justify-content-between w-100">
                          <h3 className="card-title fw-bolder text-gray-800 m-0">이미지 광고</h3>
                          <div>
                            <span className="badge badge-light-success fw-semibold fs-8 px-3 py-2">활성</span>
                          </div>
                        </div>
                      </div>
                      <div className="card-body text-center p-7">
                        <div className="d-flex justify-content-center mb-5">
                          <div className="rounded w-200px h-200px d-flex align-items-center justify-content-center bg-light-secondary">
                            <i className="fas fa-image fs-2x text-gray-400"></i>
                          </div>
                        </div>
                        <div className="mt-5">
                          <h3 className="fw-bolder text-gray-800 mb-3">여름 신상품 프로모션</h3>
                          <p className="text-gray-600 fs-6 mb-6">특별 할인 최대 30%! 한정 수량으로 진행됩니다.</p>
                          <div className="d-flex justify-content-center gap-3">
                            <button className="btn btn-sm btn-primary px-4 py-1 text-sm bg-blue-600 text-white rounded">광고 수정</button>
                            <button className="btn btn-sm btn-light-primary px-4 py-1 text-sm border rounded">통계 보기</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="card card-dashed border-gray-300 bg-light h-100">
                      <div className="card-body text-center p-8 d-flex flex-column justify-content-center">
                        <div className="mb-6">
                          <i className="fas fa-plus-circle fs-2x text-gray-500"></i>
                        </div>
                        <h3 className="fs-2 fw-bolder text-gray-800 mb-3">새 광고 추가하기</h3>
                        <p className="text-gray-600 fs-6 mb-7">
                          다양한 형식의 광고를 만들어 캠페인 효율을 높여보세요. 이미지, 동영상, 캐러셀 등 다양한 형식을 지원합니다.
                        </p>
                        <div>
                          <button className="btn btn-primary px-6 py-2 bg-blue-600 text-white rounded">
                            <i className="fas fa-plus fs-7 me-2"></i> 광고 만들기
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
