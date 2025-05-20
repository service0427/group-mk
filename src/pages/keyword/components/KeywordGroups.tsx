import React, { useState } from 'react';
import { KeywordGroup } from '../types';
import { useDialog } from '@/providers/DialogProvider';

interface KeywordGroupsProps {
  groups: KeywordGroup[];
  selectedGroupId: number | null;
  onGroupSelect: (groupId: number) => void;
  onCreateGroup: (name: string, isDefault?: boolean) => Promise<boolean>;
  onUpdateGroup: (groupId: number, name: string) => Promise<boolean>;
  onDeleteGroup: (groupId: number) => Promise<boolean>;
  isLoading: boolean;
}

const KeywordGroups: React.FC<KeywordGroupsProps> = ({
  groups,
  selectedGroupId,
  onGroupSelect,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  isLoading,
}) => {
  const [newGroupName, setNewGroupName] = useState('');
  const [isDefaultGroup, setIsDefaultGroup] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // 새 그룹 생성 핸들러
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newGroupName.trim()) return;

    const success = await onCreateGroup(newGroupName.trim(), isDefaultGroup);

    if (success) {
      setNewGroupName('');
      setIsDefaultGroup(false);
      setShowAddForm(false);
    }
  };

  // 그룹 편집 시작
  const handleStartEditing = (group: KeywordGroup) => {
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
  };

  // 그룹 편집 취소
  const handleCancelEditing = () => {
    setEditingGroupId(null);
    setEditingGroupName('');
  };

  // 그룹 편집 저장
  const handleSaveEditing = async (groupId: number) => {
    if (!editingGroupName.trim()) return;

    const success = await onUpdateGroup(groupId, editingGroupName.trim());

    if (success) {
      setEditingGroupId(null);
      setEditingGroupName('');
    }
  };

  // 그룹 삭제 핸들러
  const { showDialog } = useDialog();
  
  const handleDeleteGroup = async (groupId: number) => {
    showDialog({
      title: '그룹 삭제',
      message: '이 그룹을 삭제하시겠습니까? 그룹에 속한 모든 키워드도 함께 삭제됩니다.',
      confirmText: '삭제',
      cancelText: '취소',
      variant: 'destructive',
      onConfirm: async () => {
        await onDeleteGroup(groupId);
      }
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">그룹 관리</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={`flex items-center px-3 py-1 rounded text-sm font-medium ${showAddForm
              ? "bg-orange-500 hover:bg-orange-600 text-white"
              : "bg-green-500 hover:bg-green-600 text-white"
            }`}
        >
          <span className="mr-1">{showAddForm ? '취소' : '새 그룹'}</span>
          {!showAddForm && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
          )}
        </button>
      </div>

      {/* 새 그룹 추가 폼 */}
      {showAddForm && (
        <form onSubmit={handleCreateGroup} className="mb-4">
          <div className="flex flex-col space-y-2">
            <div className="flex">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="그룹 이름"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-r disabled:opacity-50 font-semibold"
                disabled={isLoading || !newGroupName.trim()}
              >
                추가
              </button>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isDefaultGroup"
                checked={isDefaultGroup}
                onChange={(e) => setIsDefaultGroup(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <label htmlFor="isDefaultGroup" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                기본 그룹으로 설정
              </label>
            </div>
          </div>
        </form>
      )}

      {/* 그룹 목록 */}
      <div className="space-y-1 max-h-80 overflow-y-auto">
        {groups.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            {isLoading ? '그룹 로딩 중...' : '등록된 그룹이 없습니다.'}
          </p>
        ) : (
          groups.map((group) => (
            <div
              key={group.id}
              className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${selectedGroupId === group.id
                  ? 'bg-green-100 dark:bg-green-800 border-l-4 border-green-500 shadow-md scale-105 transform transition-all'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
            >
              {/* 그룹 선택 영역 */}
              <div
                className="flex-1 flex items-center"
                onClick={() => onGroupSelect(group.id)}
              >
                {editingGroupId === group.id ? (
                  <input
                    type="text"
                    value={editingGroupName}
                    onChange={(e) => setEditingGroupName(e.target.value)}
                    className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center">
                    <span className={`text-sm font-medium ${selectedGroupId === group.id ? 'text-green-800 dark:text-green-300 font-bold' : 'dark:text-white'}`}>
                      {group.name}
                    </span>
                    {group.isDefault && (
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded ${selectedGroupId === group.id
                          ? 'bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-300'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                        }`}>
                        기본
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 그룹 액션 버튼 */}
              <div className="flex items-center">
                {editingGroupId === group.id ? (
                  <>
                    <button
                      onClick={() => handleSaveEditing(group.id)}
                      className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </button>
                    <button
                      onClick={handleCancelEditing}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEditing(group);
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1"
                      disabled={isLoading}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                      </svg>
                    </button>
                    {!group.isDefault && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGroup(group.id);
                        }}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1"
                        disabled={isLoading}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default KeywordGroups;