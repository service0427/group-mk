import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Container } from '@/components';
import { Toolbar, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import { useMenus } from '@/providers';
import { useMenuBreadcrumbs, useMenuCurrentItem } from '@/components';
import { supabase } from '@/supabase';
import { toast } from 'sonner';

import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// 공지사항 유형 정의
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

// 공지사항 상세 컴포넌트
interface NoticeDetailProps {
  notice: Notice | null;
  onClose: () => void;
}

const NoticeDetail: React.FC<NoticeDetailProps> = ({ notice, onClose }) => {
  // 조회수 증가 처리
  useEffect(() => {
    const updateViewCount = async () => {
      if (notice) {
        try {
          // 비로그인 상태에서도 조회수 증가를 허용하기 위해 RLS 정책이 적절히 설정되어 있어야 함
          await supabase
            .from('notice')
            .update({ view_count: (notice.view_count || 0) + 1 })
            .eq('id', notice.id);
        } catch (error) {
          console.error('조회수 업데이트 중 오류 발생:', error);
        }
      }
    };

    updateViewCount();
  }, [notice]);

  if (!notice) return null;

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

  return (
    <div className="space-y-6">
      {/* 공지사항 제목 */}
      <div className="border-b pb-4">
        <div className="flex items-center gap-2 mb-2">
          {notice.is_important && (
            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
              중요
            </span>
          )}
          <h1 className="text-2xl font-bold">{notice.title}</h1>
        </div>
        <div className="text-sm text-muted-foreground">
          <span>등록일: {formatDate(notice.created_at)}</span>
          <span className="mx-2">·</span>
          <span>조회수: {notice.view_count || 0}</span>
        </div>
      </div>

      {/* 공지사항 내용 */}
      <div className="min-h-[200px] whitespace-pre-wrap">
        {notice.content}
      </div>

      {/* 닫기 버튼 */}
      <div className="flex justify-end pt-4 border-t">
        <Button onClick={onClose}>
          닫기
        </Button>
      </div>
    </div>
  );
};

// 일반 공지사항 행 컴포넌트
interface NoticeRowProps {
  notice: Notice;
  index: number;
  onClick: () => void;
}

const NoticeRow: React.FC<NoticeRowProps> = ({ notice, index, onClick }) => {
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

  return (
    <TableRow className="cursor-pointer hover:bg-muted/50" onClick={onClick}>
      <TableCell className="text-center">{index}</TableCell>
      <TableCell>
        <div className="flex items-center">
          {notice.is_important && (
            <span className="mr-2 inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
              중요
            </span>
          )}
          <span className="hover:text-blue-600 font-medium">
            {notice.title}
          </span>
        </div>
      </TableCell>
      <TableCell className="text-center hidden md:table-cell">{notice.view_count || 0}</TableCell>
      <TableCell className="text-center">{formatDate(notice.created_at)}</TableCell>
    </TableRow>
  );
};

// 중요 공지사항 컴포넌트
interface ImportantNoticeProps {
  notice: Notice;
  onClick: () => void;
}

const ImportantNotice: React.FC<ImportantNoticeProps> = ({ notice, onClick }) => {
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

  return (
    <div 
      className="p-4 bg-red-50 border border-red-100 rounded-lg mb-4 cursor-pointer hover:bg-red-100 transition-colors duration-200"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
          <span className="mr-2 inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
            중요
          </span>
          <h3 className="text-lg font-semibold text-red-900">{notice.title}</h3>
        </div>
        <div className="text-sm text-red-700">
          {formatDate(notice.created_at)}
        </div>
      </div>
      <p className="text-red-700 line-clamp-2">{notice.content}</p>
    </div>
  );
};

const NoticePageComponent = () => {
  const { pathname } = useLocation();
  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');
  const menuItem = useMenuCurrentItem(pathname, menuConfig);
  const breadcrumbs = useMenuBreadcrumbs(pathname, menuConfig);

  const [notices, setNotices] = useState<Notice[]>([]);
  const [importantNotices, setImportantNotices] = useState<Notice[]>([]);
  const [normalNotices, setNormalNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // 공지사항 목록 가져오기 - 활성화된 공지사항만 표시
  const fetchNotices = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('notice')
        .select('*')
        .eq('is_active', true)  // 활성화된 공지사항만 조회
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 중요 공지사항과 일반 공지사항 분리
      const important = data?.filter(notice => notice.is_important) || [];
      const normal = data?.filter(notice => !notice.is_important) || [];

      setImportantNotices(important);
      setNormalNotices(normal);
      setNotices(data || []);
    } catch (err: any) {
      console.error('공지사항을 가져오는 중 오류가 발생했습니다:', err);
      setError('공지사항을 불러오는데 실패했습니다.');
      toast.error("공지사항 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 공지사항 가져오기
  useEffect(() => {
    fetchNotices();
  }, []);

  // 공지사항 상세 열기
  const openDetail = (notice: Notice) => {
    setSelectedNotice(notice);
    setIsDetailOpen(true);
  };

  return (
    <>
      <Container fullWidth>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle customTitle="공지사항" />
            <ToolbarDescription>마케팅의 정석 공지사항</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container fullWidth>
        <div className="grid gap-5 lg:gap-7.5">
          <div className="bg-card rounded-lg shadow-sm overflow-hidden">
            <div className="p-5 border-b">
              <h3 className="text-lg font-medium text-card-foreground">공지사항 목록</h3>
            </div>

            <div className="p-4">
              {isLoading ? (
                <div className="p-8 flex justify-center items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-500">
                  <p>{error}</p>
                  <Button 
                    variant="outline" 
                    onClick={fetchNotices}
                    className="mt-4"
                  >
                    다시 시도
                  </Button>
                </div>
              ) : (
                <>
                  {/* 중요 공지사항 (상단 고정) */}
                  {importantNotices.length > 0 && (
                    <div className="mb-6">
                      {importantNotices.map((notice) => (
                        <ImportantNotice 
                          key={notice.id}
                          notice={notice}
                          onClick={() => openDetail(notice)}
                        />
                      ))}
                    </div>
                  )}

                  {/* 일반 공지사항 테이블 */}
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px] text-center">No</TableHead>
                          <TableHead>제목</TableHead>
                          <TableHead className="w-[100px] text-center hidden md:table-cell">조회수</TableHead>
                          <TableHead className="w-[120px] text-center">등록일</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {normalNotices.length > 0 ? (
                          normalNotices.map((notice, index) => (
                            <NoticeRow 
                              key={notice.id}
                              notice={notice}
                              index={index + 1}
                              onClick={() => openDetail(notice)}
                            />
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                              {importantNotices.length > 0 
                                ? '일반 공지사항이 없습니다.' 
                                : '공지사항이 없습니다.'}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </div>

            {notices.length > 0 && (
              <div className="p-4 flex justify-center">
                <div className="flex space-x-1">
                  {/* 페이지네이션은 필요시 구현 */}
                  <button
                    className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-primary text-white"
                  >
                    1
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>

      {/* 공지사항 상세 다이얼로그 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
          <div className="bg-background py-4 px-8 border-b">
            <DialogTitle className="text-lg font-medium text-foreground">공지사항</DialogTitle>
          </div>
          <div className="p-8 bg-background">
            <NoticeDetail
              notice={selectedNotice}
              onClose={() => setIsDetailOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { NoticePageComponent };