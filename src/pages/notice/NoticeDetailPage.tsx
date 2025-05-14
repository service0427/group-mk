import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { TipTapViewer } from '@/components/rich-text-editor';
import { useCustomToast } from '@/hooks/useCustomToast';
import { supabase } from '@/supabase';
import { CommonTemplate } from '@/components/pageTemplate';
import { Button } from '@/components/ui/button';
import { KeenIcon } from '@/components/keenicons';
import { toast } from 'sonner';

interface Notice {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  is_important: boolean;
  author_id: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  published_at: string;
  expires_at: string | null;
}

const NoticeDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useCustomToast();

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        setLoading(true);

        if (!id) {
          throw new Error('공지사항 ID가 없습니다.');
        }

        // Supabase에서 공지사항 데이터 가져오기
        const { data, error } = await supabase
          .from('notice')
          .select('*')
          .eq('id', id)
          .eq('is_active', true)
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          throw new Error('공지사항을 찾을 수 없습니다.');
        }

        // 조회수 증가
        await updateViewCount(data);

        setNotice(data);
      } catch (error) {
        console.error('공지사항을 불러오는데 실패했습니다:', error);
        showToast('공지사항을 불러오는데 실패했습니다');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchNotice();
    }
  }, [id, showToast]);

  // 조회수 증가 함수
  const updateViewCount = async (noticeData: Notice) => {
    try {
      await supabase
        .from('notice')
        .update({ view_count: (noticeData.view_count || 0) + 1 })
        .eq('id', noticeData.id);
    } catch (error) {
      console.error('조회수 업데이트 실패:', error);
      // 조회수 업데이트는 실패해도 계속 진행
    }
  };

  // 날짜 형식 변환 함수
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\. /g, '-').replace(/\.$/, '');
  };

  // URL 복사 기능
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('URL이 복사되었습니다.');
    } catch (e) {
      console.error('URL 복사 실패:', e);
      toast.error('URL 복사에 실패했습니다.');
    }
  };

  // 뒤로가기 처리
  const handleGoBack = () => {
    window.history.back();
  };

  if (loading) {
    return (
      <CommonTemplate
        title="공지사항"
        description="마케팅의 정석 공지사항"
        showPageMenu={false}
      >
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2">공지사항을 불러오는 중...</p>
        </div>
      </CommonTemplate>
    );
  }

  if (!notice) {
    return (
      <CommonTemplate
        title="공지사항"
        description="마케팅의 정석 공지사항"
        showPageMenu={false}
      >
        <div className="p-6 text-center">
          <div className="text-lg font-medium text-red-500 mb-2">공지사항을 찾을 수 없습니다</div>
          <p className="text-sm text-gray-500">요청하신 공지사항이 존재하지 않거나 삭제되었습니다.</p>
        </div>
      </CommonTemplate>
    );
  }

  return (
    <CommonTemplate
      title="공지사항"
      description="마케팅의 정석 공지사항"
      showPageMenu={false}
    >
      <div className="bg-card rounded-lg shadow-sm overflow-hidden border border-border">
        {/* 공지사항 헤더 */}
        <div className="border-b p-6">
          <div className="flex items-start mb-3">
            <div
              className="flex-shrink-0 mr-3 cursor-pointer"
              onClick={handleGoBack}
              style={{ marginTop: '24px' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="flex items-center flex-wrap">
                <h1 className="text-2xl font-bold">{notice.title}</h1>
                {notice.is_important && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/50 dark:text-red-300">
                    중요
                  </span>
                )}
              </div>
              <div className="flex flex-wrap text-sm text-muted-foreground gap-x-3 gap-y-1 mt-1">
                <span>등록일: {formatDate(notice.created_at)}</span>
                <span className="hidden md:inline">·</span>
                <span>조회수: {notice.view_count || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 공지사항 내용 */}
        <div className="p-6">
          <TipTapViewer content={notice.content} />
        </div>

        {/* 하단 네비게이션 */}
        <div className="p-6 border-t flex justify-between">
          <button
            onClick={handleGoBack}
            className="btn btn-sm btn-primary"
            title="목록으로"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '6px' }} className="md:mr-2">
              <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden md:inline">목록으로</span>
          </button>

          <button
            onClick={handleCopyUrl}
            className="btn btn-sm btn-primary"
            title="URL 복사"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '6px' }} className="md:mr-2">
              <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="hidden md:inline">URL 복사</span>
          </button>
        </div>
      </div>
    </CommonTemplate>
  );
};

export default NoticeDetailPage;