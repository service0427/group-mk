import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Container } from '@/components';
import { Toolbar, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import { useMenus } from '@/providers';
import { useMenuBreadcrumbs, useMenuCurrentItem } from '@/components';
import { KeenIcon } from '@/components/keenicons';
import { supabase } from '@/supabase';
import { toast } from 'sonner'; // sonner 라이브러리의 toast 함수 사용

import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

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
  onUpdate: (id: string, data: any) => void;
  onDelete: (notice: Notice) => void;
}

const NoticeDetail: React.FC<NoticeDetailProps> = ({ notice, onClose, onUpdate, onDelete }) => {
  const [title, setTitle] = useState(notice?.title || '');
  const [content, setContent] = useState(notice?.content || '');
  const [isActive, setIsActive] = useState(notice?.is_active || false);
  const [isImportant, setIsImportant] = useState(notice?.is_important || false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (notice) {
      setIsLoading(true);
      try {
        await onUpdate(notice.id, {
          title,
          content,
          is_active: isActive,
          is_important: isImportant
        });
        toast("공지사항이 업데이트 되었습니다.");
        onClose();
      } catch (error) {
        toast.error("공지사항 업데이트 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!notice) return null;

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-5">
        <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">제목</label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-background focus:ring-primary focus:border-primary"
          required
        />
      </div>

      <div className="mb-5">
        <label htmlFor="content" className="block text-sm font-medium text-foreground mb-1">내용</label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full min-h-[300px] p-3 border border-border bg-background text-foreground rounded-md focus:ring-primary focus:border-primary resize-none textarea-visible-border"
          required
        />
      </div>

      <div className="mb-5">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-foreground">표시여부</label>
          <div className="flex items-center gap-2">
            <Switch
              id="isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <label htmlFor="isActive" className="text-sm text-foreground">
              {isActive ? '표시됨' : '감춰짐'}
            </label>
          </div>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-foreground">중요 공지</label>
          <div className="flex items-center gap-2">
            <Switch
              id="isImportant"
              checked={isImportant}
              onCheckedChange={setIsImportant}
            />
            <label htmlFor="isImportant" className="text-sm text-foreground">
              {isImportant ? '중요 공지' : '일반 공지'}
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-between space-x-3 pt-2 border-t mt-6">
        <div>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (notice) {
                onDelete(notice);
              }
              onClose();
            }}
            className="px-4"
            disabled={isLoading}
          >
            삭제하기
          </Button>
        </div>
        <div className="flex space-x-3">
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-white px-4"
            disabled={isLoading}
          >
            {isLoading ? '저장 중...' : '저장하기'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="px-4"
            disabled={isLoading}
          >
            취소
          </Button>
        </div>
      </div>
    </form>
  );
};

// 새 공지사항 작성 컴포넌트
interface CreateNoticeProps {
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

const CreateNotice: React.FC<CreateNoticeProps> = ({ onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isImportant, setIsImportant] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave({
        title,
        content,
        is_active: isActive,
        is_important: isImportant
      });
      toast("공지사항이 등록되었습니다.");
      onClose();
    } catch (error) {
      toast.error("공지사항 등록 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-5">
        <label htmlFor="new-title" className="block text-sm font-medium text-foreground mb-1">제목</label>
        <Input
          id="new-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-background focus:ring-primary focus:border-primary"
          placeholder="공지사항 제목을 입력하세요"
          required
        />
      </div>

      <div className="mb-5">
        <label htmlFor="new-content" className="block text-sm font-medium text-foreground mb-1">내용</label>
        <textarea
          id="new-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="공지사항 내용을 입력하세요"
          className="w-full min-h-[300px] p-3 border border-border bg-background text-foreground rounded-md focus:ring-primary focus:border-primary resize-none textarea-visible-border"
          required
        />
      </div>

      <div className="mb-5">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-foreground">표시여부</label>
          <div className="flex items-center gap-2">
            <Switch
              id="new-isActive"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <label htmlFor="new-isActive" className="text-sm text-foreground">
              {isActive ? '표시됨' : '감춰짐'}
            </label>
          </div>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-foreground">중요 공지</label>
          <div className="flex items-center gap-2">
            <Switch
              id="new-isImportant"
              checked={isImportant}
              onCheckedChange={setIsImportant}
            />
            <label htmlFor="new-isImportant" className="text-sm text-foreground">
              {isImportant ? '중요 공지' : '일반 공지'}
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-2 border-t mt-6">
        <Button
          type="submit"
          className="bg-primary hover:bg-primary/90 text-white px-4"
          disabled={isLoading}
        >
          {isLoading ? '등록 중...' : '등록하기'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="px-4"
          disabled={isLoading}
        >
          취소
        </Button>
      </div>
    </form>
  );
};

// 삭제 확인 대화상자 컴포넌트
interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  isLoading: boolean;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  isLoading
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden">
        <div className="bg-background py-3 px-6 border-b">
          <DialogTitle className="text-lg font-medium text-foreground">삭제 확인</DialogTitle>
        </div>
        <div className="p-6 bg-background">
          <div className="mb-5">
            <p className="text-foreground">
              <span className="font-medium text-foreground">"{title}"</span> 공지사항을 삭제하시겠습니까?
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              이 작업은 되돌릴 수 없습니다.
            </p>
          </div>
          <div className="flex justify-end space-x-3 pt-2 border-t mt-6">
            <Button
              type="button"
              className="bg-red-600 hover:bg-red-700 text-white px-4"
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? '삭제 중...' : '삭제하기'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-4"
              disabled={isLoading}
            >
              취소
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const NoticePageComponent = () => {
  const { pathname } = useLocation();
  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');
  const menuItem = useMenuCurrentItem(pathname, menuConfig);
  const breadcrumbs = useMenuBreadcrumbs(pathname, menuConfig);

  const [notices, setNotices] = useState<Notice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState<Notice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 공지사항 목록 가져오기
  const fetchNotices = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('notice')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
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

  // 공지사항 업데이트
  const updateNotice = async (id: string, data: any) => {
    try {
      const { error } = await supabase
        .from('notice')
        .update({
          title: data.title,
          content: data.content,
          is_active: data.is_active,
          is_important: data.is_important,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      // 업데이트 후 목록 새로고침
      await fetchNotices();
      return;
    } catch (err) {
      console.error('공지사항 업데이트 중 오류 발생:', err);
      throw err;
    }
  };

  // 새 공지사항 저장
  const saveNewNotice = async (data: any) => {
    try {
      // 로그인한 사용자의 ID 가져오기 (예시)
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const userId = userData.user?.id;

      const { error } = await supabase
        .from('notice')
        .insert({
          title: data.title,
          content: data.content,
          is_active: data.is_active,
          is_important: data.is_important,
          author_id: userId, // 로그인한 사용자의 ID 
          view_count: 0
        });

      if (error) throw error;

      // 추가 후 목록 새로고침
      await fetchNotices();
    } catch (err) {
      console.error('공지사항 저장 중 오류 발생:', err);
      throw err;
    }
  };

  // 공지사항 삭제 확인 다이얼로그 열기
  const openDeleteConfirm = (notice: Notice) => {
    setNoticeToDelete(notice);
    setIsDeleteConfirmOpen(true);
  };

  // 공지사항 삭제 실행
  const confirmDelete = async () => {
    if (noticeToDelete) {
      setIsDeleting(true);
      try {
        const { error } = await supabase
          .from('notice')
          .delete()
          .eq('id', noticeToDelete.id);

        if (error) throw error;

        // 삭제 후 목록 새로고침
        await fetchNotices();

        toast("공지사항이 삭제되었습니다.");

        setIsDeleteConfirmOpen(false);
        setNoticeToDelete(null);
      } catch (err) {
        console.error('공지사항 삭제 중 오류 발생:', err);
        toast.error("공지사항 삭제 중 오류가 발생했습니다.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  // 활성 상태 변경 핸들러
  const handleToggleActive = async (notice: Notice, newValue: boolean) => {
    try {
      const { error } = await supabase
        .from('notice')
        .update({
          is_active: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', notice.id);

      if (error) throw error;

      // 업데이트 후 목록 새로고침
      await fetchNotices();

      toast(`공지사항이 ${newValue ? '표시' : '숨김'} 상태로 변경되었습니다.`);
    } catch (err) {
      console.error('상태 변경 중 오류 발생:', err);
      toast.error("상태 변경 중 오류가 발생했습니다.");
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

  return (
    <>
      <Container fullWidth>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle customTitle="공지사항 관리" />
            <ToolbarDescription>관리자 메뉴 &gt; 사이트 관리 &gt; 공지사항 관리</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container fullWidth>
        <div className="grid gap-5 lg:gap-7.5">
          <div className="bg-card rounded-lg shadow-sm overflow-hidden">
            <div className="p-5 flex justify-between items-center border-b">
              <h3 className="text-lg font-medium text-card-foreground">공지사항 목록</h3>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button>새 공지사항</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
                  <div className="bg-background py-4 px-8 border-b">
                    <DialogTitle className="text-lg font-medium text-foreground">새 공지사항 작성</DialogTitle>
                  </div>
                  <div className="p-8 bg-background">
                    <CreateNotice
                      onClose={() => setIsCreateOpen(false)}
                      onSave={saveNewNotice}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="overflow-x-auto">
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px] text-center">No</TableHead>
                      <TableHead>제목</TableHead>
                      <TableHead className="w-[100px] text-center hidden md:table-cell">표시 상태</TableHead>
                      <TableHead className="w-[100px] text-center hidden md:table-cell">표시 설정</TableHead>
                      <TableHead className="w-[90px] text-center hidden lg:table-cell">등록일</TableHead>
                      <TableHead className="w-[90px] text-center hidden lg:table-cell">수정일</TableHead>
                      <TableHead className="w-[100px] text-center">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notices.length > 0 ? (
                      notices.map((notice, index) => (
                        <TableRow key={notice.id}>
                          <TableCell className="text-center">{index + 1}</TableCell>
                          <TableCell>
                            <button
                              className="hover:text-blue-600 text-left font-medium truncate max-w-[250px] md:max-w-[350px] lg:max-w-full block"
                              onClick={() => openDetail(notice)}
                              title={notice.title}
                            >
                              {notice.is_important && (
                                <span className="mr-1 inline-flex items-center justify-center bg-red-100 text-red-800 text-xs font-medium rounded px-1">중요</span>
                              )}
                              {notice.title}
                            </button>
                          </TableCell>
                          <TableCell className="text-center hidden md:table-cell">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${notice.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                              }`}>
                              {notice.is_active ? '표시' : '감춤'}
                            </span>
                          </TableCell>
                          <TableCell className="text-center hidden md:table-cell">
                            <div className="flex justify-center">
                              <Switch
                                checked={notice.is_active}
                                onCheckedChange={(checked) => handleToggleActive(notice, checked)}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-sm whitespace-nowrap hidden lg:table-cell">{formatDate(notice.created_at)}</TableCell>
                          <TableCell className="text-center text-sm whitespace-nowrap hidden lg:table-cell">{formatDate(notice.updated_at)}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center space-x-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => openDetail(notice)}
                                className="h-8 w-8"
                                title="수정"
                              >
                                <KeenIcon icon="pencil" style="outline" className="fs-6" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => openDeleteConfirm(notice)}
                                className="h-8 w-8 hidden sm:inline-flex"
                                title="삭제"
                              >
                                <KeenIcon icon="trash" style="outline" className="fs-6" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          공지사항이 없습니다.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
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

          <div className="bg-card rounded-lg shadow-sm p-5">
            <h3 className="text-lg font-medium text-card-foreground mb-4">공지사항 관리 안내</h3>
            <div className="space-y-2 text-muted-foreground">
              <p>• 공지사항은 사용자들에게 중요한 정보나 업데이트 내용을 알리는 데 사용됩니다.</p>
              <p>• '표시' 상태로 설정된 공지사항만 사용자에게 노출됩니다.</p>
              <p>• '중요 공지'로 설정된 공지사항은 상단에 고정되어 노출됩니다.</p>
            </div>
          </div>
        </div>
      </Container>

      {/* 공지사항 상세 다이얼로그 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
          <div className="bg-background py-4 px-8 border-b">
            <DialogTitle className="text-lg font-medium text-foreground">공지사항 상세</DialogTitle>
          </div>
          <div className="p-8 bg-background">
            <NoticeDetail
              notice={selectedNotice}
              onClose={() => setIsDetailOpen(false)}
              onUpdate={updateNotice}
              onDelete={openDeleteConfirm}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <DeleteConfirmDialog
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title={noticeToDelete?.title || ''}
        isLoading={isDeleting}
      />
    </>
  );
};

export { NoticePageComponent };