import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Container } from '@/components';
import { Toolbar, ToolbarDescription, ToolbarHeading, ToolbarPageTitle } from '@/partials/toolbar';
import { useMenus } from '@/providers';
import { useMenuBreadcrumbs, useMenuCurrentItem } from '@/components';
import { KeenIcon } from '@/components/keenicons';
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
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

// FAQ 유형 정의
interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  is_active: boolean;
  author_id: string;
  view_count: number;
  created_at: string;
  updated_at: string;
}

// 카테고리별 배경색 설정
const getCategoryColor = (category: string) => {
  switch (category) {
    case '결제':
      return 'bg-blue-100 text-blue-800';
    case '포인트':
      return 'bg-green-100 text-green-800';
    case '계정':
      return 'bg-purple-100 text-purple-800';
    case '광고':
      return 'bg-orange-100 text-orange-800';
    case '기타':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
};

// FAQ 카테고리 목록
const faqCategories = ['전체', '결제', '포인트', '계정', '광고', '기타'];

// FAQ 상세 컴포넌트
interface FAQDetailProps {
  faq: FAQ | null;
  onClose: () => void;
  onUpdate: (id: string, data: any) => Promise<void>;
  onDelete: (faq: FAQ) => void;
}

const FAQDetail: React.FC<FAQDetailProps> = ({ faq, onClose, onUpdate, onDelete }) => {
  const [question, setQuestion] = useState(faq?.question || '');
  const [answer, setAnswer] = useState(faq?.answer || '');
  const [category, setCategory] = useState(faq?.category || '결제');
  const [isActive, setIsActive] = useState(faq?.is_active || false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (faq) {
      setIsLoading(true);
      try {
        await onUpdate(faq.id, { 
          question, 
          answer, 
          category, 
          is_active: isActive
        });
        toast("FAQ가 업데이트 되었습니다.");
        onClose();
      } catch (error) {
        toast.error("FAQ 업데이트 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
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

// 새 FAQ 작성 컴포넌트
interface CreateFAQProps {
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

const CreateFAQ: React.FC<CreateFAQProps> = ({ onClose, onSave }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('결제');
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await onSave({ 
        question, 
        answer, 
        category, 
        is_active: isActive 
      });
      toast("FAQ가 등록되었습니다.");
      onClose();
    } catch (error) {
      toast.error("FAQ 등록 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
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
  question: string;
  isLoading: boolean;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  question,
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

const FAQPageComponent = () => {
  const { pathname } = useLocation();
  const { getMenuConfig } = useMenus();
  const menuConfig = getMenuConfig('primary');
  const menuItem = useMenuCurrentItem(pathname, menuConfig);
  const breadcrumbs = useMenuBreadcrumbs(pathname, menuConfig);

  const [faqs, setFAQs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [faqToDelete, setFAQToDelete] = useState<FAQ | null>(null);
  const [activeCategory, setActiveCategory] = useState('전체');
  const [isDeleting, setIsDeleting] = useState(false);

  // FAQ 목록 가져오기
  const fetchFAQs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('faq')
        .select('*')
        .order('created_at', { ascending: false });
      
      const { data, error } = await query;

      if (error) throw error;
      setFAQs(data || []);
    } catch (err: any) {
      console.error('FAQ를 가져오는 중 오류가 발생했습니다:', err);
      setError('FAQ를 불러오는데 실패했습니다.');
      toast.error("FAQ 목록을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 FAQ 가져오기
  useEffect(() => {
    fetchFAQs();
  }, []);

  // FAQ 상세 열기
  const openDetail = (faq: FAQ) => {
    setSelectedFAQ(faq);
    setIsDetailOpen(true);
  };

  // FAQ 업데이트
  const updateFAQ = async (id: string, data: any) => {
    try {
      const { error } = await supabase
        .from('faq')
        .update({
          question: data.question,
          answer: data.answer,
          category: data.category,
          is_active: data.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      // 업데이트 후 목록 새로고침
      await fetchFAQs();
      return;
    } catch (err) {
      console.error('FAQ 업데이트 중 오류 발생:', err);
      throw err;
    }
  };

  // 활성 상태 변경 핸들러
  const handleToggleActive = async (faq: FAQ, newValue: boolean) => {
    try {
      const { error } = await supabase
        .from('faq')
        .update({
          is_active: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', faq.id);

      if (error) throw error;

      // 업데이트 후 목록 새로고침
      await fetchFAQs();
      
      toast(`FAQ가 ${newValue ? '표시' : '숨김'} 상태로 변경되었습니다.`);
    } catch (err) {
      console.error('상태 변경 중 오류 발생:', err);
      toast.error("상태 변경 중 오류가 발생했습니다.");
    }
  };

  // 새 FAQ 저장
  const saveNewFAQ = async (data: any) => {
    try {
      // 로그인한 사용자의 ID 가져오기
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const userId = userData.user?.id;
      
      const { error } = await supabase
        .from('faq')
        .insert({
          question: data.question,
          answer: data.answer,
          category: data.category,
          is_active: data.is_active,
          author_id: userId
        });

      if (error) throw error;
      
      // 추가 후 목록 새로고침
      await fetchFAQs();
    } catch (err) {
      console.error('FAQ 저장 중 오류 발생:', err);
      throw err;
    }
  };

  // FAQ 삭제 확인 다이얼로그 열기
  const openDeleteConfirm = (faq: FAQ) => {
    setFAQToDelete(faq);
    setIsDeleteConfirmOpen(true);
  };

  // FAQ 삭제 실행
  const confirmDelete = async () => {
    if (faqToDelete) {
      setIsDeleting(true);
      try {
        const { error } = await supabase
          .from('faq')
          .delete()
          .eq('id', faqToDelete.id);

        if (error) throw error;
        
        // 삭제 후 목록 새로고침
        await fetchFAQs();
        
        toast("FAQ가 삭제되었습니다.");
        
        setIsDeleteConfirmOpen(false);
        setFAQToDelete(null);
      } catch (err) {
        console.error('FAQ 삭제 중 오류 발생:', err);
        toast.error("FAQ 삭제 중 오류가 발생했습니다.");
      } finally {
        setIsDeleting(false);
      }
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
              {isLoading ? (
                <div className="p-8 flex justify-center items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-500">
                  <p>{error}</p>
                  <Button 
                    variant="outline" 
                    onClick={fetchFAQs}
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
                      filteredFAQs.map((faq, index) => (
                        <TableRow key={faq.id}>
                          <TableCell className="text-center">{index + 1}</TableCell>
                          <TableCell className="text-center hidden md:table-cell">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(faq.category)}`}>
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
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${faq.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                              }`}>
                              {faq.is_active ? '표시' : '감춤'}
                            </span>
                          </TableCell>
                          <TableCell className="text-center hidden md:table-cell">
                            <div className="flex justify-center">
                              <Switch 
                                checked={faq.is_active}
                                onCheckedChange={(checked) => handleToggleActive(faq, checked)}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-sm whitespace-nowrap hidden lg:table-cell">{formatDate(faq.created_at)}</TableCell>
                          <TableCell className="text-center text-sm whitespace-nowrap hidden lg:table-cell">{formatDate(faq.updated_at)}</TableCell>
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
              )}
            </div>

            {/* 페이지네이션은 필요시 구현 */}
            {filteredFAQs.length > 0 && (
              <div className="p-4 flex justify-center">
                <div className="flex space-x-1">
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
        isLoading={isDeleting}
      />
    </>
  );
};

export { FAQPageComponent };