import { Fragment } from 'react';
import { BlockList } from '@/pages/account/security/privacy-settings';
import { MiscCreateTeam } from '@/partials/misc';
import { toAbsoluteUrl } from '@/utils';
// 임포트 문제 수정
import { StatCard, DataTable } from '@/pages/dashboards/components';

const DashboardContent = () => {
    return (
        <div className="grid gap-5 lg:gap-7.5">
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
                        title="Swift Setup for New Teams"
                        subTitle={
                            <Fragment>
                                Enhance team formation and management with easy-to-use tools for communication,
                                <br />
                                task organization, and progress tracking, all in one place.
                            </Fragment>
                        }
                        engage={{
                            path: '/public-profile/teams',
                            label: 'Create Team',
                            btnColor: 'btn-primary'
                        }}
                    />
                </div>

                <div className="lg:col-span-1">
                    {/* Highlights 컴포넌트 대체 */}
                    <StatCard 
                        title="하이라이트"
                        value="100"
                        /* subtitle 속성 제거 - StatCardProps에 존재하지 않음 */
                    />
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-5 lg:gap-7.5 items-stretch">
                <div className="lg:col-span-2">
                    {/* DataTable에 필수 속성 추가 */}
                    <DataTable 
                        title="데이터 테이블"
                        columns={["이름", "상태", "날짜"]}
                        data={[
                            ["데이터 1", "활성", "2023-01-01"],
                            ["데이터 2", "비활성", "2023-01-02"],
                            ["데이터 3", "대기중", "2023-01-03"]
                        ]}
                    />
                </div>
                <div className="lg:col-span-1">
                    <BlockList
                        className="h-full"
                        text="Users on the block list are unable to send chat requests or messages to you anymore, ever, or again"
                    />
                </div>
            </div>
        </div>
    );
};

export { DashboardContent };