import React from 'react';
import { SlotItem } from './types';
import { KeenIcon } from '@/components';
import EditableCell from './EditableCell';
import { formatDate, getStatusBadge } from './constants';

interface SlotListProps {
  filteredSlots: SlotItem[];
  isLoading: boolean;
  error: string | null;
  serviceType: string;
  editingCell: { id: string; field: string };
  editingValue: string;
  onEditStart: (id: string, field: string) => void;
  onEditChange: (value: string) => void;
  onEditSave: () => void;
  onDeleteSlot: (id: string) => void;
  onOpenMemoModal: (id: string) => void;
}

const SlotList: React.FC<SlotListProps> = ({
  filteredSlots,
  isLoading,
  error,
  serviceType,
  editingCell,
  editingValue,
  onEditStart,
  onEditChange,
  onEditSave,
  onDeleteSlot,
  onOpenMemoModal
}) => {
  if (isLoading) {
    return (
      <div className="text-center py-4">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        {error}
      </div>
    );
  }

  if (filteredSlots.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {serviceType 
          ? '이 서비스 유형에 대한 등록된 슬롯이 없습니다.' 
          : '데이터가 없습니다.'}
      </div>
    );
  }

  return (
    <>
      {/* Desktop View - 테이블 형식 (md 이상) */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="table align-middle text-gray-700 text-sm w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="py-4 px-5 text-start min-w-[180px]">
                  <span className="font-medium text-gray-700">상품명</span>
                </th>
                <th className="py-4 px-5 text-start min-w-[120px]">
                  <span className="font-medium text-gray-700">상태</span>
                </th>
                <th className="py-4 px-5 text-start min-w-[160px]">
                  <span className="font-medium text-gray-700">캠페인명</span>
                </th>
                <th className="py-4 px-5 text-start min-w-[120px]">
                  <span className="font-medium text-gray-700">MID</span>
                </th>
                <th className="py-4 px-5 text-start min-w-[180px]">
                  <span className="font-medium text-gray-700">URL</span>
                </th>
                <th className="py-4 px-5 text-start min-w-[180px]">
                  <span className="font-medium text-gray-700">키워드</span>
                </th>
                <th className="py-4 px-5 text-start min-w-[140px]">
                  <span className="font-medium text-gray-700">등록일</span>
                </th>
                <th className="py-4 px-5 text-end min-w-[120px]">
                  <span className="font-medium text-gray-700">관리</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSlots.map((item) => (
                <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <td className="py-4 px-5">
                    <EditableCell
                      id={item.id}
                      field="productName"
                      value={item.inputData.productName}
                      editingCell={editingCell}
                      editingValue={editingValue}
                      onEditStart={onEditStart}
                      onEditChange={onEditChange}
                      onEditSave={onEditSave}
                    />
                  </td>
                  <td className="py-4 px-5">
                    {getStatusBadge(item.status)}
                    {item.status === 'rejected' && item.rejectionReason && (
                      <div className="mt-1 text-danger text-sm font-medium">
                        사유: {item.rejectionReason}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-5">
                    <div className="group relative">
                      <div className="font-medium text-primary flex items-center">
                        {item.campaign ? item.campaign.campaignName : (item.productId ? `캠페인 #${item.productId}` : '-')}
                        {item.campaign?.status === 'active' && (
                          <span className="ml-2 px-1.5 py-0.5 bg-success/10 text-success text-xs rounded-full">
                            진행중
                          </span>
                        )}
                        <KeenIcon icon="Lock" className="ml-1 size-4 text-muted-foreground" />
                      </div>
                      <div className="absolute hidden group-hover:block bg-black/90 text-white text-xs p-2 rounded-md w-64 z-10 left-0 -bottom-1 transform translate-y-full pointer-events-none">
                        <p className="mb-1"><strong>캠페인:</strong> {item.campaign ? item.campaign.campaignName : '-'}</p>
                        <p className="mb-1"><strong>서비스 타입:</strong> {item.campaign?.serviceType || '-'}</p>
                        <p><em>※ 슬롯 등록 후 캠페인은 변경할 수 없습니다</em></p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <EditableCell
                      id={item.id}
                      field="mid"
                      value={item.inputData.mid}
                      editingCell={editingCell}
                      editingValue={editingValue}
                      onEditStart={onEditStart}
                      onEditChange={onEditChange}
                      onEditSave={onEditSave}
                    />
                  </td>
                  <td className="py-4 px-5">
                    <EditableCell
                      id={item.id}
                      field="url"
                      value={item.inputData.url}
                      editingCell={editingCell}
                      editingValue={editingValue}
                      onEditStart={onEditStart}
                      onEditChange={onEditChange}
                      onEditSave={onEditSave}
                      isUrl={true}
                    />
                  </td>
                  <td className="py-4 px-5">
                    <EditableCell
                      id={item.id}
                      field="keywords"
                      value={item.inputData.keywords.join(',')}
                      editingCell={editingCell}
                      editingValue={editingValue}
                      onEditStart={onEditStart}
                      onEditChange={onEditChange}
                      onEditSave={onEditSave}
                      placeholder="키워드1,키워드2,키워드3"
                    >
                      <div className="flex flex-wrap">
                        {item.inputData.keywords.map((keyword, index) => (
                          <span key={index} className="badge badge-light me-1 mb-1">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </EditableCell>
                  </td>
                  <td className="py-4 px-5 text-gray-800">{formatDate(item.createdAt)}</td>
                  <td className="py-4 px-5 text-end">
                    <div className="flex justify-end gap-2">
                      {item.userReason && (
                        <div className="px-2 py-1 bg-light-primary text-primary rounded text-xs font-medium">메모</div>
                      )}
                      <button 
                        className="btn btn-sm btn-light"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenMemoModal(item.id);
                        }}
                        title="메모"
                      >
                        <KeenIcon icon="note" />
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSlot(item.id);
                        }}
                        title="삭제"
                      >
                        <KeenIcon icon="trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Mobile View - 카드 형식 (md 미만) */}
      <div className="block md:hidden">
        <div className="grid grid-cols-1 gap-4">
          {filteredSlots.map((item) => (
            <div key={item.id} className="card bg-card border border-border p-4">
              <div className="flex flex-col mb-3">
                <div className="flex justify-between items-start">
                  <div className="w-3/4">
                    <EditableCell
                      id={item.id}
                      field="productName"
                      value={item.inputData.productName}
                      editingCell={editingCell}
                      editingValue={editingValue}
                      onEditStart={onEditStart}
                      onEditChange={onEditChange}
                      onEditSave={onEditSave}
                    >
                      <h3 className="font-medium text-md">{item.inputData.productName}</h3>
                    </EditableCell>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
                {item.status === 'rejected' && item.rejectionReason && (
                  <div className="mt-2 text-danger text-sm font-medium">
                    <span className="font-bold">반려 사유:</span> {item.rejectionReason}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="col-span-2 mb-2">
                  <p className="text-muted-foreground mb-1">캠페인명</p>
                  <div className="group relative">
                    <div className="font-medium text-primary flex items-center">
                      {item.campaign ? item.campaign.campaignName : (item.productId ? `캠페인 #${item.productId}` : '-')}
                      {item.campaign?.status === 'active' && (
                        <span className="ml-2 px-1.5 py-0.5 bg-success/10 text-success text-xs rounded-full">
                          진행중
                        </span>
                      )}
                      <KeenIcon icon="Lock" className="ml-1 size-4 text-muted-foreground" />
                    </div>
                    <div className="absolute hidden group-hover:block bg-black/90 text-white text-xs p-2 rounded-md w-64 z-10 left-0 top-full mt-1 pointer-events-none">
                      <p className="mb-1"><strong>캠페인명:</strong> {item.campaign ? item.campaign.campaignName : '-'}</p>
                      <p className="mb-1"><strong>서비스 타입:</strong> {item.campaign?.serviceType || '-'}</p>
                      <p><em>※ 슬롯 등록 후 캠페인은 변경할 수 없습니다</em></p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">MID</p>
                  <EditableCell
                    id={item.id}
                    field="mid"
                    value={item.inputData.mid}
                    editingCell={editingCell}
                    editingValue={editingValue}
                    onEditStart={onEditStart}
                    onEditChange={onEditChange}
                    onEditSave={onEditSave}
                  >
                    <p className="text-foreground">{item.inputData.mid}</p>
                  </EditableCell>
                </div>
                
                <div>
                  <p className="text-muted-foreground mb-1">등록일</p>
                  <p className="text-foreground">{formatDate(item.createdAt)}</p>
                </div>
                
                <div className="col-span-2">
                  <p className="text-muted-foreground mb-1">URL</p>
                  <EditableCell
                    id={item.id}
                    field="url"
                    value={item.inputData.url}
                    editingCell={editingCell}
                    editingValue={editingValue}
                    onEditStart={onEditStart}
                    onEditChange={onEditChange}
                    onEditSave={onEditSave}
                    isUrl={true}
                  >
                    <a href={item.inputData.url} target="_blank" rel="noopener noreferrer" className="text-primary break-all">
                      {item.inputData.url}
                    </a>
                  </EditableCell>
                </div>
                
                <div className="col-span-2">
                  <p className="text-muted-foreground mb-1">키워드</p>
                  <EditableCell
                    id={item.id}
                    field="keywords"
                    value={item.inputData.keywords.join(',')}
                    editingCell={editingCell}
                    editingValue={editingValue}
                    onEditStart={onEditStart}
                    onEditChange={onEditChange}
                    onEditSave={onEditSave}
                    placeholder="키워드1,키워드2,키워드3"
                  >
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.inputData.keywords.map((keyword, index) => (
                        <span key={index} className="badge badge-light">
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </EditableCell>
                </div>
              </div>
              
              <div className="flex justify-end mt-4 gap-2">
                {item.userReason && (
                  <div className="px-2 py-1 bg-light-primary text-primary rounded text-xs font-medium flex items-center">메모 있음</div>
                )}
                <button 
                  className="btn btn-sm btn-light"
                  onClick={() => onOpenMemoModal(item.id)}
                  title="메모"
                >
                  <KeenIcon icon="note" />
                </button>
                <button 
                  className="btn btn-sm btn-danger"
                  onClick={() => onDeleteSlot(item.id)}
                  title="삭제"
                >
                  <KeenIcon icon="trash" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default SlotList;