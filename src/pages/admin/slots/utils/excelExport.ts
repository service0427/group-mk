import * as XLSX from 'xlsx';
import { Slot } from '../components/types';
import { ExcelTemplate } from '../components/ExcelExportModal';

// 중첩된 객체에서 값을 가져오는 헬퍼 함수
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => {
    return current ? current[key] : undefined;
  }, obj);
};

// 날짜 포맷팅 함수
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// 상태 한글 변환
const getStatusLabel = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'draft': '임시저장',
    'pending': '대기중',
    'in_progress': '진행중',
    'completed': '완료',
    'rejected': '반려',
    'cancelled': '취소',
    'submitted': '제출됨',
    'approved': '승인됨'
  };
  return statusMap[status] || status;
};

// 키워드 배열을 문자열로 변환
const formatKeywords = (keywords: string[] | undefined): string => {
  if (!keywords || !Array.isArray(keywords)) return '';
  return keywords.join(', ');
};

// 엑셀 내보내기 함수
export const exportToExcel = (slots: Slot[], template: ExcelTemplate, fileName: string = 'slot-export') => {
  try {
    // 선택된 컬럼만 필터링
    const selectedColumns = template.columns.filter(col => col.enabled);
    
    // 데이터 변환
    const excelData = slots.map((slot, index) => {
      const row: any = {};
      
      selectedColumns.forEach(column => {
        const field = column.field;
        let value;
        
        // 특별한 처리가 필요한 필드들
        switch (field) {
          case 'id':
            value = slot.id;
            break;
          case 'user_slot_number':
            value = slot.user_slot_number || index + 1;
            break;
          case 'status':
            value = getStatusLabel(slot.status);
            break;
          case 'campaign_name':
            value = slot.campaign_name || '';
            break;
          case 'user.email':
            value = slot.user?.email || '';
            break;
          case 'user.full_name':
            value = slot.user?.full_name || '';
            break;
          case 'input_data.keywords':
            value = formatKeywords(slot.input_data?.keywords);
            break;
          case 'created_at':
          case 'submitted_at':
          case 'processed_at':
            value = formatDate(getNestedValue(slot, field));
            break;
          case 'start_date':
          case 'end_date':
            value = slot[field] ? new Date(slot[field]).toLocaleDateString('ko-KR') : '';
            break;
          default:
            // 중첩된 필드 처리
            value = getNestedValue(slot, field);
            break;
        }
        
        // 값이 undefined나 null인 경우 빈 문자열로 처리
        row[column.label] = value !== undefined && value !== null ? value : '';
      });
      
      return row;
    });
    
    // 워크시트 생성
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // 컬럼 너비 설정
    const columnWidths = selectedColumns.map(col => ({ wch: col.width || 20 }));
    worksheet['!cols'] = columnWidths;
    
    // 워크북 생성
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '슬롯 목록');
    
    // 현재 날짜를 파일명에 추가
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const fullFileName = `${fileName}_${dateStr}_${timeStr}.xlsx`;
    
    // 파일 다운로드
    XLSX.writeFile(workbook, fullFileName);
    
    return true;
  } catch (error) {
    console.error('엑셀 내보내기 오류:', error);
    throw new Error('엑셀 파일 생성 중 오류가 발생했습니다.');
  }
};