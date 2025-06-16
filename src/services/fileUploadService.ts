// 파일 업로드 서비스
// Supabase Storage를 활용한 파일 업로드 관리

import { supabase } from '@/supabase';
import type { AttachmentFile } from '@/types/guarantee-slot.types';

export interface UploadFileParams {
  file: File;
  bucket: string;
  folder?: string;
}

export const fileUploadService = {
  // 파일 업로드
  async uploadFile({ file, bucket, folder = '' }: UploadFileParams): Promise<{ data: AttachmentFile | null; error: any }> {
    try {
      // 파일명 생성 (타임스탬프 + 원본 파일명)
      const timestamp = new Date().getTime();
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      // Supabase Storage에 파일 업로드
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 파일 공개 URL 생성
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error('파일 URL 생성에 실패했습니다.');
      }

      // AttachmentFile 객체 생성
      const attachmentFile: AttachmentFile = {
        url: urlData.publicUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        uploaded_at: new Date().toISOString(),
      };

      return { data: attachmentFile, error: null };
    } catch (error) {
      console.error('파일 업로드 실패:', error);
      return { data: null, error };
    }
  },

  // 다중 파일 업로드
  async uploadMultipleFiles(files: File[], bucket: string, folder?: string): Promise<{ data: AttachmentFile[]; errors: any[] }> {
    const results = await Promise.allSettled(
      files.map(file => this.uploadFile({ file, bucket, folder }))
    );

    const uploadedFiles: AttachmentFile[] = [];
    const errors: any[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.data) {
        uploadedFiles.push(result.value.data);
      } else {
        const error = result.status === 'rejected' ? result.reason : result.value.error;
        errors.push({ fileIndex: index, error });
      }
    });

    return { data: uploadedFiles, errors };
  },

  // 파일 삭제
  async deleteFile(url: string, bucket: string): Promise<{ success: boolean; error: any }> {
    try {
      // URL에서 파일 경로 추출
      const urlObject = new URL(url);
      const pathSegments = urlObject.pathname.split('/');
      const filePath = pathSegments.slice(-2).join('/'); // bucket/folder/filename에서 folder/filename 부분

      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) throw error;

      return { success: true, error: null };
    } catch (error) {
      console.error('파일 삭제 실패:', error);
      return { success: false, error };
    }
  },

  // 파일 타입 검증
  isValidFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });
  },

  // 파일 크기 검증 (MB 단위)
  isValidFileSize(file: File, maxSizeMB: number): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  },

  // 파일 크기를 읽기 쉬운 형태로 변환
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // 이미지 파일인지 확인
  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  },

  // 파일 다운로드
  async downloadFile(url: string, fileName: string): Promise<boolean> {
    try {
      // fetch로 파일 데이터 가져오기
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Blob으로 변환
      const blob = await response.blob();

      // 다운로드 링크 생성
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;

      // 링크를 DOM에 추가하고 클릭 후 제거
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // URL 정리
      window.URL.revokeObjectURL(downloadUrl);

      return true;
    } catch (error) {
      console.error('파일 다운로드 실패:', error);
      return false;
    }
  },

  // 파일 타입별 적절한 액션 (보기 vs 다운로드)
  handleFileAction(attachment: { url: string; name: string; type: string }) {
    if (this.isImageFile({ type: attachment.type } as File)) {
      // 이미지는 새 탭에서 보기
      window.open(attachment.url, '_blank');
    } else {
      // 일반 파일은 다운로드
      this.downloadFile(attachment.url, attachment.name);
    }
  },
};