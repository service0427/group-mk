import { KeenIcon } from "@/components";
import { useState } from "react";

import { CardAdCampaign, CardAdCampaignRow } from '@/partials/cards';

interface IAdCampaignsContentItem {
    logo: string;
    logoSize?: string;
    title: string;
    description: string;
    status: {
        variant: string;
        label: string;
    };
    statistics: Array<{ total: string; description: string }>;
    progress: {
        variant: string;
        value: number;
    };
}
type IAdCampaignsContentItems = Array<IAdCampaignsContentItem>

interface IAdCampaignsContentProps {
    mode: string;
}

const NPlaceSaveIntroContent = ({ mode }: IAdCampaignsContentProps) => {

    // TODO: 햄버거 버튼 추가 및 상세 보기 추가

    const [currentMode, setCurrentMode] = useState(mode);

    const items: IAdCampaignsContentItems = [
        {
            logo: 'lion.svg',
            logoSize: '50px',
            title: '라이언',
            description: '4개 방식을 혼합하여 진행하는 플러스 캠페인(1)',
            status: {
                variant: 'badge-primary',
                label: '진행 중'
            },
            statistics: [
                {
                    total: '60%',
                    description: '🚀상승효율'
                },
                {
                    total: '3종 세트',
                    description: '📌추가로직'
                },
                {
                    total: '100개',
                    description: '📦최소수량'
                },
                {
                    total: '22:00',
                    description: '🕛접수마감'
                }
            ],
            progress: {
                variant: 'progress-warning',
                value: 100
            }
        },
        {
            logo: 'crocodile.svg',
            logoSize: '50px',
            title: '크로커다일',
            description: '4개 방식을 혼합하여 진행하는 플러스 캠페인(2)',
            status: {
                variant: 'badge-primary',
                label: '진행 중'
            },
            statistics: [
                {
                    total: '55%',
                    description: '🚀상승효율'
                },
                {
                    total: '2종 세트',
                    description: '📌추가로직'
                },
                {
                    total: '100개',
                    description: '📦최소수량'
                },
                {
                    total: '22:00',
                    description: '🕛접수마감'
                }
            ],
            progress: {
                variant: 'progress-success',
                value: 100
            }
        },
        {
            logo: 'flamingo.svg',
            logoSize: '50px',
            title: '플라밍고',
            description: '4개 방식을 혼합하여 진행하는 플러스 캠페인(3)',
            status: {
                variant: 'badge-primary',
                label: '진행 중'
            },
            statistics: [
                {
                    total: '53%',
                    description: '🚀상승효율'
                },
                {
                    total: '1종 세트',
                    description: '📌추가로직'
                },
                {
                    total: '100개',
                    description: '📦최소수량'
                },
                {
                    total: '22:00',
                    description: '🕛접수마감'
                }
            ],
            progress: {
                variant: 'progress-danger',
                value: 100
            }
        },
        {
            logo: 'llama.svg',
            logoSize: '50px',
            title: '라마',
            description: '단일 방식을 진행하는 기본형 캠페인(1)',
            status: {
                variant: 'badge-primary',
                label: '진행 중'
            },
            statistics: [
                {
                    total: '40%',
                    description: '🚀상승효율'
                },
                {
                    total: '100개',
                    description: '📦최소수량'
                },
                {
                    total: '22:00',
                    description: '🕛접수마감'
                }
            ],
            progress: {
                variant: 'progress-dark',
                value: 100
            }
        },
        {
            logo: 'teddy-bear.svg',
            logoSize: '50px',
            title: '테디베어',
            description: '단일 방식을 진행하는 기본형 캠페인(2)',
            status: {
                variant: 'badge-primary',
                label: '진행 중'
            },
            statistics: [
                {
                    total: '39%',
                    description: '🚀상승효율'
                },
                {
                    total: '100개',
                    description: '📦최소수량'
                },
                {
                    total: '22:00',
                    description: '🕛접수마감'
                }
            ],
            progress: {
                variant: 'progress-info',
                value: 100
            }
        },
        {
            logo: 'dolphin.svg',
            logoSize: '50px',
            title: '돌핀',
            description: '단일 방식을 진행하는 기본형 캠페인(3)',
            status: {
                variant: 'badge-primary',
                label: '진행 중'
            },
            statistics: [
                {
                    total: '39%',
                    description: '🚀상승효율'
                },
                {
                    total: '100개',
                    description: '📦최소수량'
                },
                {
                    total: '22:00',
                    description: '🕛접수마감'
                }
            ],
            progress: {
                variant: 'progress-primary',
                value: 100
            }
        },
        {
            logo: 'pelican.svg',
            logoSize: '50px',
            title: '펠리칸',
            description: '단일 방식을 진행하는 기본형 캠페인(4)',
            status: {
                variant: 'badge-gray-300',
                label: '준비 중'
            },
            statistics: [
                {
                    total: '-%',
                    description: '🚀상승효율'
                },
                {
                    total: '50개',
                    description: '📦최소수량'
                },
                {
                    total: '22:00',
                    description: '🕛접수마감'
                }
            ],
            progress: {
                variant: 'progress-secondary',
                value: 100
            }
        },
        {
            logo: 'elephant.svg',
            logoSize: '50px',
            title: '엘레펀트',
            description: '단일 방식을 진행하는 기본형 캠페인(5)',
            status: {
                variant: 'badge-gray-300',
                label: '준비 중'
            },
            statistics: [
                {
                    total: '-%',
                    description: '🚀상승효율'
                },
                {
                    total: '50개',
                    description: '📦최소수량'
                },
                {
                    total: '22:00',
                    description: '🕛접수마감'
                }
            ],
            progress: {
                variant: 'progress-gray-3300',
                value: 100
            }
        },
        {
            logo: 'kangaroo.svg',
            logoSize: '50px',
            title: '캥거루',
            description: '단일 방식을 진행하는 기본형 캠페인(6)',
            status: {
                variant: 'badge-gray-300',
                label: '준비 중'
            },
            statistics: [
                {
                    total: '-%',
                    description: '🚀상승효율'
                },
                {
                    total: '50개',
                    description: '📦최소수량'
                },
                {
                    total: '22:00',
                    description: '🕛접수마감'
                }
            ],
            progress: {
                variant: 'progress-gray-3300',
                value: 100
            }
        },
        {
            logo: 'giraffe.svg',
            logoSize: '50px',
            title: '지라프',
            description: '단일 방식을 진행하는 기본형 캠페인(7)',
            status: {
                variant: 'badge-gray-300',
                label: '준비 중'
            },
            statistics: [
                {
                    total: '-%',
                    description: '🚀상승효율'
                },
                {
                    total: '50개',
                    description: '📦최소수량'
                },
                {
                    total: '22:00',
                    description: '🕛접수마감'
                }
            ],
            progress: {
                variant: 'progress-gray-3300',
                value: 100
            }
        }
    ];

    const renderProject = (item: IAdCampaignsContentItem, index: number) => {
        return (
            <CardAdCampaign
                logo={item.logo}
                logoSize={item.logoSize}
                title={item.title}
                description={item.description}
                status={item.status}
                statistics={item.statistics}
                progress={item.progress}
                url="#"
                key={index}
            />
        );
    };

    const renderItem = (data: IAdCampaignsContentItem, index: number) => {
        return (
            <CardAdCampaignRow
                logo={data.logo}
                logoSize={data.logoSize}
                title={data.title}
                description={data.description}
                status={data.status}
                statistics={data.statistics}
                url="#"
                key={index}
            />
        );
    };

    return (
        <div className="flex flex-col items-stretch gap-5 lg:gap-7.5">
            <div className="flex flex-wrap items-center gap-5 justify-between">
                <h3 className="text-lg text-gray-900 font-semibold">총 {items.length} 개의 캠페인</h3>

                <div className="flex gap-5">
                    <div className="btn-tabs" data-tabs="true">
                        <a
                            href="#"
                            className={`btn btn-icon ${currentMode === 'cards' ? 'active' : ''}`}
                            data-tab-toggle="#campaigns_cards"
                            onClick={() => {
                                setCurrentMode('cards');
                            }}
                        >
                            <KeenIcon icon="category" />
                        </a>
                        <a
                            href="#"
                            className={`btn btn-icon ${currentMode === 'list' ? 'active' : ''}`}
                            data-tab-toggle="#campaigns_list"
                            onClick={() => {
                                setCurrentMode('list');
                            }}
                        >
                            <KeenIcon icon="row-horizontal" />
                        </a>
                    </div>
                    {/* 검토 필요 - 신규 캠페인을 추가할 것인지? 10개면 되지 않을까? */}
                    {/* <button className="btn btn-success">
                        <KeenIcon icon="plus-squared" /> 신규 캠페인 추가
                    </button> */}
                </div>
            </div>

            <div id="campaigns_cards" className={currentMode === 'list' ? 'hidden' : ''}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-7.5">
                    {items.map((item, index) => {
                        return renderProject(item, index);
                    })}
                </div>
            </div>

            <div id="campaigns_list" className={currentMode === 'cards' ? 'hidden' : ''}>
                <div className="flex flex-col gap-5 lg:gap-7.5">
                    {items.map((data, index) => {
                        return renderItem(data, index);
                    })}
                </div>
            </div>
        </div>
    );
};

export { NPlaceSaveIntroContent };
