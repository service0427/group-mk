import * as XLSX from 'xlsx';
import { Slot } from '../components/types';
import { ExcelTemplate, ExcelColumn } from '../components/ExcelExportModal';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

// 슬롯 상태 한글 변환
const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': '대기중',
    'approved': '승인됨',
    'rejected': '반려됨',
    'success': '완료',
    'refund': '환불',
    'pending_user_confirm': '사용자 확인 대기',
  };
  return statusMap[status] || status;
};

// 날짜 포맷팅 (시간 포함)
const formatDateTime = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  try {
    return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss', { locale: ko });
  } catch {
    return dateString;
  }
};

// 날짜 포맷팅 (날짜만)
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  try {
    return format(new Date(dateString), 'yyyy-MM-dd', { locale: ko });
  } catch {
    return dateString;
  }
};

// 디버깅용 플래그
let debugLogged = false;

// 슬롯 데이터를 엑셀 행 데이터로 변환
const convertSlotToRow = (slot: Slot, columns: ExcelColumn[]): any => {
  // 첫 번째 슬롯만 디버깅
  if (!debugLogged) {
    debugLogged = true;
  }

  const row: any = {};

  columns.forEach(column => {
    if (!column.enabled) return;

    // 기본값 설정
    let value = '';

    switch (column.field) {
      case 'id':
        value = slot.id;
        break;

      case 'status':
        value = getStatusText(slot.status);
        break;

      case 'campaign_name':
        // campaign 객체에서 먼저 찾고, 없으면 slot에 직접 저장된 값 사용
        value = slot.campaign?.campaign_name || slot.campaign_name || '';
        break;

      case 'user.email':
        value = slot.user?.email || '';
        break;

      case 'user.full_name':
        value = slot.user?.full_name || '';
        break;

      case 'input_data.productName':
        value = slot.input_data?.productName || slot.input_data?.product_name || '';
        break;

      case 'input_data.keywords':
        // 키워드 처리 - 여러 형태의 키워드 필드 확인
        let keywords = '';

        if (slot.input_data?.keywords) {
          if (typeof slot.input_data.keywords === 'string') {
            try {
              const parsed = JSON.parse(slot.input_data.keywords);
              keywords = Array.isArray(parsed) ? parsed.join(', ') : slot.input_data.keywords;
            } catch {
              keywords = slot.input_data.keywords;
            }
          } else if (Array.isArray(slot.input_data.keywords)) {
            keywords = slot.input_data.keywords.join(', ');
          }
        } else if (slot.input_data?.keyword) {
          keywords = slot.input_data.keyword;
        } else if (slot.input_data?.mainKeyword) {
          keywords = [
            slot.input_data.mainKeyword,
            slot.input_data.keyword1,
            slot.input_data.keyword2,
            slot.input_data.keyword3
          ].filter(Boolean).join(', ');
        }

        value = keywords;
        break;

      case 'input_data.mainKeyword':
        value = slot.input_data?.mainKeyword || '';
        break;

      case 'input_data.keyword1':
        value = slot.input_data?.keyword1 || '';
        break;

      case 'input_data.keyword2':
        value = slot.input_data?.keyword2 || '';
        break;

      case 'input_data.keyword3':
        value = slot.input_data?.keyword3 || '';
        break;

      case 'input_data.url':
        value = slot.input_data?.url ||
          slot.input_data?.product_url ||
          slot.input_data?.ohouse_url || '';
        break;

      case 'input_data.mid':
        value = slot.input_data?.mid || '';
        break;

      case 'quantity':
        value = String(slot.quantity ||
          slot.input_data?.quantity ||
          slot.input_data?.타수 ||
          slot.input_data?.['일일 타수'] ||
          slot.input_data?.['작업량'] || 0);
        break;

      case 'input_data.dueDays':
        value = String(slot.input_data?.dueDays ||
          slot.input_data?.workCount || 1);
        break;

      case 'start_date':
        value = slot.start_date ? formatDate(slot.start_date) : '';
        break;

      case 'end_date':
        value = slot.end_date ? formatDate(slot.end_date) : '';
        break;

      case 'created_at':
        value = formatDateTime(slot.created_at);
        break;

      case 'submitted_at':
        value = formatDateTime(slot.submitted_at);
        break;

      case 'processed_at':
        value = formatDateTime(slot.processed_at);
        break;

      case 'mat_reason':
        value = slot.mat_reason || '';
        break;

      case 'rejection_reason':
        value = slot.rejection_reason || '';
        break;

      case 'user_reason':
        value = slot.user_reason || '';
        break;

      case 'service_type':
        value = slot.campaign?.service_type || '';
        break;

      case 'unit_price':
        value = slot.campaign?.unit_price ? String(slot.campaign.unit_price) : '';
        break;

      case 'min_quantity':
        value = slot.campaign?.min_quantity ? String(slot.campaign.min_quantity) : '';
        break;

      case 'deadline':
        value = slot.campaign?.deadline || '';
        break;

      case 'user_slot_number':
        value = slot.user_slot_number ? String(slot.user_slot_number) : '';
        break;

      default:
        // input_data의 동적 필드 처리
        if (column.field.startsWith('input_data.')) {
          const fieldName = column.field.replace('input_data.', '');
          const fieldValue = slot.input_data?.[fieldName];
          
          // 파일 필드 처리 (_file로 끝나는 필드는 URL이므로 파일명으로 변환)
          if (fieldName.endsWith('_file') && fieldValue) {
            // URL에서 파일명 추출
            const fileName = slot.input_data?.[fieldName.replace('_file', '_fileName')] || 
                           slot.input_data?.[fieldName.replace('_file', '')];
            value = fileName || fieldValue;
          } else if (fieldValue !== undefined && fieldValue !== null) {
            // 배열이나 객체인 경우 JSON 문자열로 변환
            if (typeof fieldValue === 'object') {
              value = JSON.stringify(fieldValue);
            } else {
              value = String(fieldValue);
            }
          } else {
            value = '';
          }
        } else {
          value = '';
        }
    }

    // 값을 row에 할당
    row[column.label] = value;
  });

  return row;
};

// 엑셀 파일 생성 및 다운로드
export const exportSlotsToExcel = (
  slots: Slot[],
  template: ExcelTemplate,
  fileName?: string
): void => {
  try {
    // 활성화된 컬럼만 필터링
    const enabledColumns = template.columns.filter(col => col.enabled);

    // 슬롯 데이터를 엑셀 행 데이터로 변환
    const rows = slots.map(slot => convertSlotToRow(slot, enabledColumns));

    // 워크시트 생성
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // 컬럼 너비 설정
    const columnWidths = enabledColumns.map(col => ({ wch: col.width || 20 }));
    worksheet['!cols'] = columnWidths;

    // 상태 컬럼 찾기
    const statusColumnIndex = enabledColumns.findIndex(col => col.field === 'status');
    
    // 상태 컬럼이 있으면 데이터 유효성 검사 추가
    if (statusColumnIndex !== -1) {
      // 상태 옵션들
      const statusOptions = ['대기중', '승인됨', '반려됨', '완료', '환불', '사용자 확인 대기'];
      
      // 데이터 유효성 검사 배열 초기화
      if (!worksheet['!dataValidation']) {
        worksheet['!dataValidation'] = [];
      }
      
      // 헤더 행을 제외한 모든 데이터 행에 드롭다운 추가
      const columnLetter = String.fromCharCode(65 + statusColumnIndex); // A, B, C...
      
      // 각 데이터 행에 대해 데이터 유효성 검사 추가
      for (let i = 0; i < rows.length; i++) {
        const cellRef = `${columnLetter}${i + 2}`; // 헤더가 1행이므로 데이터는 2행부터
        
        worksheet['!dataValidation'].push({
          type: 'list',
          formula1: `"${statusOptions.join(',')}"`,
          showDropDown: true,
          sqref: cellRef
        });
      }
    }

    // 워크북 생성
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '슬롯 목록');

    // 파일명 생성 (기본값: 슬롯목록_YYYYMMDD_HHMMSS.xlsx)
    const defaultFileName = `슬롯목록_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
    const finalFileName = fileName || defaultFileName;

    // 엑셀 파일 다운로드
    XLSX.writeFile(workbook, finalFileName);

  } catch (error) {
    console.error('엑셀 내보내기 오류:', error);
    throw new Error('엑셀 파일 생성 중 오류가 발생했습니다.');
  }
};

// 선택된 슬롯만 내보내기
export const exportSelectedSlotsToExcel = (
  allSlots: Slot[],
  selectedSlotIds: string[],
  template: ExcelTemplate,
  fileName?: string
): void => {
  const selectedSlots = allSlots.filter(slot => selectedSlotIds.includes(slot.id));

  if (selectedSlots.length === 0) {
    throw new Error('선택된 슬롯이 없습니다.');
  }

  exportSlotsToExcel(selectedSlots, template, fileName);
};

// 필터링된 슬롯 내보내기
export const exportFilteredSlotsToExcel = (
  filteredSlots: Slot[],
  template: ExcelTemplate,
  fileName?: string
): void => {
  if (filteredSlots.length === 0) {
    throw new Error('내보낼 슬롯이 없습니다.');
  }

  exportSlotsToExcel(filteredSlots, template, fileName);
};