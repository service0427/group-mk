import React, { useEffect, useRef } from 'react';
// @ts-ignore
import Editor from '@toast-ui/editor';
import '@toast-ui/editor/dist/toastui-editor.css';
import '@toast-ui/editor/dist/theme/toastui-editor-dark.css';

interface ToastUIEditorProps {
  content?: string;
  height?: string;
  className?: string;
  theme?: 'light' | 'dark';
  placeholder?: string;
  onChange?: (value: string) => void;
  onBlur?: (value: string) => void;
}

export const ToastUIEditor: React.FC<ToastUIEditorProps> = ({
  content = '',
  height = '500px',
  className = '',
  theme = 'light',
  placeholder = '내용을 입력하세요...',
  onChange,
  onBlur
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstance = useRef<Editor | null>(null);

  useEffect(() => {
    if (!editorRef.current || editorInstance.current) return;

    // DOM이 완전히 준비될 때까지 대기
    const timer = setTimeout(() => {
      if (!editorRef.current) return;

      try {
        editorInstance.current = new Editor({
          el: editorRef.current,
          height,
          initialEditType: 'markdown',
          previewStyle: 'vertical',
          initialValue: content,
          theme,
          placeholder,
          usageStatistics: false,
          autofocus: false, // 자동 포커스 비활성화
          toolbarItems: [
            ['heading', 'bold', 'italic', 'strike'],
            ['hr', 'quote'],
            ['ul', 'ol', 'task', 'indent', 'outdent'],
            ['table', 'image', 'link'],
            ['code', 'codeblock'],
            ['scrollSync'],
          ],
          events: {
            change: () => {
              if (onChange && editorInstance.current) {
                onChange(editorInstance.current.getMarkdown());
              }
            },
            blur: () => {
              if (onBlur && editorInstance.current) {
                onBlur(editorInstance.current.getMarkdown());
              }
            }
          }
        });
      } catch (error) {
        console.error('Toast UI Editor initialization error:', error);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (editorInstance.current) {
        try {
          editorInstance.current.destroy();
        } catch (error) {
          console.error('Toast UI Editor destroy error:', error);
        }
        editorInstance.current = null;
      }
    };
  }, [height, theme, placeholder]);

  useEffect(() => {
    if (editorInstance.current && content !== undefined) {
      const currentContent = editorInstance.current.getMarkdown();
      if (currentContent !== content) {
        editorInstance.current.setMarkdown(content);
      }
    }
  }, [content]);

  return (
    <div 
      ref={editorRef} 
      className={`toast-ui-editor ${className}`}
    />
  );
};