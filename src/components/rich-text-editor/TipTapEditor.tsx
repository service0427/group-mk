import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/supabase';
import { toast } from 'sonner';
import './tiptap-styles.css';
import './image-fix.css';

interface TipTapEditorProps {
  content?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

const TipTapEditor: React.FC<TipTapEditorProps> = ({
  content = '',
  onChange,
  placeholder = '내용을 입력하세요...',
  readOnly = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const lastCursorPosition = useRef<number | null>(null);
  const previousContent = useRef<string>(content);

  // 에디터 초기화
  useEffect(() => {
    const editor = editorRef.current;
    if (editor) {
      // 초기 내용 설정
      if (content) {
        editor.innerHTML = content;
      } else if (placeholder) {
        editor.innerHTML = `<p class="tiptap-placeholder">${placeholder}</p>`;
      }

      // 포커스 발생 시 플레이스홀더 클래스 제거
      const handleFocus = () => {
        if (editor.innerHTML === `<p class="tiptap-placeholder">${placeholder}</p>`) {
          editor.innerHTML = '<p><br></p>';
          // 포커스가 맨 처음에 위치하도록
          const range = document.createRange();
          const sel = window.getSelection();
          if (editor.firstChild) {
            range.setStart(editor.firstChild, 0);
            range.collapse(true);
            sel?.removeAllRanges();
            sel?.addRange(range);
          }
        }
      };

      // 블러 시 placeholder 표시 여부 체크
      const handleBlur = () => {
        if (editor.innerHTML === '' || editor.innerHTML === '<p><br></p>' || editor.innerHTML === '<p></p>') {
          editor.innerHTML = `<p class="tiptap-placeholder">${placeholder}</p>`;
        }
      };

      // 입력 처리 함수
      const handleInput = () => {
        const newContent = editor.innerHTML;
        
        // 내용이 변경된 경우에만 콜백 호출
        if (newContent !== previousContent.current) {
          if (onChange) {
            onChange(newContent);
          }
          previousContent.current = newContent;
        }
      };

      // DOM에 이벤트 리스너 등록
      editor.addEventListener('focus', handleFocus);
      editor.addEventListener('blur', handleBlur);
      editor.addEventListener('input', handleInput);

      return () => {
        // 컴포넌트 언마운트 시 이벤트 리스너 제거
        editor.removeEventListener('focus', handleFocus);
        editor.removeEventListener('blur', handleBlur);
        editor.removeEventListener('input', handleInput);
      };
    }
  }, [placeholder]);

  // 외부에서 content prop이 변경된 경우 처리
  useEffect(() => {
    const editor = editorRef.current;
    // 에디터가 비어있거나 placeholder만 표시중일 경우만 새 콘텐츠 적용
    if (editor && editor.innerHTML !== content && 
        (editor.innerHTML === '' || 
         editor.innerHTML === '<p><br></p>' || 
         editor.innerHTML === '<p></p>' ||
         editor.innerHTML === `<p class="tiptap-placeholder">${placeholder}</p>`)) {
      
      if (content) {
        editor.innerHTML = content;
      } else {
        editor.innerHTML = `<p class="tiptap-placeholder">${placeholder}</p>`;
      }
      previousContent.current = content;
    }
  }, [content, placeholder]);

  const saveCursorPosition = () => {
    if (document.activeElement === editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const preSelectionRange = range.cloneRange();
        if (editorRef.current) {
          preSelectionRange.selectNodeContents(editorRef.current);
          preSelectionRange.setEnd(range.startContainer, range.startOffset);
          lastCursorPosition.current = preSelectionRange.toString().length;
        }
      }
    }
  };

  const restoreCursorPosition = () => {
    if (lastCursorPosition.current !== null && editorRef.current) {
      // 에디터 전체 내용을 담을 범위 생성
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      const textNodes = getTextNodesIn(editorRef.current);
      
      let charCount = 0;
      let foundNode = null;
      let foundOffset = 0;
      
      // 모든 텍스트 노드를 순회하며 커서 위치 찾기
      for (let i = 0; i < textNodes.length; i++) {
        const node = textNodes[i];
        const nextCharCount = charCount + node.length;
        
        if (lastCursorPosition.current >= charCount && lastCursorPosition.current <= nextCharCount) {
          foundNode = node;
          foundOffset = lastCursorPosition.current - charCount;
          break;
        }
        
        charCount = nextCharCount;
      }
      
      // 찾은 위치에 커서 설정
      if (foundNode) {
        range.setStart(foundNode, foundOffset);
        range.collapse(true);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  };

  // 텍스트 노드 수집 헬퍼 함수
  const getTextNodesIn = (node: Node): Text[] => {
    const textNodes: Text[] = [];
    if (node.nodeType === Node.TEXT_NODE) {
      textNodes.push(node as Text);
    } else {
      const children = node.childNodes;
      for (let i = 0; i < children.length; i++) {
        textNodes.push(...getTextNodesIn(children[i]));
      }
    }
    return textNodes;
  };

  const insertImageAtCursor = (imageUrl: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    
    // 현재 선택된 영역 정보 가져오기
    const selection = window.getSelection();
    
    // 이미지 HTML 태그 생성
    const imgHtml = `<img src="${imageUrl}" alt="업로드된 이미지" style="max-width: 100%;" />`;
    
    if (selection && selection.rangeCount > 0) {
      try {
        // 현재 선택 영역에 이미지 삽입
        const range = selection.getRangeAt(0);
        
        // 범위가 에디터 내부인지 확인
        if (editor.contains(range.commonAncestorContainer)) {
          // HTML 조각 생성 후 삽입
          range.deleteContents();
          const fragment = document.createRange().createContextualFragment(imgHtml);
          range.insertNode(fragment);
          range.collapse(false);
          
          // 이미지 삽입 후 상태 갱신
          if (onChange) {
            onChange(editor.innerHTML);
          }
          previousContent.current = editor.innerHTML;
        } else {
          // 에디터 외부에 포커스가 있는 경우, 에디터 끝에 삽입
          editor.focus();
          document.execCommand('insertHTML', false, imgHtml);
        }
      } catch (error) {
        console.error('이미지 삽입 중 오류:', error);
        // 오류 발생 시 에디터 끝에 이미지 추가
        editor.focus();
        document.execCommand('insertHTML', false, imgHtml);
      }
    } else {
      // 선택 영역이 없으면 에디터에 포커스 준 후 끝에 이미지 추가
      editor.focus();
      document.execCommand('insertHTML', false, imgHtml);
    }
    
    // 변경사항 상태 업데이트
    if (onChange) {
      onChange(editor.innerHTML);
    }
    previousContent.current = editor.innerHTML;
  };

  const uploadImage = async (file: File) => {
    try {
      setIsUploading(true);
      
      // 파일 크기 검사 (10MB 제한)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('이미지 크기는 10MB를 초과할 수 없습니다.');
        return;
      }
      
      // 이미지 파일 타입 검사
      if (!file.type.match(/^image\/(jpeg|png|gif|jpg|webp)$/)) {
        toast.error('지원되는 이미지 형식이 아닙니다. (JPEG, PNG, GIF, WEBP만 가능)');
        return;
      }
      
      saveCursorPosition(); // 이미지 업로드 전 커서 위치 저장
      
      // 고유 파일명 생성 (타임스탬프 + 랜덤 문자열)
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = fileName;
      
      // Supabase Storage에 업로드
      const { data, error } = await supabase.storage
        .from('notice-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        throw error;
      }
      
      // 업로드된 이미지 URL 가져오기
      const { data: urlData } = supabase.storage
        .from('notice-images')
        .getPublicUrl(filePath);
      
      // 에디터에 이미지 삽입
      insertImageAtCursor(urlData.publicUrl);
      toast.success('이미지가 업로드되었습니다.');
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      toast.error('이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
    // 파일 선택 변경 가능하도록 input 값 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="tiptap-editor-container h-full">
      {/* 에디터 툴바 */}
      <div className="tiptap-toolbar">
        <button 
          type="button" 
          className="toolbar-button font-medium" 
          onClick={handleImageButtonClick}
          disabled={isUploading || readOnly}
          title="이미지 첨부"
        >
          {isUploading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              업로드 중...
            </>
          ) : (
            <>
              <svg className="inline-block mr-1 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              이미지 첨부
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>
      
      {/* 에디터 영역 - dangerouslySetInnerHTML 사용하지 않음 */}
      <div 
        ref={editorRef}
        className="tiptap-editor"
        contentEditable={!readOnly}
        suppressContentEditableWarning
        dir="ltr"
        lang="ko"
      />
    </div>
  );
};

export { TipTapEditor };