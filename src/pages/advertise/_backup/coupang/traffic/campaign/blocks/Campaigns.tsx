import { useState } from 'react';
import {
    KeenIcon
} from '@/components';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';

const Campaigns = () => {

    const [searchInput, setSearchInput] = useState('');

    return (

        <div className="card">
            <div className="card-header flex-wrap gap-2 border-b-0 px-5">
                <h3 className="card-title font-medium text-sm">전체 n 개</h3>

                <div className="flex flex-wrap gap-2 lg:gap-5">
                    <div className="flex">
                        <label className="input input-sm">
                            <KeenIcon icon="magnifier" />
                            <input
                                type="text"
                                placeholder="검색어 입력"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                        </label>
                    </div>

                    <div className="flex flex-wrap gap-2.5">
                        <Select defaultValue="all">
                            <SelectTrigger className="w-28" size="sm">
                                <SelectValue placeholder="상태" />
                            </SelectTrigger>
                            <SelectContent className="w-32">
                                <SelectItem value="all">전체</SelectItem>
                                <SelectItem value="approval">승인요청</SelectItem>
                                <SelectItem value="approved">승인완료</SelectItem>
                                <SelectItem value="reject">반려</SelectItem>
                                <SelectItem value="wating">대기중</SelectItem>
                                <SelectItem value="active">진행중</SelectItem>
                                <SelectItem value="pause">임시중단</SelectItem>
                                <SelectItem value="expire">만료</SelectItem>
                                <SelectItem value="force-stop">강제종료</SelectItem>
                            </SelectContent>
                        </Select>

                        <button className="btn btn-sm btn-outline btn-primary">
                            <KeenIcon icon="setting-4" /> 필터 검색
                        </button>
                    </div>
                </div>
            </div>
            <div className="card-body"></div>
            <div className="card-footer"></div>
        </div>
    );
};

export { Campaigns };
