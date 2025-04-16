import { Fragment } from 'react';
import { useSupabaseAuth } from '@/auth/supabase/SupabaseAuthProvider';
import { MiscCreateTeam } from '@/partials/misc';
import { toAbsoluteUrl } from '@/utils';
import { Highlights } from '..';
import { Alert } from '@/components';
import { KeenIcon } from '@/components/keenicons';

const DashboardContent = () => {
    const { user, profile, isLoading } = useSupabaseAuth();
    
    // 로딩 상태에 따른 컨텐츠 표시
    const renderUserInfo = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center p-8 space-y-4">
                    <div className="animate-spin text-primary">
                        <KeenIcon icon="spinner" className="w-12 h-12" />
                    </div>
                    <p className="text-gray-600">사용자 정보를 불러오는 중입니다...</p>
                </div>
            );
        }
        
        // 사용자 정보가 없는 경우에도 기본 정보 표시
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">사용자 ID</h4>
                    <p className="text-gray-900">{user?.id || '정보 없음'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">이메일</h4>
                    <p className="text-gray-900">{user?.email || '정보 없음'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">권한</h4>
                    <p className="text-gray-900">
                        {profile?.role ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {profile.role}
                            </span>
                        ) : '기본 사용자'}
                    </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">마지막 로그인</h4>
                    <p className="text-gray-900">
                        {user?.last_sign_in_at 
                            ? new Date(user.last_sign_in_at).toLocaleString('ko-KR') 
                            : '정보 없음'}
                    </p>
                </div>
            </div>
        );
    };
    
    return (
        <div className="grid gap-5 lg:gap-7.5">
            {/* 사용자 정보 표시 카드 */}
            <div className="card">
                <div className="card-body p-6">
                    <h3 className="card-title mb-4">로그인 정보</h3>
                    {renderUserInfo()}
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-5 lg:gap-7.5 items-stretch">
                <div className="lg:col-span-2">
                    <MiscCreateTeam
                        image={
                            <Fragment>
                                <img
                                    src={toAbsoluteUrl('/media/illustrations/32.svg')}
                                    className="dark:hidden max-h-[180px]"
                                    alt=""
                                />
                                <img
                                    src={toAbsoluteUrl('/media/illustrations/32-dark.svg')}
                                    className="light:hidden max-h-[180px]"
                                    alt=""
                                />
                            </Fragment>
                        }
                        className="h-full"
                        title="새 팀 설정"
                        subTitle={
                            <Fragment>
                                쉽고 빠르게 팀을 구성하고 관리할 수 있습니다.
                                <br />
                                팀원 초대, 작업 조직화, 진행 상황 추적 등 모든 기능을 한 곳에서 이용하세요.
                            </Fragment>
                        }
                        engage={{
                            path: '/public-profile/teams',
                            label: '팀 생성',
                            btnColor: 'btn-primary'
                        }}
                    />
                </div>

                <div className="lg:col-span-1">
                    <Highlights />
                </div>
            </div>
        </div>
    );
};

export { DashboardContent };
