import React, { useState } from 'react';
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

// 임시 FAQ 데이터
const dummyFAQs = [
  {
    id: 1,
    question: '캐시 충전은 어떻게 하나요?',
    answer: '캐시 충전은 마이페이지 > 캐시관리 메뉴에서 진행할 수 있습니다. 신용카드, 실시간 계좌이체, 가상계좌 등 다양한 결제수단을 지원합니다.',
    category: '결제',
    isActive: true,
    createdAt: '2025-04-15',
    updatedAt: '2025-04-15',
  },
  {
    id: 2,
    question: '환불 정책은 어떻게 되나요?',
    answer: '충전한 캐시는 미사용 상태에서 결제일로부터 7일 이내에 환불이 가능합니다. 이후에는 부분 사용된 경우 사용 금액을 제외한 금액만 환불됩니다.',
    category: '결제',
    isActive: true,
    createdAt: '2025-04-14',
    updatedAt: '2025-04-16',
  },
  {
    id: 3,
    question: '포인트는 어떻게 사용하나요?',
    answer: '적립된 포인트는 캐시 충전 시 1 포인트 = 1원으로 사용 가능합니다. 최소 1,000 포인트부터 사용 가능하며, 유효기간은 적립일로부터 1년입니다.',
    category: '포인트',
    isActive: true,
    createdAt: '2025-04-10',
    updatedAt: '2025-04-10',
  },
  {
    id: 4,
    question: '계정 정보는 어떻게 변경하나요?',
    answer: '계정 정보 변경은 마이페이지 > 내 정보 관리 메뉴에서 가능합니다. 비밀번호, 연락처, 이메일 등의 정보를 변경할 수 있습니다.',
    category: '계정',
    isActive: false,
    createdAt: '2025-04-08',
    updatedAt: '2025-04-12',
  },
  {
    id: 5,
    question: '광고 집행 결과는 어디서 확인할 수 있나요?',
    answer: '광고 집행 결과는 마이페이지 > 광고 관리 > 집행 현황 메뉴에서 확인할 수 있습니다. 일별, 주별, 월별 통계와 함께 상세 리포트를 제공합니다.',
    category: '광고',
    isActive: true,
    createdAt: '2025-04-05',
    updatedAt: '2025-04-05',
  },
];

// FAQ 카테고리 목록
const faqCategories = ['전체', '결제', '포인트', '계정', '광고', '기타'];

// FAQ 상세 컴포넌트
interface FAQDetailProps {
  faq: typeof dummyFAQs[0] | null;
  onClose: () => void;
  onUpdate: (id: number, data: any) => void;
  onDelete: (faq: typeof dummyFAQs[0]) => void;
}

const FAQDetail: React.FC<FAQDetailProps> = ({ faq, onClose, onUpdate, onDelete }) => {
  const [question, setQuestion] = useState(faq?.question || '');
  const [answer, setAnswer] = useState(faq?.answer || '');
  const [category, setCategory] = useState(faq?.category || '결제');
  const [isActive, setIsActive] = useState(faq?.isActive || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (faq) {
      onUpdate(faq.id, { question, answer, category, isActive });
      onClose();
    }
  };

  if (!faq) return null;

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-5">
        <label htmlFor="category" className="block text-sm font-medium text-foreground mb-1">카테고리</label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-2 border border-border bg-background text-foreground rounded-md focus:ring-primary focus:border-primary"
          required
        >
          {faqCategories.slice(1).map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="mb-5">
        <label htmlFor="question" className="block text-sm font-medium text-foreground mb-1">질문</label>
        <Input
          id="question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full bg-background focus:ring-primary focus:border-primary"
          required
        />
      </div>

      <div className="mb-5">
        <label htmlFor="answer" className="block text-sm font-medium text-foreground mb-1">답변</label>
        <textarea
          id="answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
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
              if (faq) {
                onDelete(faq);
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

// 새 FAQ 작성 컴포넌트
interface CreateFAQProps {
  onClose: () => void;
  onSave: (data: any) => void;
}

const CreateFAQ: React.FC<CreateFAQProps> = ({ onClose, onSave }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('결제');
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ question, answer, category, isActive });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-5">
        <label htmlFor="new-category" className="block text-sm font-medium text-foreground mb-1">카테고리</label>
        <select
          id="new-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-2 border border-border bg-background text-foreground rounded-md focus:ring-primary focus:border-primary"
          required
        >
          {faqCategories.slice(1).map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      
      <div className="mb-5">
        <label htmlFor="new-question" className="block text-sm font-medium text-foreground mb-1">질문</label>
        <Input
          id="new-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full bg-background focus:ring-primary focus:border-primary"
          placeholder="FAQ 질문을 입력하세요"
          required
        />
      </div>

      <div className="mb-5">
        <label htmlFor="new-answer" className="block text-sm font-medium text-foreground mb-1">답변</label>
        <textarea
          id="new-answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="FAQ 답변을 입력하세요"
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
  question: string;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  question 
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
              <span className="font-medium text-foreground">"{question}"</span> FAQ를 삭제하시겠습니까?
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

const FAQPageComponent = () => {
  const { pathname } = useLocation();
  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');
  const menuItem = useMenuCurrentItem(pathname, menuConfig);
  const breadcrumbs = useMenuBreadcrumbs(pathname, menuConfig);

  const [faqs, setFAQs] = useState(dummyFAQs);
  const [selectedFAQ, setSelectedFAQ] = useState<typeof dummyFAQs[0] | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [faqToDelete, setFAQToDelete] = useState<typeof dummyFAQs[0] | null>(null);
  const [activeCategory, setActiveCategory] = useState('전체');

  // FAQ 상세 열기
  const openDetail = (faq: typeof dummyFAQs[0]) => {
    setSelectedFAQ(faq);
    setIsDetailOpen(true);
  };

  // FAQ 업데이트
  const updateFAQ = (id: number, data: any) => {
    setFAQs(faqs.map(faq =>
      faq.id === id
        ? { ...faq, ...data, updatedAt: new Date().toISOString().split('T')[0] }
        : faq
    ));
  };

  // 새 FAQ 저장
  const saveNewFAQ = (data: any) => {
    const newFAQ = {
      id: faqs.length > 0 ? Math.max(...faqs.map(n => n.id)) + 1 : 1,
      ...data,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setFAQs([newFAQ, ...faqs]);
  };

  // FAQ 삭제 확인 다이얼로그 열기
  const openDeleteConfirm = (faq: typeof dummyFAQs[0]) => {
    setFAQToDelete(faq);
    setIsDeleteConfirmOpen(true);
  };

  // FAQ 삭제 실행
  const confirmDelete = () => {
    if (faqToDelete) {
      setFAQs(faqs.filter(faq => faq.id !== faqToDelete.id));
      setFAQToDelete(null);
    }
  };

  // 카테고리별 필터링된 FAQ 목록
  const filteredFAQs = activeCategory === '전체'
    ? faqs
    : faqs.filter(faq => faq.category === activeCategory);

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarPageTitle customTitle="FAQ 관리" />
            <ToolbarDescription>관리자 메뉴 &gt; 사이트 관리 &gt; FAQ 관리</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container>
        <div className="grid gap-5 lg:gap-7.5">
          {/* 카테고리 필터 */}
          <div className="bg-card rounded-lg shadow-sm p-5">
            <div className="flex flex-wrap gap-2">
              {faqCategories.map((category) => (
                <Button
                  key={category}
                  variant={activeCategory === category ? "default" : "outline"}
                  onClick={() => setActiveCategory(category)}
                  className={`${activeCategory === category ? 'bg-primary text-white' : 'bg-white text-gray-700'}`}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-sm overflow-hidden">
            <div className="p-5 flex justify-between items-center border-b">
              <h3 className="text-lg font-medium text-card-foreground">FAQ 목록 ({activeCategory})</h3>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button>새 FAQ 등록</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
                  <div className="bg-background py-4 px-8 border-b">
                    <DialogTitle className="text-lg font-medium text-foreground">새 FAQ 작성</DialogTitle>
                  </div>
                  <div className="p-8 bg-background">
                    <CreateFAQ
                      onClose={() => setIsCreateOpen(false)}
                      onSave={saveNewFAQ}
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
                    <TableHead className="w-[100px] text-center hidden md:table-cell">카테고리</TableHead>
                    <TableHead>질문</TableHead>
                    <TableHead className="w-[100px] text-center hidden md:table-cell">표시 상태</TableHead>
                    <TableHead className="w-[100px] text-center hidden md:table-cell">표시 설정</TableHead>
                    <TableHead className="w-[90px] text-center hidden lg:table-cell">등록일</TableHead>
                    <TableHead className="w-[90px] text-center hidden lg:table-cell">수정일</TableHead>
                    <TableHead className="w-[100px] text-center">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFAQs.length > 0 ? (
                    filteredFAQs.map((faq) => (
                      <TableRow key={faq.id}>
                        <TableCell className="text-center">{faq.id}</TableCell>
                        <TableCell className="text-center hidden md:table-cell">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {faq.category}
                          </span>
                        </TableCell>
                        <TableCell>
                          <button
                            className="hover:text-blue-600 text-left font-medium truncate max-w-[250px] md:max-w-[350px] lg:max-w-full block"
                            onClick={() => openDetail(faq)}
                            title={faq.question}
                          >
                            {faq.question}
                          </button>
                        </TableCell>
                        <TableCell className="text-center hidden md:table-cell">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${faq.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                            }`}>
                            {faq.isActive ? '표시' : '감춤'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center hidden md:table-cell">
                          <div className="flex justify-center">
                            <Switch 
                              checked={faq.isActive}
                              onCheckedChange={(checked) => updateFAQ(faq.id, { ...faq, isActive: checked })}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm whitespace-nowrap hidden lg:table-cell">{faq.createdAt}</TableCell>
                        <TableCell className="text-center text-sm whitespace-nowrap hidden lg:table-cell">{faq.updatedAt}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => openDetail(faq)}
                              className="h-8 w-8"
                              title="수정"
                            >
                              <KeenIcon icon="pencil" style="outline" className="fs-6" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => openDeleteConfirm(faq)}
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
                      <TableCell colSpan={8} className="h-24 text-center">
                        FAQ가 없습니다.
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
            <h3 className="text-lg font-medium text-card-foreground mb-4">FAQ 관리 안내</h3>
            <div className="space-y-2 text-muted-foreground">
              <p>• FAQ는 사용자들이 자주 묻는 질문과 답변을 제공하는 데 사용됩니다.</p>
              <p>• '표시' 상태로 설정된 FAQ만 사용자에게 노출됩니다.</p>
              <p>• 카테고리별로 분류하여 사용자가 쉽게 원하는 정보를 찾을 수 있도록 합니다.</p>
            </div>
          </div>
        </div>
      </Container>

      {/* FAQ 상세 다이얼로그 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
          <div className="bg-background py-4 px-8 border-b">
            <DialogTitle className="text-lg font-medium text-foreground">FAQ 상세</DialogTitle>
          </div>
          <div className="p-8 bg-background">
            <FAQDetail
              faq={selectedFAQ}
              onClose={() => setIsDetailOpen(false)}
              onUpdate={updateFAQ}
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
        question={faqToDelete?.question || ''}
      />
    </>
  );
};

export { FAQPageComponent };