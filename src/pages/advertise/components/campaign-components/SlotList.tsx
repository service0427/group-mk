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
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">로딩중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        {error}
      </div>
    );
  }

  if (filteredSlots.length === 0) {
    return (
      <div className="text-center py-8">
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
        <div className="table-responsive">
          <table className="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
            <thead>
              <tr className="fw-bold text-muted">
                <th className="min-w-150px">상품명</th>
                <th className="min-w-100px">상태</th>
                <th className="min-w-100px">MID</th>
                <th className="min-w-150px">URL</th>
                <th className="min-w-120px">키워드</th>
                <th className="min-w-120px">등록일</th>
                <th className="min-w-100px text-end">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredSlots.map((item) => (
                <tr key={item.id} className="cursor-pointer hover:bg-light-light">
                  <td>
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
                  <td>
                    {getStatusBadge(item.status)}
                    {item.status === 'rejected' && item.rejectionReason && (
                      <div className="mt-1 text-danger text-sm font-medium">
                        사유: {item.rejectionReason}
                      </div>
                    )}
                  </td>
                  <td>
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
                  <td>
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
                  <td>
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
                  <td>{formatDate(item.createdAt)}</td>
                  <td>
                    <div className="flex items-center justify-end h-9 gap-2">
                      {item.userReason && (
                        <div className="px-2 py-1 bg-light-primary text-primary rounded text-xs font-medium">메모</div>
                      )}
                      <button 
                        className="btn btn-icon btn-sm btn-light"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenMemoModal(item.id);
                        }}
                        title="메모"
                      >
                        <KeenIcon icon="note" />
                      </button>
                      <button 
                        className="btn btn-icon btn-sm btn-light"
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
            <div key={item.id} className="card border border-gray-200 p-4">
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
                <div>
                  <p className="text-gray-500 mb-1">MID</p>
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
                    <p>{item.inputData.mid}</p>
                  </EditableCell>
                </div>
                
                <div>
                  <p className="text-gray-500 mb-1">등록일</p>
                  <p>{formatDate(item.createdAt)}</p>
                </div>
                
                <div className="col-span-2">
                  <p className="text-gray-500 mb-1">URL</p>
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
                  <p className="text-gray-500 mb-1">키워드</p>
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
              
              <div className="flex justify-end mt-4 items-center h-9 gap-2">
                {item.userReason && (
                  <div className="px-2 py-1 bg-light-primary text-primary rounded text-xs font-medium">메모 있음</div>
                )}
                <button 
                  className="btn btn-icon btn-sm btn-light"
                  onClick={() => onOpenMemoModal(item.id)}
                  title="메모"
                >
                  <KeenIcon icon="note" />
                </button>
                <button 
                  className="btn btn-icon btn-sm btn-light"
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
