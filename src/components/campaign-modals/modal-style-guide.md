# 캠페인 모달 스타일 가이드

이 가이드는 `/components/campaign-modals/` 디렉토리의 모든 모달 컴포넌트에 적용할 일관된 디자인 스타일을 정의합니다. `/pages/distributor/campaign-request/add/CampaignAddPage.tsx`의 디자인을 참고하여 작성했습니다.

## 모달 공통 스타일

### 1. 모달 구조
```jsx
<Dialog open={open} onOpenChange={onCloseHandler}>
  <DialogContent className="max-w-[900px] p-0 overflow-hidden">
    <DialogHeader className="bg-background py-3 px-5 border-b">
      <DialogTitle className="text-lg font-medium text-foreground">모달 제목</DialogTitle>
      <DialogClose className="absolute right-4 top-3 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
        <X className="h-4 w-4" />
        <span className="sr-only">닫기</span>
      </DialogClose>
    </DialogHeader>
    
    <DialogBody className="py-6 px-6 overflow-y-auto" style={{ maxHeight: '70vh' }}>
      {/* 컨텐츠 */}
    </DialogBody>
    
    <DialogFooter className="py-4 px-6 border-t bg-gray-50 dark:bg-gray-800/50">
      {/* 버튼 */}
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 2. 테이블 형식 입력 필드

```jsx
<div className="overflow-hidden border border-border rounded-lg mb-6 shadow-sm">
  <table className="min-w-full divide-y divide-border">
    <tbody className="divide-y divide-border">
      <tr>
        <th className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-1/4">
          필드 라벨
        </th>
        <td className="px-5 py-4 bg-white dark:bg-gray-800/20">
          {/* 입력 필드 */}
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### 3. 이미지 업로드 컴포넌트

```jsx
<div className="flex flex-col gap-3">
  <div className="flex items-start gap-4">
    <Button
      type="button"
      onClick={handleImageSelectClick}
      className="bg-blue-500 hover:bg-blue-600 text-white"
      size="sm"
      disabled={loading}
    >
      <KeenIcon icon="picture" className="me-1.5 size-4" />
      이미지 업로드
    </Button>
    {uploadedImage && (
      <span className="text-sm text-success">
        <KeenIcon icon="check-circle" className="me-1" />
        {uploadedImage} 업로드됨
      </span>
    )}
    <input
      ref={imageFileInputRef}
      type="file"
      accept="image/*"
      onChange={handleImageUpload}
      className="hidden"
    />
  </div>
  
  {previewUrl && (
    <div className="mt-2 relative flex items-start gap-2">
      <div className="relative">
        <img 
          src={previewUrl} 
          alt="이미지 미리보기" 
          className="w-40 h-auto rounded-md border border-border object-cover"
          style={{ maxHeight: '60px' }}
        />
        <button 
          type="button"
          onClick={() => {
            setPreviewUrl(null);
            setUploadedImage(null);
          }}
          className="absolute -top-2 -right-2 size-5 flex items-center justify-center bg-red-500 rounded-full text-white shadow-md hover:bg-red-600"
          title="이미지 제거"
        >
          <KeenIcon icon="cross" className="size-2.5" />
        </button>
      </div>
      <Button
        type="button"
        onClick={() => setPreviewModalOpen(true)}
        className="bg-blue-500 hover:bg-blue-600 text-white"
        size="sm"
      >
        <KeenIcon icon="eye" className="me-1.5 size-4" />
        크게 보기
      </Button>
    </div>
  )}
</div>
```

### 4. 상태 배지 스타일

```jsx
<span className={`badge badge-${getStatusColor(status)} badge-outline rounded-[30px] h-auto py-1 text-[12px] font-medium flex items-center justify-center`}>
  <span className={`size-1.5 rounded-full bg-${getBgColorClass(status)} me-1.5`}></span>
  <span>{getStatusLabel(status)}</span>
</span>
```

### 5. 캠페인 로고와 제목 영역 스타일

```jsx
<div className="overflow-hidden border border-border rounded-lg mb-6 shadow-sm bg-white dark:bg-gray-800/20">
  <div className="flex items-center p-5">
    <div className="relative flex-shrink-0 mr-4">
      <img
        src={logoUrl}
        className="rounded-full size-16 object-cover border border-gray-200 shadow-sm"
        alt="캠페인 로고"
        onError={(e) => {
          // 이미지 로드 실패 시 기본 이미지 사용
          (e.target as HTMLImageElement).src = toAbsoluteUrl('/media/animal/svg/animal-default.svg');
        }}
      />
    </div>
    <div className="flex-1 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={handleFileSelectClick}
          className="bg-blue-500 hover:bg-blue-600 text-white"
          size="sm"
          disabled={loading || isReadOnly}
        >
          <KeenIcon icon="picture" className="me-1.5 size-4" />
          로고 이미지 업로드
        </Button>
        
        <span className="text-sm font-medium text-gray-500 mx-2">또는</span>
        
        <div className="w-64">
          <Select
            value={previewUrl ? 'none' : (campaign.logo || 'none')}
            onValueChange={handleLogoChange}
            disabled={loading || isReadOnly}
          >
            <SelectTrigger className="w-full bg-white border-gray-200 focus:border-blue-500">
              <SelectValue placeholder="기본 제공 로고 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">기본 제공 로고 선택</SelectItem>
              <SelectItem value="animal/svg/bear.svg">곰</SelectItem>
              <SelectItem value="animal/svg/cat.svg">고양이</SelectItem>
              {/* ... 나머지 동물 로고 옵션들 ... */}
            </SelectContent>
          </Select>
        </div>
      </div>
      <input
        type="text"
        value={campaign.campaignName}
        onChange={(e) => handleChange('campaignName', e.target.value)}
        className="text-xl font-semibold text-foreground w-full px-3 py-2 border border-border bg-background rounded-md"
        placeholder="캠페인 이름 입력"
        disabled={loading || isReadOnly}
        readOnly={isReadOnly}
      />
      <div className="mt-1">
        <StatusBadge status={campaign.status} />
      </div>
      <p className="text-sm text-muted-foreground mt-1">로고 이미지를 업로드 하거나 기본 제공 로고 중 선택하세요.</p>
    </div>
  </div>
</div>
```

### 6. 오류 메시지 스타일

```jsx
{error && (
  <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 p-4 mx-6 my-4 rounded-md flex items-center shadow-sm border border-red-200 dark:border-red-800/50">
    <KeenIcon icon="warning-triangle" className="size-5 mr-3 flex-shrink-0" />
    <span className="font-medium">{error}</span>
  </div>
)}
```

### 7. 버튼 영역 스타일 (Footer)

```jsx
<div className="flex justify-end items-center gap-3 py-5 px-8 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
  {/* 미리보기 버튼 */}
  <Button 
    onClick={handlePreview} 
    variant="outline" 
    className="border-blue-300 hover:bg-blue-50 text-blue-600 hover:text-blue-700"
    disabled={loading}
  >
    <KeenIcon icon="eye" className="me-1.5 size-4" />
    미리보기
  </Button>
  
  {/* 저장 버튼 */}
  <Button 
    onClick={handleSave} 
    className="bg-success hover:bg-success/90 text-white"
    disabled={loading}
  >
    {loading ? (
      <span className="flex items-center">
        <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></span>
        저장 중...
      </span>
    ) : '저장'}
  </Button>
  
  {/* 취소 버튼 */}
  <Button 
    onClick={onClose} 
    variant="outline"
    className="border-gray-300 text-gray-700 hover:bg-gray-50"
    disabled={loading}
  >
    취소
  </Button>
</div>
```

## 적용 대상 파일

1. `/components/campaign-modals/CampaignDetailModal.tsx`
2. `/components/campaign-modals/CampaignAddModal.tsx`
3. `/components/campaign-modals/CampaignSlotInsertModal.tsx`
4. `/components/campaign-modals/CampaignPreviewModal.tsx`
5. `/components/campaign-modals/CampaignDetailViewModal.tsx`
6. `/components/campaign-modals/CampaignSlotWithKeywordModal.tsx`

모든 모달 컴포넌트가 이 스타일 가이드를 따라야 합니다.

## 주의사항

1. 각 모달 컴포넌트의 고유한 기능은 유지하되 디자인 일관성만 개선합니다.
2. 반응형 디자인 요소를 유지합니다.
3. 다크 모드 지원을 위한 클래스를 포함합니다.
4. 모든 모달에서 일관된 스타일 클래스를 사용합니다.