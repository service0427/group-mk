import { Container } from '@/components/container';
import { useSupabaseAuth } from '@/auth/supabase/SupabaseAuthProvider';
import { DashboardContent } from '.';
import { KeenIcon } from '@/components/keenicons';

const DashboardPage = () => {
  const { isLoading } = useSupabaseAuth();

  // 전체 페이지 로딩 상태 처리
  if (isLoading) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <div className="animate-spin text-primary">
            <KeenIcon icon="spinner" className="w-16 h-16" />
          </div>
          <p className="text-gray-600 text-lg">화면을 불러오는 중입니다...</p>
          <p className="text-gray-500 text-sm">잠시만 기다려주세요.</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <DashboardContent />
    </Container>
  );
};

export { DashboardPage };
