import React, { useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Container } from '@/components';
import { Toolbar, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import { useMenus } from '@/providers';
import { useMenuBreadcrumbs, useMenuCurrentItem } from '@/components';
import { KeenIcon } from '@/components/keenicons';

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

// 임시 공지사항 데이터
const dummyNotices = [
  {
    id: 1,
    title: '서비스 점검 안내 (4/25)',
    content: '4월 25일 오전 2시부터 6시까지 서비스 점검이 예정되어 있습니다.',
    isActive: true,
    createdAt: '2025-04-20',
    updatedAt: '2025-04-20',
  },
  {
    id: 2,
    title: '신규 광고 캠페인 출시 안내',
    content: '네이버 쇼핑 트래픽 가중치가 적용된 신규 캠페인이 출시되었습니다.',
    isActive: true,
    createdAt: '2025-04-19',
    updatedAt: '2025-04-19',
  },
  {
    id: 3,
    title: '결제 시스템 업데이트 안내',
    content: '결제 시스템 업데이트로 인해 일부 기능이 변경되었습니다. 자세한 내용은 공지사항을 참고해주세요.',
    isActive: false,
    createdAt: '2025-04-15',
    updatedAt: '2025-04-18',
  },
  {
    id: 4,
    title: '약관 변경 안내',
    content: '서비스 이용약관이 변경되었습니다. 주요 변경사항은 개인정보 처리방침 관련 내용입니다.',
    isActive: true,
    createdAt: '2025-04-10',
    updatedAt: '2025-04-10',
  },
  {
    id: 5,
    title: '포인트 정책 변경 안내',
    content: '2025년 5월부터 포인트 정책이 변경됩니다. 적립률과 사용 방법에 변동이 있으니 확인 바랍니다.',
    isActive: true,
    createdAt: '2025-04-05',
    updatedAt: '2025-04-05',
  },
];

// 공지사항 상세 컴포넌트
interface NoticeDetailProps {
  notice: typeof dummyNotices[0] | null;
  onClose: () => void;
  onUpdate: (id: number, data: any) => void;
  onDelete: (notice: typeof dummyNotices[0]) => void;
}

const NoticeDetail: React.FC<NoticeDetailProps> = ({ notice, onClose, onUpdate, onDelete }) => {
  const [title, setTitle] = useState(notice?.title || '');
  const [content, setContent] = useState(notice?.content || '');
  const [isActive, setIsActive] = useState(notice?.isActive || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (notice) {
      onUpdate(notice.id, { title, content, isActive });
      onClose();
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
          >
            삭제하기
          </Button>
        </div>
        <div className="flex space-x-3">
          <Button 
            type="submit"
            className="bg-primary hover:bg-primary/90 text-white px-4"
          >
            저장하기
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="px-4"
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
  onSave: (data: any) => void;
}

const CreateNotice: React.FC<CreateNoticeProps> = ({ onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ title, content, isActive });
    onClose();
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

      <div className="flex justify-end space-x-3 pt-2 border-t mt-6">
        <Button 
          type="submit"
          className="bg-primary hover:bg-primary/90 text-white px-4"
        >
          등록하기
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose}
          className="px-4"
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
  onConfirm: () => void;
  title: string;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title 
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
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              삭제하기
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="px-4"
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

  const [notices, setNotices] = useState(dummyNotices);
  const [selectedNotice, setSelectedNotice] = useState<typeof dummyNotices[0] | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState<typeof dummyNotices[0] | null>(null);

  // 공지사항 상세 열기
  const openDetail = (notice: typeof dummyNotices[0]) => {
    setSelectedNotice(notice);
    setIsDetailOpen(true);
  };

  // 공지사항 업데이트
  const updateNotice = (id: number, data: any) => {
    setNotices(notices.map(notice =>
      notice.id === id
        ? { ...notice, ...data, updatedAt: new Date().toISOString().split('T')[0] }
        : notice
    ));
  };

  // 새 공지사항 저장
  const saveNewNotice = (data: any) => {
    const newNotice = {
      id: notices.length > 0 ? Math.max(...notices.map(n => n.id)) + 1 : 1,
      ...data,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setNotices([newNotice, ...notices]);
  };

  // 공지사항 삭제 확인 다이얼로그 열기
  const openDeleteConfirm = (notice: typeof dummyNotices[0]) => {
    setNoticeToDelete(notice);
    setIsDeleteConfirmOpen(true);
  };

  // 공지사항 삭제 실행
  const confirmDelete = () => {
    if (noticeToDelete) {
      setNotices(notices.filter(notice => notice.id !== noticeToDelete.id));
      setNoticeToDelete(null);
    }
  };

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle customTitle="공지사항 관리" />
            <ToolbarDescription>관리자 메뉴 &gt; 사이트 관리 &gt; 공지사항 관리</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container>
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
                    notices.map((notice) => (
                      <TableRow key={notice.id}>
                        <TableCell className="text-center">{notice.id}</TableCell>
                        <TableCell>
                          <button
                            className="hover:text-blue-600 text-left font-medium truncate max-w-[250px] md:max-w-[350px] lg:max-w-full block"
                            onClick={() => openDetail(notice)}
                            title={notice.title}
                          >
                            {notice.title}
                          </button>
                        </TableCell>
                        <TableCell className="text-center hidden md:table-cell">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${notice.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                            }`}>
                            {notice.isActive ? '표시' : '감춤'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center hidden md:table-cell">
                          <div className="flex justify-center">
                            <Switch 
                              checked={notice.isActive}
                              onCheckedChange={(checked) => updateNotice(notice.id, { ...notice, isActive: checked })}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm whitespace-nowrap hidden lg:table-cell">{notice.createdAt}</TableCell>
                        <TableCell className="text-center text-sm whitespace-nowrap hidden lg:table-cell">{notice.updatedAt}</TableCell>
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
            </div>

            <div className="p-4 flex justify-center">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((page) => (
                  <button
                    key={page}
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-md ${page === 1
                        ? 'bg-primary text-white'
                        : 'hover:bg-gray-100'
                      }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-sm p-5">
            <h3 className="text-lg font-medium text-card-foreground mb-4">공지사항 관리 안내</h3>
            <div className="space-y-2 text-muted-foreground">
              <p>• 공지사항은 사용자들에게 중요한 정보나 업데이트 내용을 알리는 데 사용됩니다.</p>
              <p>• '표시' 상태로 설정된 공지사항만 사용자에게 노출됩니다.</p>
              <p>• 중요한 공지사항은 메인 페이지 상단에 고정되며, 필요시 팝업으로도 표시할 수 있습니다.</p>
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
      />
    </>
  );
};

export { NoticePageComponent };