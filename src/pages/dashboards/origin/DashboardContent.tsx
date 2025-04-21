import { Fragment } from 'react';
import { BlockList } from '@/pages/account/security/privacy-settings';
import { MiscCreateTeam } from '@/partials/misc';
import { toAbsoluteUrl } from '@/utils';

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
                    <div className="card card-flush h-lg-100">
                        <div className="card-header pt-5">
                            <h3 className="card-title align-items-start flex-column">
                                <span className="card-label fw-bold text-dark">Highlights</span>
                            </h3>
                        </div>
                        <div className="card-body pt-5">
                            <div className="d-flex flex-stack">
                                <div className="text-gray-700 fw-semibold fs-6 me-2">System Stats</div>
                                <div className="d-flex">
                                    <div className="badge badge-info">Active</div>
                                </div>
                            </div>
                            <div className="separator separator-dashed my-3"></div>
                            <div className="d-flex flex-stack">
                                <div className="text-gray-700 fw-semibold fs-6 me-2">User Management</div>
                                <div className="d-flex">
                                    <div className="badge badge-primary">Admin</div>
                                </div>
                            </div>
                            <div className="separator separator-dashed my-3"></div>
                            <div className="d-flex flex-stack">
                                <div className="text-gray-700 fw-semibold fs-6 me-2">Content Updates</div>
                                <div className="d-flex">
                                    <div className="badge badge-warning">Pending</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-5 lg:gap-7.5 items-stretch">
                <div className="lg:col-span-2">
                    <div className="card card-flush h-lg-100">
                        <div className="card-header pt-5">
                            <h3 className="card-title align-items-start flex-column">
                                <span className="card-label fw-bold text-dark">Teams</span>
                            </h3>
                        </div>
                        <div className="card-body pt-5">
                            <div className="d-flex align-items-center bg-light-warning rounded p-5 mb-7">
                                <span className="svg-icon svg-icon-warning me-5">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="currentColor" opacity="0.3" />
                                        <path d="M12 14C12.8284 14 13.5 13.3284 13.5 12.5V8.5C13.5 7.67157 12.8284 7 12 7C11.1716 7 10.5 7.67157 10.5 8.5V12.5C10.5 13.3284 11.1716 14 12 14Z" fill="currentColor" />
                                        <rect x="12" y="16" width="1" height="1" rx="0.5" fill="currentColor" />
                                    </svg>
                                </span>
                                <div className="flex-grow-1 me-2">
                                    <a href="#" className="fw-bold text-gray-800 text-hover-primary fs-6">Developer Team</a>
                                    <span className="text-gray-700 fw-semibold d-block">Active Projects: 5</span>
                                </div>
                                <button className="btn btn-sm btn-light">Details</button>
                            </div>
                            <div className="d-flex align-items-center bg-light-success rounded p-5 mb-7">
                                <span className="svg-icon svg-icon-success me-5">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="currentColor" opacity="0.3" />
                                        <path d="M12 14C12.8284 14 13.5 13.3284 13.5 12.5V8.5C13.5 7.67157 12.8284 7 12 7C11.1716 7 10.5 7.67157 10.5 8.5V12.5C10.5 13.3284 11.1716 14 12 14Z" fill="currentColor" />
                                        <rect x="12" y="16" width="1" height="1" rx="0.5" fill="currentColor" />
                                    </svg>
                                </span>
                                <div className="flex-grow-1 me-2">
                                    <a href="#" className="fw-bold text-gray-800 text-hover-primary fs-6">Marketing Team</a>
                                    <span className="text-gray-700 fw-semibold d-block">Active Projects: 3</span>
                                </div>
                                <button className="btn btn-sm btn-light">Details</button>
                            </div>
                        </div>
                    </div>
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
