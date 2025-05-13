# Group MK Project

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Rich Text Editor Component

The project includes a rich text editor component for creating formatted content with support for text styling, images, and file uploads.

### Features

- Text formatting (bold, italic, underline, strike)
- Headings, lists, blockquotes
- Color and background color
- Image upload and embedding (with drag-and-drop)
- File upload with download links
- Supports 30MB maximum file size

### Usage

```tsx
import { RichTextEditor, RichTextViewer } from '@/components/rich-text-editor';

// Editor Component
const MyComponent = () => {
  const [content, setContent] = useState('');
  
  return (
    <RichTextEditor
      value={content}
      onChange={setContent}
      placeholder="Enter content..."
      height="400px"
    />
  );
};

// Viewer Component
const ViewComponent = () => {
  return (
    <RichTextViewer
      content={htmlContent}
      className="custom-class"
    />
  );
};
```

### Storage Requirements

The editor requires two Supabase storage buckets:
- `notice-images`: For storing uploaded images
- `notice-files`: For storing uploaded files

Run the following script to create these buckets if they don't exist:

```bash
node src/scripts/check-storage-buckets.js
```

## Technologies

- React 18
- TypeScript
- Vite
- TailwindCSS
- Shadcn UI
- React Quill (Rich Text Editor)
- Supabase