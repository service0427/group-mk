import { format } from 'date-fns';
import * as XLSX from 'xlsx';

interface CashRequestData {
  id: string;
  full_name: string;
  email: string;
  business_name?: string;
  business_number?: string;
  business_email?: string;
  amount: number;
  account_holder?: string;
  status: string;
  requested_at: string;
  processed_at?: string;
  rejection_reason?: string;
  freeCashAmount?: number;
  freeCashPercentage?: number;
}

/**
 * 캐시 충전 요청 데이터를 엑셀로 내보내기
 */
export const exportCashRequestsToExcel = (
  data: CashRequestData[],
  filename: string = '캐시충전요청내역'
) => {
  try {
    // 엑셀에 표시할 데이터 변환
    const excelData = data.map(request => ({
      '요청일시': format(new Date(request.requested_at), 'yyyy-MM-dd HH:mm'),
      '회원명': request.full_name,
      '이메일': request.email,
      '상호명': request.business_name || '-',
      '사업자번호': request.business_number || '-',
      '사업자이메일': request.business_email || '-',
      '충전금액': request.amount,
      '입금자명': request.account_holder || '-',
      '무료캐시': request.freeCashAmount || 0,
      '무료캐시비율': request.freeCashPercentage ? `${request.freeCashPercentage}%` : '-',
      '상태': getStatusText(request.status),
      '처리일시': request.processed_at 
        ? format(new Date(request.processed_at), 'yyyy-MM-dd HH:mm') 
        : '-',
      '거부사유': request.rejection_reason || '-'
    }));

    // 워크시트 생성
    const ws = XLSX.utils.json_to_sheet(excelData);

    // 컬럼 너비 설정
    const colWidths = [
      { wch: 16 }, // 요청일시
      { wch: 12 }, // 회원명
      { wch: 25 }, // 이메일
      { wch: 20 }, // 상호명
      { wch: 15 }, // 사업자번호
      { wch: 25 }, // 사업자이메일
      { wch: 12 }, // 충전금액
      { wch: 12 }, // 입금자명
      { wch: 10 }, // 무료캐시
      { wch: 12 }, // 무료캐시비율
      { wch: 8 },  // 상태
      { wch: 16 }, // 처리일시
      { wch: 30 }  // 거부사유
    ];
    ws['!cols'] = colWidths;

    // 워크북 생성
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '캐시충전요청');

    // 파일 다운로드
    const date = format(new Date(), 'yyyyMMdd_HHmmss');
    XLSX.writeFile(wb, `${filename}_${date}.xlsx`);

    return { success: true };
  } catch (error) {
    console.error('엑셀 내보내기 실패:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '엑셀 내보내기 중 오류가 발생했습니다.' 
    };
  }
};

/**
 * 상태 텍스트 변환
 */
const getStatusText = (status: string): string => {
  switch (status) {
    case 'pending':
      return '대기중';
    case 'approved':
      return '승인';
    case 'rejected':
      return '거부';
    default:
      return status;
  }
};

/**
 * 출금 요청 데이터를 엑셀로 내보내기
 */
export const exportWithdrawRequestsToExcel = (
  data: any[],
  filename: string = '출금요청내역'
) => {
  try {
    // 엑셀에 표시할 데이터 변환
    const excelData = data.map(request => ({
      '요청일시': format(new Date(request.requestDate), 'yyyy-MM-dd'),
      '회원명': request.username,
      '이메일': request.email || '-',
      '상호명': request.businessName || '-',
      '사업자번호': request.businessNumber || '-',
      '은행명': request.bankName,
      '계좌번호': request.accountNumber,
      '출금금액': request.amount,
      '상태': getStatusText(request.status),
      '처리일시': request.processed_at 
        ? format(new Date(request.processed_at), 'yyyy-MM-dd HH:mm') 
        : '-',
      '거부사유': request.rejected_reason || '-'
    }));

    // 워크시트 생성
    const ws = XLSX.utils.json_to_sheet(excelData);

    // 컬럼 너비 설정
    const colWidths = [
      { wch: 16 }, // 요청일시
      { wch: 12 }, // 회원명
      { wch: 25 }, // 이메일
      { wch: 20 }, // 상호명
      { wch: 15 }, // 사업자번호
      { wch: 12 }, // 은행명
      { wch: 20 }, // 계좌번호
      { wch: 12 }, // 출금금액
      { wch: 8 },  // 상태
      { wch: 16 }, // 처리일시
      { wch: 30 }  // 거부사유
    ];
    ws['!cols'] = colWidths;

    // 워크북 생성
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '출금요청');

    // 파일 다운로드
    const date = format(new Date(), 'yyyyMMdd_HHmmss');
    XLSX.writeFile(wb, `${filename}_${date}.xlsx`);

    return { success: true };
  } catch (error) {
    console.error('엑셀 내보내기 실패:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '엑셀 내보내기 중 오류가 발생했습니다.' 
    };
  }
};