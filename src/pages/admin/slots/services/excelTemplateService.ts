import { supabase } from '@/supabase';
import { ExcelTemplate, ExcelColumn } from '../components/ExcelExportModal';

export interface DBExcelTemplate {
  id: string;
  user_id: string;
  name: string;
  columns: ExcelColumn[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// 템플릿 목록 조회
export const getExcelTemplates = async (): Promise<ExcelTemplate[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    const { data, error } = await supabase
      .from('excel_export_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    // DBExcelTemplate을 ExcelTemplate으로 변환
    const templates: ExcelTemplate[] = (data || []).map(item => ({
      id: item.id,
      name: item.name,
      columns: item.columns,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

    return templates;
  } catch (error) {
    console.error('템플릿 목록 조회 오류:', error);
    throw error;
  }
};

// 템플릿 생성
export const createExcelTemplate = async (
  name: string,
  columns: ExcelColumn[]
): Promise<ExcelTemplate> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    const { data, error } = await supabase
      .from('excel_export_templates')
      .insert({
        user_id: user.id,
        name,
        columns,
        is_default: false
      })
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      throw new Error('템플릿 생성에 실패했습니다.');
    }

    const insertedData = data[0];

    return {
      id: insertedData.id,
      name: insertedData.name,
      columns: insertedData.columns,
      createdAt: insertedData.created_at,
      updatedAt: insertedData.updated_at,
    };
  } catch (error) {
    console.error('템플릿 생성 오류:', error);
    throw error;
  }
};

// 템플릿 수정
export const updateExcelTemplate = async (
  templateId: string,
  name: string,
  columns: ExcelColumn[]
): Promise<ExcelTemplate> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    const { data, error } = await supabase
      .from('excel_export_templates')
      .update({
        name,
        columns,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)
      .eq('user_id', user.id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      throw new Error('템플릿을 찾을 수 없습니다.');
    }

    const updatedData = data[0];

    return {
      id: updatedData.id,
      name: updatedData.name,
      columns: updatedData.columns,
      createdAt: updatedData.created_at,
      updatedAt: updatedData.updated_at,
    };
  } catch (error) {
    console.error('템플릿 수정 오류:', error);
    throw error;
  }
};

// 템플릿 삭제
export const deleteExcelTemplate = async (templateId: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    const { error } = await supabase
      .from('excel_export_templates')
      .delete()
      .eq('id', templateId)
      .eq('user_id', user.id);

    if (error) throw error;
  } catch (error) {
    console.error('템플릿 삭제 오류:', error);
    throw error;
  }
};

// 기본 템플릿 생성 (사용자에게 기본 템플릿이 없는 경우)
export const createDefaultTemplateIfNotExists = async (): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }

    // 기본 템플릿이 있는지 확인
    const { data: existingDefault } = await supabase
      .from('excel_export_templates')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single();

    if (!existingDefault) {
      // 기본 템플릿이 없으면 생성
      const defaultColumns: ExcelColumn[] = [
        { field: 'id', label: '슬롯 ID', enabled: true, width: 20 },
        { field: 'status', label: '상태', enabled: true, width: 15 },
        { field: 'campaign_name', label: '캠페인명', enabled: true, width: 30 },
        { field: 'user_email', label: '사용자 이메일', enabled: true, width: 30 },
        { field: 'user_name', label: '사용자 이름', enabled: true, width: 20 },
        { field: 'product_name', label: '상품명', enabled: true, width: 30 },
        { field: 'keywords', label: '키워드', enabled: true, width: 40 },
        { field: 'url', label: 'URL', enabled: true, width: 50 },
        { field: 'mid', label: 'MID', enabled: true, width: 20 },
        { field: 'quantity', label: '작업량', enabled: true, width: 15 },
        { field: 'due_days', label: '작업일수', enabled: true, width: 15 },
        { field: 'start_date', label: '시작일', enabled: true, width: 20 },
        { field: 'end_date', label: '종료일', enabled: true, width: 20 },
        { field: 'created_at', label: '생성일', enabled: true, width: 25 },
        { field: 'submitted_at', label: '제출일', enabled: true, width: 25 },
        { field: 'processed_at', label: '처리일', enabled: true, width: 25 },
        { field: 'mat_reason', label: '총판 메모', enabled: true, width: 40 },
        { field: 'rejection_reason', label: '반려 사유', enabled: false, width: 40 },
        { field: 'user_reason', label: '사용자 메모', enabled: false, width: 40 },
      ];

      await supabase
        .from('excel_export_templates')
        .insert({
          user_id: user.id,
          name: '기본 템플릿',
          columns: defaultColumns,
          is_default: true
        });
    }
  } catch (error) {
    console.error('기본 템플릿 생성 오류:', error);
    // 기본 템플릿 생성 실패는 무시 (사용자가 직접 만들 수 있음)
  }
};