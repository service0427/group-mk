import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CommonTemplate } from '@/components/pageTemplate';
import { KeenIcon } from '@/components/keenicons';
import { TipTapEditor } from '@/components/rich-text-editor';
import { supabase } from '@/supabase';
import { toast } from 'sonner';
import { createSystemNotificationForAll } from '@/utils/notification';
import { NotificationPriority } from '@/types/notification';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

const NoticeEditorPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isImportant, setIsImportant] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditing);

  // 원래 공지사항 상태 저장 (수정 모드에서 변경 사항 비교용)
  const [originalNotice, setOriginalNotice] = useState<{
    title: string;
    is_active: boolean;
    is_important: boolean;
  } | null>(null);

  // 공지사항 정보 가져오기 (수정 모드인 경우)
  useEffect(() => {
    const fetchNotice = async () => {
      if (!id) return;
      
      try {
        setIsFetching(true);
        const { data, error } = await supabase
          .from('notice')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        if (data) {
          setTitle(data.title || '');
          setContent(data.content || '');
          setIsActive(data.is_active || false);
          setIsImportant(data.is_important || false);
          
          // 원본 데이터 저장 (수정 후 비교용)
          setOriginalNotice({
            title: data.title || '',
            is_active: data.is_active || false,
            is_important: data.is_important || false
          });
        }
      } catch (error) {
        console.error('공지사항 정보 조회 실패:', error);
        toast.error('공지사항을 불러오는데 실패했습니다.');
        navigate('/admin/site/notice');
      } finally {
        setIsFetching(false);
      }
    };

    if (isEditing) {
      fetchNotice();
    }
  }, [id, isEditing, navigate]);

  // 공지사항 저장 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('제목을 입력해주세요.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isEditing && id) {
        // 기존 공지사항 업데이트
        const { data: updatedNotice, error } = await supabase
          .from('notice')
          .update({
            title,
            content,
            is_active: isActive,
            is_important: isImportant,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        
        // 중요 공지 플래그가 변경된 경우 알림 처리
        if (originalNotice && 
            isActive && 
            isImportant && 
            (!originalNotice.is_important || !originalNotice.is_active)) {
          try {
            await createSystemNotificationForAll({
              title: '[중요] 공지사항이 업데이트되었습니다',
              message: `중요 공지사항: ${title}`,
              link: `/notice/${id}`,
              priority: NotificationPriority.HIGH
            });

          } catch (notifyError) {
            console.error('공지사항 알림 전송 오류:', notifyError);
            // 알림 전송 실패해도 공지사항 수정 자체는 성공으로 처리
          }
        }
        
        toast.success('공지사항이 수정되었습니다.');
      } else {
        // 새 공지사항 등록
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const userId = userData.user?.id;
        
        const { data: newNotice, error } = await supabase
          .from('notice')
          .insert({
            title,
            content,
            is_active: isActive,
            is_important: isImportant,
            author_id: userId, // 현재 로그인한 사용자 ID
            view_count: 0
          })
          .select()
          .single();

        if (error) throw error;
        
        // 중요 공지사항일 경우 시스템 알림 전송
        if (isImportant && isActive) {
          try {
            await createSystemNotificationForAll({
              title: '[중요] 새 공지사항이 등록되었습니다',
              message: `중요 공지사항: ${title}`,
              link: `/notice/${newNotice.id}`,
              priority: NotificationPriority.HIGH
            });
            
          } catch (notifyError) {
            console.error('공지사항 알림 전송 오류:', notifyError);
            // 알림 전송 실패해도 공지사항 등록 자체는 성공으로 처리
          }
        }
        
        toast.success('공지사항이 등록되었습니다.');
      }
      
      // 저장 성공 후 목록 페이지로 이동
      navigate('/admin/site/notice');
    } catch (error) {
      console.error('공지사항 저장 오류:', error);
      toast.error(isEditing ? '공지사항 수정 중 오류가 발생했습니다.' : '공지사항 등록 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 취소 처리
  const handleCancel = () => {
    navigate('/admin/site/notice');
  };

  // 미리보기 기능을 위한 탭 상태
  const [activeTab, setActiveTab] = useState<string>('edit');

  return (
    <CommonTemplate
      title={isEditing ? '공지사항 수정' : '공지사항 작성'}
      description="관리자 메뉴 > 사이트 관리 > 공지사항 관리"
      showPageMenu={false}
    >
      <div className="flex flex-col space-y-4 w-full overflow-hidden px-0">
        <div className="bg-card rounded-lg shadow-sm overflow-hidden border border-border w-full">
          <div className="p-3 sm:p-5 flex justify-between items-center border-b">
            <h3 className="text-base sm:text-lg font-medium text-card-foreground">
              {isEditing ? '공지사항 수정' : '새 공지사항 작성'}
            </h3>
          </div>
          
          <div className="p-3 sm:p-5 w-full overflow-x-hidden">
            {isFetching ? (
              <div className="flex items-center justify-center p-4 sm:p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 w-full max-w-full">
                {/* 설정 옵션 */}
                <div className="flex flex-col gap-4 bg-muted/30 p-3 sm:p-4 rounded-md overflow-hidden w-full">
                  <div className="w-full flex flex-col sm:flex-row items-start">
                    <label htmlFor="isActive" className="text-sm font-medium w-auto mb-2 sm:mb-0 sm:mr-3 sm:w-[100px]">공개 설정</label>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                      <Switch
                        id="isActive"
                        checked={isActive}
                        onCheckedChange={setIsActive}
                        className="data-[state=checked]:bg-primary"
                      />
                      <label htmlFor="isActive" className="text-sm">
                        {isActive ? '표시됨' : '감춰짐'}
                      </label>
                    </div>
                  </div>
                  
                  <div className="w-full flex flex-col sm:flex-row items-start">
                    <label htmlFor="isImportant" className="text-sm font-medium w-auto mb-2 sm:mb-0 sm:mr-3 sm:w-[100px]">중요도 설정</label>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                      <Switch
                        id="isImportant"
                        checked={isImportant}
                        onCheckedChange={setIsImportant}
                        className="data-[state=checked]:bg-primary"
                      />
                      <label htmlFor="isImportant" className="text-sm">
                        {isImportant ? '중요 공지' : '일반 공지'}
                      </label>
                    </div>
                  </div>
                </div>

                {/* 제목 입력 */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-1">제목</label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-background focus:ring-primary focus:border-primary"
                    placeholder="공지사항 제목을 입력하세요"
                    required
                  />
                </div>
                
                {/* 에디터 영역 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">내용</label>
                  </div>
                  
                  <div className="min-h-[200px] sm:min-h-[300px] border rounded-md overflow-hidden max-w-full">
                    <TipTapEditor
                      content={content}
                      onChange={setContent}
                      placeholder="공지사항 내용을 입력하세요..."
                    />
                  </div>
                </div>
              </form>
            )}
          </div>
          
          <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 p-3 sm:p-5 border-t">
            <Button 
              variant="outline" 
              onClick={handleCancel} 
              disabled={isLoading || isFetching}
              className="w-full sm:w-auto"
            >
              <KeenIcon icon="arrow-left" className="mr-2 h-4 w-4" />
              취소
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isLoading || isFetching}
              className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  저장 중...
                </>
              ) : (
                <>
                  <KeenIcon icon={isEditing ? "pencil" : "save"} className="mr-2 h-4 w-4" />
                  {isEditing ? '수정하기' : '등록하기'}
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* 안내 섹션 - 모바일에서는 숨김 */}
        <div className="hidden sm:block bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30 p-5">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-4">
            공지사항 {isEditing ? '수정' : '작성'} 안내
          </h3>
          <div className="space-y-2 text-blue-700 dark:text-blue-200 text-sm">
            <p>• <span className="font-medium text-blue-900 dark:text-blue-100">제목</span>: 명확하고 간결하게 작성해 주세요.</p>
            <p>• <span className="font-medium text-blue-900 dark:text-blue-100">내용</span>: 단락을 나누고 중요한 내용은 강조해 주세요.</p>
            <p>• <span className="font-medium text-blue-900 dark:text-blue-100">표시 설정</span>: '표시됨'으로 설정해야 사용자에게 노출됩니다.</p>
            <p>• <span className="font-medium text-blue-900 dark:text-blue-100">중요도 설정</span>: 중요한 공지는 '중요 공지'로 설정하세요. 상단에 고정됩니다.</p>
            <p>• <span className="font-medium text-blue-900 dark:text-blue-100">이미지</span>: 툴바의 이미지 첨부 버튼을 사용해 이미지를 추가할 수 있습니다.</p>
          </div>
        </div>
        
        {/* 모바일에서만 보이는 간소화된 안내 */}
        <div className="sm:hidden bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30 p-4">
          <details>
            <summary className="font-medium text-blue-900 dark:text-blue-100 cursor-pointer">
              공지사항 {isEditing ? '수정' : '작성'} 안내
            </summary>
            <div className="mt-3 space-y-2 text-blue-700 dark:text-blue-200 text-sm">
              <p>• <span className="font-medium text-blue-900 dark:text-blue-100">제목</span>: 명확하고 간결하게 작성</p>
              <p>• <span className="font-medium text-blue-900 dark:text-blue-100">내용</span>: 단락 구분, 중요 내용 강조</p>
              <p>• <span className="font-medium text-blue-900 dark:text-blue-100">표시 설정</span>: 공개 여부 결정</p>
              <p>• <span className="font-medium text-blue-900 dark:text-blue-100">중요도</span>: 상단 고정 여부 결정</p>
              <p>• <span className="font-medium text-blue-900 dark:text-blue-100">이미지</span>: 툴바에서 이미지 첨부 가능</p>
            </div>
          </details>
        </div>
      </div>
    </CommonTemplate>
  );
};

export default NoticeEditorPage;