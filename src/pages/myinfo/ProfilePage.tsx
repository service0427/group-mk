import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuthContext } from '@/auth';
import { KeenIcon } from '@/components';
import { supabase } from '@/supabase';
import { CommonTemplate } from '@/components/pageTemplate';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog';
import { useDialog } from '@/providers';
import { useToast } from '@/providers';
import { useResponsive } from '@/hooks';
import { USER_ROLES, USER_ROLE_THEME_COLORS, getRoleDisplayName, getRoleBadgeColor, getRoleThemeColors, RoleThemeColors } from '@/config/roles.config';

const ProfilePage = () => {
  const { currentUser, setCurrentUser } = useAuthContext();
  const { showDialog } = useDialog();
  const { success, error: showError } = useToast();

  // 은행 목록
  const bankList = [
    '신한은행', '국민은행', '우리은행', '하나은행', 'NH농협은행',
    '기업은행', 'SC제일은행', '카카오뱅크', '토스뱅크', '케이뱅크',
    '부산은행', '대구은행', '광주은행', '경남은행', '전북은행',
    '제주은행', '산업은행', '수협은행', '새마을금고', '신협', '우체국'
  ];

  const [password, setPassword] = useState<string>('');
  const [change_password, setChangePassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [hasBusinessInfo, setHasBusinessInfo] = useState<boolean>(false);
  const [hasPendingRequest, setHasPendingRequest] = useState<boolean>(false);
  const [hasRejectedRequest, setHasRejectedRequest] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [imageModalOpen, setImageModalOpen] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // 사업자 정보 상태
  const [businessNumber, setBusinessNumber] = useState<string>('');
  const [businessName, setBusinessName] = useState<string>('');
  const [representativeName, setRepresentativeName] = useState<string>('');
  const [businessEmail, setBusinessEmail] = useState<string>('');
  const [businessImageUrl, setBusinessImageUrl] = useState<string>('');
  const [businessImageFile, setBusinessImageFile] = useState<File | null>(null);
  const [isBusinessInfoEditable, setIsBusinessInfoEditable] = useState<boolean>(true);

  // 출금 계좌 정보 상태
  const [bankName, setBankName] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountHolder, setAccountHolder] = useState<string>('');
  const [isBankAccountEditable, setIsBankAccountEditable] = useState<boolean>(true);

  // 등업 신청 관련
  const [showLevelUpModal, setShowLevelUpModal] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<string>('');

  // ESC 키 핸들러
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && imageModalOpen) {
        setImageModalOpen(false);
        setSelectedImage('');
      }
    };

    if (imageModalOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [imageModalOpen]);

  // 사업자 정보와 등업 신청 현황 체크
  // 초기 상태 설정을 위한 useEffect
  useEffect(() => {

    // 직접 사용자 데이터 가져오기 - business가 없는 경우를 대비
    const fetchUserWithBusiness = async () => {
      if (currentUser?.id) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select("*, business")
            .eq('id', currentUser.id)
            .single();

          if (error) {
            console.error("직접 사용자 데이터 조회 오류:", error);
            return;
          }

          // business 필드가 있고 currentUser에 없는 경우 업데이트
          if (data && data.business && !currentUser.business) {
            const updatedUser = {
              ...currentUser,
              business: data.business
            };
            setCurrentUser(updatedUser);
          }
        } catch (err) {
          console.error("사용자 데이터 직접 조회 중 오류:", err);
        }
      }
    };

    // business 필드가 없는 경우에만 직접 조회
    if (currentUser && !currentUser.business) {
      fetchUserWithBusiness();
    }

    const checkBusinessStatus = async () => {
      try {
        // 초기화
        setLoading(true);

        // 사용자 정보 설정
        if (currentUser?.full_name) {
          setFullName(currentUser.full_name);
        }

        // 사용자의 business 정보 체크
        // 다양한 방식으로 business 접근 시도
        const business = currentUser?.business || currentUser?.["business"] || null;

        if (business) {
          setHasBusinessInfo(true);
          // 사업자 정보 상태 설정
          setBusinessNumber(business.business_number || '');
          setBusinessName(business.business_name || '');
          setRepresentativeName(business.representative_name || '');
          setBusinessEmail(business.business_email || '');
          setBusinessImageUrl(business.business_image_url || '');
          
          // 사업자 정보가 하나라도 있으면 수정 불가
          const hasBusinessData = business.business_number || 
            business.business_name || 
            business.representative_name || 
            business.business_email;
          setIsBusinessInfoEditable(!hasBusinessData);

          // 출금 계좌 정보 설정
          if (business.bank_account) {
            setBankName(business.bank_account.bank_name || '');
            setAccountNumber(business.bank_account.account_number || '');
            setAccountHolder(business.bank_account.account_holder || '');
            // 계좌 정보가 하나라도 있으면 수정 불가
            const hasAccountInfo = business.bank_account.bank_name ||
              business.bank_account.account_number ||
              business.bank_account.account_holder;
            setIsBankAccountEditable(!hasAccountInfo);
          }
        } else {
          setHasBusinessInfo(false);
          setIsBusinessInfoEditable(true);
        }

        // 대기 중인 등업 신청이 있는지 체크
        const { data: pendingData, error: pendingError } = await supabase
          .from('levelup_apply')
          .select('*')
          .eq('user_id', currentUser?.id)
          .eq('status', 'pending')
          .limit(1);

        if (pendingError) {
          console.error('등업 신청 조회 오류:', pendingError);
          throw pendingError;
        }

        const isPending = pendingData && pendingData.length > 0;
        setHasPendingRequest(isPending);

        // 거부된 등업 신청이 있는지 체크
        const { data: rejectedData, error: rejectedError } = await supabase
          .from('levelup_apply')
          .select('*')
          .eq('user_id', currentUser?.id)
          .eq('status', 'rejected')
          .order('updated_at', { ascending: false })
          .limit(1);

        if (rejectedError) {
          console.error('거부된 등업 신청 조회 오류:', rejectedError);
          throw rejectedError;
        }

        if (rejectedData && rejectedData.length > 0) {
          setHasRejectedRequest(true);
          setRejectionReason(rejectedData[0].rejection_reason || '');
        } else {
          setHasRejectedRequest(false);
          setRejectionReason('');
        }

      } catch (err) {
        console.error("프로필 페이지 데이터 로드 오류:", err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.id) {
      checkBusinessStatus();
    }
  }, [currentUser]);

  // 렌더링 확인을 위한 useEffect
  useEffect(() => {

  }, [hasBusinessInfo, hasPendingRequest, hasRejectedRequest]);

  const roleClass = currentUser?.role ? `bg-${getRoleBadgeColor(currentUser.role)}/10 text-${getRoleBadgeColor(currentUser.role)}` : '';
  const roleText = currentUser?.role ? getRoleDisplayName(currentUser.role) : '';

  // 역할별 테마 색상 가져오기
  const roleThemeColors = currentUser?.role ? USER_ROLE_THEME_COLORS[currentUser.role] || null : null;

  const statusClass = currentUser?.status === 'active' ? 'badge-success' :
    currentUser?.status === 'inactive' ? 'badge-secondary' :
      currentUser?.status === 'pending' ? 'badge-warning' :
        currentUser?.status === 'suspended' ? 'badge-danger' : '';

  const statusText = currentUser?.status === 'active' ? '활성화' :
    currentUser?.status === 'inactive' ? '비활성화' :
      currentUser?.status === 'pending' ? '대기중' :
        currentUser?.status === 'suspended' ? '정지됨' : '';


  // 이미지 확대 모달 열기
  // 이미지 모달 열기 함수 - null/undefined 체크 추가
  const openImageModal = (imageUrl: string | undefined) => {
    if (!imageUrl) {
      return;
    }
    setSelectedImage(imageUrl);
    setImageModalOpen(true);
  };

  // 사업자등록증 이미지 업로드 핸들러
  const handleBusinessImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('이미지 파일 크기는 5MB를 초과할 수 없습니다.');
      return;
    }

    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      showError('이미지 파일만 업로드 가능합니다.');
      return;
    }

    setBusinessImageFile(file);

    // 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setBusinessImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 등업 신청 처리
  const handleLevelUpRequest = async () => {
    if (!selectedRole) {
      showError('신청할 역할을 선택해주세요.');
      return;
    }

    try {
      setLoading(true);

      // levelup_apply 테이블에 신청 정보 저장
      const { error } = await supabase
        .from('levelup_apply')
        .insert({
          user_id: currentUser?.id,
          current_role: currentUser?.role || 'beginner', // 현재 역할 저장
          target_role: selectedRole,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      success('등업 신청이 완료되었습니다. 관리자 승인을 기다려주세요.');
      setShowLevelUpModal(false);
      setHasPendingRequest(true);

    } catch (error: any) {
      showError('등업 신청 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeSuccess = async () => {
    // 등업 신청 성공 후 상태 업데이트
    setHasBusinessInfo(true);
    setHasPendingRequest(true);
    setHasRejectedRequest(false);
    setRejectionReason('');

    // 사용자 정보 새로고침
    try {
      // 사용자 ID가 없으면 실행하지 않음
      if (!currentUser?.id) {
        return;
      }

      const { data: refreshedUser, error: refreshError } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id) // currentUser?.id가 있다고 확인되었으므로 안전하게 사용
        .single();

      if (!refreshError && refreshedUser) {
        // setCurrentUser 함수가 있는지 확인
        if (typeof setCurrentUser === 'function') {
          setCurrentUser(refreshedUser);
        }
      }
    } catch (err) {
      // 
    }
  };

  // 이전 사업자 정보 가져오기 (이미지와 이메일 정보 포함)
  const getPreviousBusinessInfo = () => {
    // currentUser가 null이거나 business가 없는 경우 undefined 반환
    if (!currentUser || !currentUser.business) {
      return undefined;
    }

    // business 객체를 안전하게 처리 (타입 단언 사용)
    const business = currentUser.business as any;

    return {
      business_number: business.business_number || '',
      business_name: business.business_name || '',
      representative_name: business.representative_name || '',
      business_email: business.business_email || '',
      business_image_url: business.business_image_url || ''
    };
  };

  // 이 함수는 더 이상 사용되지 않지만 참조용으로 남겨둡니다

  const handleSaveProfile = async () => {
    // 메시지 상태 변수
    let updatedSuccessfully = false;
    let successMessage = '';
    let messageTimer: NodeJS.Timeout;

    try {
      // 변경 감지 변수
      let nameUpdated = false;
      let passwordUpdated = false;
      let businessInfoUpdated = false;

      // 1. 이름 업데이트 (값이 있고 변경되었을 때만)
      if (fullName && fullName !== currentUser?.full_name) {

        try {
          // Supabase Auth 메타데이터 업데이트
          const { error: updateAuthError } = await supabase.auth.updateUser({
            data: { full_name: fullName }
          });

          if (updateAuthError) {
            throw new Error(updateAuthError.message);
          }

          // users 테이블 업데이트
          const { error: updateDBError } = await supabase
            .from('users')
            .update({ full_name: fullName })
            .eq('id', currentUser?.id);

          if (updateDBError) {

            throw new Error(updateDBError.message);
          }



          // 현재 사용자 상태 업데이트 
          if (currentUser) {
            const updatedUser = {
              ...currentUser,
              full_name: fullName
            };

            // 상태 업데이트
            setCurrentUser(updatedUser);


            // 세션 스토리지에 업데이트된 사용자 정보 저장 (새로고침 시 활용)
            try {
              sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));

            } catch (e) {

            }

            // 새로운 사용자 정보로 세션 갱신
            try {
              await supabase.auth.refreshSession();

            } catch (refreshError) {

            }
          }

          // 이름이 변경되었다고 표시
          nameUpdated = true;


        } catch (nameError: any) {

          showDialog({
            title: '오류',
            message: '이름 변경 중 오류가 발생했습니다: ' + nameError.message,
            variant: 'destructive',
            confirmText: '확인'
          });
          return;
        }
      } else {

      }

      // 2. 비밀번호 업데이트 (입력된 경우에만)
      if (password && change_password) {
        try {
          if (change_password.length < 6) {
            showDialog({
              title: '알림',
              message: '새 비밀번호는 최소 6자리 이상이어야 합니다.',
              variant: 'warning',
              confirmText: '확인'
            });
            return;
          } else if (password === change_password) {
            showDialog({
              title: '알림',
              message: '현재 비밀번호와 새 비밀번호가 같습니다.',
              variant: 'warning',
              confirmText: '확인'
            });
            return;
          } else {
            // 현재 비밀번호 확인
            const verifyPassword = await supabase.rpc('verify_password', {
              password: password,
              user_id: currentUser?.id,
            });

            if (!verifyPassword.data || verifyPassword.error) {

              showDialog({
                title: '오류',
                message: '현재 비밀번호가 일치하지 않습니다.',
                variant: 'destructive',
                confirmText: '확인'
              });
              return;
            } else {


              // 1. 먼저 users 테이블에 새 비밀번호의 해시값 저장
              const hashPassword = await supabase.rpc('hash_password', {
                password: change_password // 새 비밀번호 해싱
              });

              if (hashPassword.error) {

                throw new Error(hashPassword.error.message);
              }

              // 2. users 테이블 업데이트
              const { error: updateDBError } = await supabase
                .from('users')
                .update({ password_hash: hashPassword.data })
                .eq('id', currentUser?.id);

              if (updateDBError) {

                throw new Error(updateDBError.message);
              }

              // 3. Supabase Auth 업데이트

              const { error: updateAuthError } = await supabase.auth.updateUser({
                password: change_password,
              });

              if (updateAuthError) {

                throw new Error(updateAuthError.message);
              }

              // 비밀번호가 변경되었다고 표시
              passwordUpdated = true;

              // 입력 필드 초기화
              setPassword('');
              setChangePassword('');
            }
          }
        } catch (passwordError: any) {

          showDialog({
            title: '오류',
            message: '비밀번호 변경 중 오류가 발생히습니다: ' + passwordError.message,
            variant: 'destructive',
            confirmText: '확인'
          });
          return;
        }
      }

      // 3. 사업자 정보 업데이트
      // 항상 사업자 정보를 저장 (입력된 것만)
      const businessData: any = {};

      // 사업자등록증 이미지 업로드
      let uploadedImageUrl = businessImageUrl;
      if (businessImageFile) {
        try {
          const userId = currentUser?.id || 'unknown';
          const fileName = `business_license_${Date.now()}`;
          const fileExt = businessImageFile.name.split('.').pop();
          const filePath = `${userId}/${fileName}.${fileExt}`;

          // 이미지 업로드 시도
          const { error: uploadError, data: uploadData } = await supabase.storage
            .from('business-images')
            .upload(filePath, businessImageFile, {
              cacheControl: '3600',
              upsert: true
            });

          if (uploadError) {
            console.error('스토리지 업로드 실패:', uploadError);

            // 실패 시 Base64로 대체 (폴백)
            const reader = new FileReader();
            const readFileAsDataURL = (file: File): Promise<string> => {
              return new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
              });
            };

            // 이미지를 Base64로 변환
            uploadedImageUrl = await readFileAsDataURL(businessImageFile);
          } else {
            // 업로드 성공 시 URL 생성
            const { data: { publicUrl } } = supabase.storage
              .from('business-images')
              .getPublicUrl(filePath);

            uploadedImageUrl = publicUrl;
          }
        } catch (uploadError: any) {
          console.error('이미지 처리 오류:', uploadError);

          // 모든 방법이 실패하면 Base64로 폴백
          try {
            const reader = new FileReader();
            const readFileAsDataURL = (file: File): Promise<string> => {
              return new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
              });
            };

            uploadedImageUrl = await readFileAsDataURL(businessImageFile);
          } catch (base64Error) {
            showError('사업자등록증 이미지 처리 중 오류가 발생했습니다.');
            return;
          }
        }
      }

      // 입력된 정보만 저장 (계좌 정보 포함)
      const hasBusinessInfo = businessNumber || businessName || representativeName || businessEmail || uploadedImageUrl;
      const hasBankInfo = isBankAccountEditable && (bankName || accountNumber || accountHolder);

      // 기존 사업자 정보와 비교
      const existingBusiness = currentUser?.business || {} as any;
      const businessChanged = hasBusinessInfo && (
        businessNumber !== (existingBusiness.business_number || '') ||
        businessName !== (existingBusiness.business_name || '') ||
        representativeName !== (existingBusiness.representative_name || '') ||
        businessEmail !== (existingBusiness.business_email || '') ||
        uploadedImageUrl !== (existingBusiness.business_image_url || '')
      );

      const bankAccountChanged = hasBankInfo && isBankAccountEditable;

      if (businessChanged || bankAccountChanged) {
        businessData.business_number = businessNumber;
        businessData.business_name = businessName;
        businessData.representative_name = representativeName;
        businessData.business_email = businessEmail;
        businessData.business_image_url = uploadedImageUrl;

        // Base64 이미지인 경우 타입 저장
        if (uploadedImageUrl && uploadedImageUrl.startsWith('data:image')) {
          businessData.business_image_storage_type = 'base64';
        } else if (uploadedImageUrl) {
          businessData.business_image_storage_type = 'supabase_storage';
          businessData.business_image_bucket = 'business-images';
        }

        // 기존 정보 유지
        if (currentUser?.business) {
          businessData.verified = currentUser.business.verified;
          businessData.verification_date = currentUser.business.verification_date;
        }

        // 은행 계좌 정보 (수정 가능한 경우에만)
        if (isBankAccountEditable && (bankName || accountNumber || accountHolder)) {
          businessData.bank_account = {
            bank_name: bankName,
            account_number: accountNumber,
            account_holder: accountHolder,
            is_editable: false  // 한번 저장하면 수정 불가
          };
        } else if (!isBankAccountEditable && currentUser?.business?.bank_account) {
          // 수정 불가능한 경우 기존 정보 유지
          businessData.bank_account = currentUser.business.bank_account;
        }
      }

      // 사업자 정보가 있으면 업데이트
      if (Object.keys(businessData).length > 0) {

        try {
          // users 테이블 업데이트
          const { error: updateBusinessError } = await supabase
            .from('users')
            .update({
              business: businessData
            })
            .eq('id', currentUser?.id);

          if (updateBusinessError) {
            throw new Error(updateBusinessError.message);
          }

          // currentUser 업데이트
          if (setCurrentUser) {
            setCurrentUser({
              ...currentUser,
              business: businessData
            });
          }

          businessInfoUpdated = true;

          // 이미지 파일 초기화
          if (businessImageFile) {
            setBusinessImageFile(null);
            setBusinessImageUrl(uploadedImageUrl);
          }

        } catch (businessError: any) {
          showDialog({
            title: '오류',
            message: '사업자 정보 업데이트 중 오류가 발생했습니다: ' + businessError.message,
            variant: 'destructive',
            confirmText: '확인'
          });
        }
      }

      // 성공 메시지 결정
      if (nameUpdated || passwordUpdated || businessInfoUpdated) {
        updatedSuccessfully = true;

        // 다양한 변경 사항에 따른 메시지
        if (nameUpdated && passwordUpdated && businessInfoUpdated) {
          successMessage = '모든 정보가 업데이트되었습니다.';
        } else if (nameUpdated && passwordUpdated) {
          successMessage = '사용자 정보가 업데이트되었습니다.';
        } else if (nameUpdated && businessInfoUpdated) {
          successMessage = '이름과 사업자 정보가 변경되었습니다.';
        } else if (passwordUpdated && businessInfoUpdated) {
          successMessage = '비밀번호와 사업자 정보가 변경되었습니다.';
        } else if (nameUpdated) {
          successMessage = '이름이 변경되었습니다.';
        } else if (passwordUpdated) {
          successMessage = '비밀번호가 변경되었습니다.';
        } else if (businessInfoUpdated) {
          successMessage = '사업자 정보가 업데이트되었습니다.';
        }
      }

      // 최종 작업 상태 확인

      // 변경사항이 있는지, 없는지에 따라 메시지 표시
      const displayMessage = updatedSuccessfully
        ? successMessage
        : '변경된 내용이 없습니다.';

      // 최종 메시지 디버깅

      // 토스트로 메시지 표시
      if (updatedSuccessfully) {
        success(displayMessage);
      } else {
        showDialog({
          title: '알림',
          message: displayMessage,
          variant: 'warning',
          confirmText: '확인'
        });
      }

      // React state 업데이트
      setMessage(displayMessage);

      // 메시지가 화면에 표시되는지 확인하기 위한 디버깅 로그

      // 5초 후에 메시지 숨기기
      messageTimer = setTimeout(() => {

        setMessage('');
      }, 5000);

    } catch (error: any) {
      // 전체 함수에 대한 에러 처리

      // 에러 메시지 표시
      const errorMessage = '업데이트에 실패했습니다: ' + error.message;
      setMessage(errorMessage);
      showError(errorMessage);

      // 오류 메시지도 5초 후에 자동으로 지우기
      messageTimer = setTimeout(() => {
        setMessage('');
      }, 5000);
    }
  }

  // 사이드바 메뉴 아이템
  const sidebarItems = [
    {
      id: 'user_info',
      title: '사용자 정보',
      icon: 'profile-circle'
    },
    {
      id: 'business_info',
      title: '사업자 정보',
      icon: 'shop'
    },
    {
      id: 'bank_info',
      title: '출금 계좌 정보',
      icon: 'bank'
    },
    ...(currentUser?.role !== USER_ROLES.DISTRIBUTOR ? [{
      id: 'levelup_apply',
      title: '등업 신청',
      icon: 'crown'
    }] : [])
  ];

  const [activeSection, setActiveSection] = useState('user_info');
  const desktopMode = useResponsive('up', 'lg');

  // 스크롤 이벤트 처리
  useEffect(() => {
    const scrollContainer = document.querySelector('main[role="content"]') as HTMLElement;

    if (!scrollContainer) {
      return;
    }

    const handleScroll = () => {
      const sections = sidebarItems.map(item => ({
        id: item.id,
        element: document.getElementById(item.id)
      }));

      const viewportHeight = window.innerHeight;
      const triggerPoint = viewportHeight * 0.3;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.element) {
          const rect = section.element.getBoundingClientRect();
          if (rect.top <= triggerPoint) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [sidebarItems]);

  // 섹션 클릭 핸들러
  const handleSectionClick = (targetId: string) => {
    const scrollContainer = document.querySelector('main[role="content"]') as HTMLElement;
    const element = document.getElementById(targetId);

    if (element && scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();

      const offset = 80;
      const scrollPosition = scrollContainer.scrollTop + elementRect.top - containerRect.top - offset;

      scrollContainer.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });

      setTimeout(() => {
        setActiveSection(targetId);
      }, 100);
    }
  };

  return (
    <CommonTemplate
      title="내정보 관리"
      description="기본 관리 > 내정보 관리"
      showPageMenu={false}
    >
      <div className="flex flex-col">
        {/* 전체 알림 메시지 */}
        {message && (
          <div id="alertMessage" className="alert bg-success/20 border border-success/30 text-success shadow-sm mb-6 p-4 rounded-lg animate-fadeIn transition-all duration-300 lg:col-span-3">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-success fill-success/10 shrink-0 h-5 w-5 mr-2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-sm font-medium text-success-active">{message}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* 메인 콘텐츠 */}
          <div className="flex-1">
            <div className="grid gap-6">
              {/* 프로필 카드 */}
              <div id="user_info" className="card rounded-xl shadow-sm">
                <div className="card-header border-b border-gray-200 p-6">
                  <div className="flex items-center gap-2">
                    <KeenIcon icon="profile-circle" className="size-5 text-primary" />
                    <h4 className="text-base font-semibold text-gray-900">사용자 정보</h4>
                  </div>
                </div>
                <div className="card-body p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-xl font-semibold text-primary">
                        {currentUser?.full_name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {currentUser?.full_name || '사용자'}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`badge ${roleClass} px-2.5 py-0.5 rounded-full text-xs font-medium`}
                          style={roleThemeColors ? {
                            backgroundColor: `${roleThemeColors.baseHex}15`,
                            color: roleThemeColors.baseHex
                          } : undefined}>
                          {roleText || '사용자'}
                        </span>
                        <span className={`badge badge-sm ${statusClass}`}>{statusText || '권한 없음'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="form-label text-sm font-medium text-gray-700">이름</label>
                      <input
                        type="text"
                        className="input"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="이름을 입력하세요"
                      />
                    </div>

                    <div>
                      <label className="form-label text-sm font-medium text-gray-700">이메일</label>
                      <input
                        type="email"
                        className="input bg-gray-50"
                        value={currentUser?.email || ''}
                        disabled
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label text-sm font-medium text-gray-700">현재 비밀번호</label>
                        <input
                          type="password"
                          className="input"
                          placeholder="현재 비밀번호"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="form-label text-sm font-medium text-gray-700">새 비밀번호</label>
                        <input
                          type="password"
                          className="input"
                          placeholder="새 비밀번호 (최소 6자리)"
                          value={change_password}
                          onChange={(e) => setChangePassword(e.target.value)}
                        />
                        {change_password && change_password.length < 6 && (
                          <p className="text-danger text-xs mt-1">최소 6자리 이상 입력해주세요</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 알림 메시지는 상단으로 이동됨 */}

              {/* 사업자 정보 카드 */}
              <div id="business_info" className="card rounded-xl shadow-sm">
                <div className="card-header border-b border-gray-200 p-6">
                  <div className="flex items-center gap-2">
                    <KeenIcon icon="shop" className="size-5 text-primary" />
                    <h4 className="text-base font-semibold text-gray-900">사업자 정보</h4>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">캐시 충전 및 등업 신청을 위해 사업자 정보를 입력해주세요 (선택사항)</p>
                </div>
                <div className="card-body p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label text-sm font-medium text-gray-700">사업자 등록번호</label>
                      <input
                        type="text"
                        className={`input ${!isBusinessInfoEditable ? 'bg-gray-50' : ''}`}
                        value={businessNumber}
                        onChange={(e) => setBusinessNumber(e.target.value)}
                        placeholder="000-00-00000"
                        disabled={!isBusinessInfoEditable}
                      />
                    </div>
                    <div>
                      <label className="form-label text-sm font-medium text-gray-700">상호명</label>
                      <input
                        type="text"
                        className={`input ${!isBusinessInfoEditable ? 'bg-gray-50' : ''}`}
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="상호명을 입력하세요"
                        disabled={!isBusinessInfoEditable}
                      />
                    </div>
                    <div>
                      <label className="form-label text-sm font-medium text-gray-700">대표자명</label>
                      <input
                        type="text"
                        className={`input ${!isBusinessInfoEditable ? 'bg-gray-50' : ''}`}
                        value={representativeName}
                        onChange={(e) => setRepresentativeName(e.target.value)}
                        placeholder="대표자명을 입력하세요"
                        disabled={!isBusinessInfoEditable}
                      />
                    </div>
                    <div>
                      <label className="form-label text-sm font-medium text-gray-700">사업자용 이메일</label>
                      <input
                        type="email"
                        className={`input ${!isBusinessInfoEditable ? 'bg-gray-50' : ''}`}
                        value={businessEmail}
                        onChange={(e) => setBusinessEmail(e.target.value)}
                        placeholder="business@example.com"
                        disabled={!isBusinessInfoEditable}
                      />
                    </div>
                  </div>

                  {/* 사업자등록증 이미지 */}
                  <div className="mt-6 md:col-span-2">
                    <label className="form-label text-sm font-medium text-gray-700 mb-3">사업자등록증</label>
                    <div className="space-y-3">
                      {businessImageUrl ? (
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex items-start gap-4">
                            <div
                              className="relative cursor-pointer flex-shrink-0"
                              onClick={() => openImageModal(businessImageUrl)}
                            >
                              <img
                                src={businessImageUrl}
                                alt="사업자등록증"
                                className="h-48 w-48 object-cover rounded-lg hover:opacity-90 transition-opacity"
                              />
                              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center">
                                <KeenIcon icon="eye" className="size-6 text-white opacity-0 hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-700 mb-2">사업자등록증이 등록되었습니다</p>
                              <p className="text-xs text-gray-500 mb-3">이미지를 클릭하면 크게 볼 수 있습니다</p>
                              {isBusinessInfoEditable ? (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-light"
                                  onClick={() => {
                                    setBusinessImageUrl('');
                                    setBusinessImageFile(null);
                                  }}
                                >
                                  <KeenIcon icon="trash" className="mr-1" />
                                  삭제
                                </button>
                              ) : (
                                <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded inline-flex items-center">
                                  <KeenIcon icon="lock" className="mr-1" />
                                  삭제 불가
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center">
                          <div className="flex items-center justify-center mb-4">
                            <KeenIcon icon="picture" className="text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-600 mb-3">등록된 사업자등록증이 없습니다</p>
                          {isBusinessInfoEditable ? (
                            <>
                              <input
                                type="file"
                                id="business-image-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={handleBusinessImageUpload}
                              />
                              <label
                                htmlFor="business-image-upload"
                                className="btn btn-sm btn-primary cursor-pointer"
                              >
                                <KeenIcon icon="upload" className="mr-1" />
                                사업자등록증 업로드
                              </label>
                              <p className="text-xs text-gray-500 mt-2">이미지 파일만 업로드 가능합니다 (최대 5MB)</p>
                            </>
                          ) : (
                            <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded inline-flex items-center">
                              <KeenIcon icon="lock" className="mr-1" />
                              업로드 불가
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 사업자 정보 수정 불가 안내 */}
                  {!isBusinessInfoEditable && (
                    <div className="mt-6 bg-warning/10 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <KeenIcon icon="information-2" className="size-5 text-warning flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-warning">사업자 정보 수정 불가</p>
                          <p className="text-sm text-gray-600 mt-1">
                            사업자 정보는 한 번 저장 후 수정할 수 없습니다. 
                            변경이 필요한 경우 관리자에게 문의해주세요.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 출금 계좌 정보 카드 */}
              <div id="bank_info" className="card rounded-xl shadow-sm">
                <div className="card-header border-b border-gray-200 p-6">
                  <div className="flex items-center gap-2">
                    <KeenIcon icon="bank" className="size-5 text-primary" />
                    <h4 className="text-base font-semibold text-gray-900">출금 계좌 정보</h4>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">출금을 위한 계좌 정보를 입력해주세요 (최초 1회만 입력 가능)</p>
                </div>
                <div className="card-body p-6">
                  {isBankAccountEditable ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="form-label text-sm font-medium text-gray-700">은행명</label>
                          <select
                            className="select w-full"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                          >
                            <option value="">은행을 선택하세요</option>
                            {bankList.map((bank) => (
                              <option key={bank} value={bank}>{bank}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="form-label text-sm font-medium text-gray-700">계좌번호</label>
                          <input
                            type="text"
                            className="input"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                            placeholder="계좌번호를 입력하세요"
                          />
                        </div>
                        <div>
                          <label className="form-label text-sm font-medium text-gray-700">예금주</label>
                          <input
                            type="text"
                            className="input"
                            value={accountHolder}
                            onChange={(e) => setAccountHolder(e.target.value)}
                            placeholder="예금주명을 입력하세요"
                          />
                        </div>
                      </div>
                      <div className="mt-4 bg-blue-50 border border-blue-200 p-3 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <KeenIcon icon="information" className="size-4 inline mr-1" />
                          계좌 정보는 한 번 저장하면 수정할 수 없으니 신중하게 입력해주세요.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">은행명</p>
                          <p className="font-medium">{bankName || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">계좌번호</p>
                          <p className="font-medium">{accountNumber || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">예금주</p>
                          <p className="font-medium">{accountHolder || '-'}</p>
                        </div>
                      </div>
                      <div className="text-xs text-danger bg-white p-3 rounded border border-gray-200">
                        <KeenIcon icon="lock" className="size-4 inline mr-1" />
                        계좌 정보는 보안을 위해 수정할 수 없습니다. 변경이 필요한 경우 관리자에게 문의해주세요.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 등업 신청 카드 - 총판이 아닌 경우에만 표시 */}
              {currentUser?.role !== USER_ROLES.DISTRIBUTOR && (
                <div id="levelup_apply" className="card rounded-xl shadow-sm">
                  <div className="card-header border-b border-gray-200 p-6">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <KeenIcon icon="crown" className="size-5 text-primary" />
                        <h4 className="text-base font-semibold text-gray-900">등업 신청</h4>
                      </div>
                      {!loading && !hasPendingRequest && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => {
                            // 사업자 정보 체크
                            const hasCompleteBusinessInfo = businessNumber && businessName && representativeName;
                            // 출금 계좌 정보 체크
                            const hasCompleteBankInfo = bankName && accountNumber && accountHolder;

                            if (!hasCompleteBusinessInfo || !hasCompleteBankInfo) {
                              showDialog({
                                title: '등업 신청 불가',
                                message: '사업자 정보와 출금 계좌 정보가 모두 입력되어야 신청 가능합니다.',
                                variant: 'warning',
                                confirmText: '확인'
                              });
                              return;
                            }

                            setShowLevelUpModal(true);
                          }}
                          disabled={loading}
                        >
                          <KeenIcon icon="crown" className="mr-1" />
                          신청하기
                        </button>
                      )}
                    </div>
                  </div>
                  {(loading || hasPendingRequest || hasRejectedRequest) && (
                    <div className="card-body p-6">
                      {loading ? (
                        <div className="flex items-center">
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <p className="ml-3 text-gray-500 text-sm">정보를 불러오는 중입니다...</p>
                        </div>
                      ) : (
                        <>
                          {hasPendingRequest && (
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                              <div className="flex items-start gap-3">
                                <KeenIcon icon="time" className="size-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <h5 className="text-amber-800 font-semibold mb-1">등업 신청이 대기 중입니다</h5>
                                  <p className="text-amber-700 text-sm">
                                    관리자 승인 후 역할이 변경됩니다. 승인까지 일정 시간이 소요될 수 있습니다.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {!hasPendingRequest && hasRejectedRequest && (
                            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                              <div className="flex items-start gap-3">
                                <KeenIcon icon="cross-circle" className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <h5 className="text-red-800 font-semibold mb-2">이전 등업 신청이 거부되었습니다</h5>
                                  <div className="bg-white p-3 rounded border border-red-200 mb-3">
                                    <p className="text-sm text-gray-600 font-medium mb-1">거부 사유:</p>
                                    <p className="text-sm text-gray-700">
                                      {rejectionReason || '관리자가 등업 신청을 거부했습니다.'}
                                    </p>
                                  </div>
                                  <p className="text-sm text-red-700">
                                    거부 사유를 확인하고 다시 신청해 주세요.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 우측 스크롤 메뉴 - 데스크톱만 */}
          {desktopMode && (
            <div className="w-64 shrink-0">
              <div className="sticky top-24">
                <div className="card rounded-xl shadow-sm p-6">
                  <h5 className="text-sm font-semibold text-gray-900 mb-4">내정보 관리 메뉴</h5>
                  <div className="flex flex-col grow relative before:absolute before:start-[11px] before:top-0 before:bottom-0 before:border-s before:border-gray-200">
                    {sidebarItems.map((item, index) => (
                      <div
                        key={item.id}
                        onClick={() => handleSectionClick(item.id)}
                        className={`cursor-pointer flex items-center gap-1.5 rounded-lg pl-2.5 pr-2.5 py-2.5 border border-transparent text-gray-800 hover:rounded-lg hover:text-primary text-2sm ${activeSection === item.id ? 'bg-secondary-active text-primary font-medium' : ''
                          }`}
                      >
                        <span className={`flex w-1.5 relative before:absolute before:left-0 before:top-1/2 before:size-1.5 before:rounded-full before:-translate-x-1/2 before:-translate-y-1/2 ${activeSection === item.id ? 'before:bg-primary' : ''
                          }`}></span>
                        {item.title}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 하단 버튼 - 데스크톱에서는 메인 콘텐츠 영역에만, 모바일에서는 전체 너비 */}
      <div className={`flex justify-end mt-6 ${desktopMode ? 'lg:pr-[280px]' : ''}`}>
        <button
          className="btn btn-primary btn-lg px-8"
          onClick={handleSaveProfile}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              저장 중...
            </span>
          ) : (
            <span className="flex items-center">
              <KeenIcon icon="check" className="mr-2" />
              정보 저장
            </span>
          )}
        </button>
      </div>

      {/* 등업 신청 모달 */}
      {
        showLevelUpModal && (
          <Dialog open={showLevelUpModal} onOpenChange={setShowLevelUpModal}>
            <DialogContent className="max-w-md" aria-describedby={undefined}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <KeenIcon icon="crown" className="size-5" />
                  등업 신청
                </DialogTitle>
              </DialogHeader>
              <DialogBody>
                <div className="space-y-4">
                  <div>
                    <label className="form-label mb-2">신청할 역할을 선택해주세요</label>
                    <select
                      className="select"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    >
                      <option value="">역할 선택</option>
                      {/* 현재 역할에 따라 선택 가능한 옵션 표시 */}
                      {currentUser?.role === USER_ROLES.AGENCY ? (
                        // 대행사는 총판으로만 등업 가능
                        <option value={USER_ROLES.DISTRIBUTOR}>총판</option>
                      ) : (
                        // 그 외(비기너, 광고주 등)는 대행사, 총판 순으로 표시
                        <>
                          <option value={USER_ROLES.AGENCY}>대행사</option>
                          <option value={USER_ROLES.DISTRIBUTOR}>총판</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="bg-info/10 p-4 rounded-lg">
                    <p className="text-sm text-info">
                      관리자 승인 후 역할이 변경됩니다.
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      승인까지 일정 시간이 소요될 수 있습니다.
                    </p>
                  </div>
                </div>
              </DialogBody>
              <DialogFooter>
                <button
                  className="btn btn-primary"
                  onClick={handleLevelUpRequest}
                  disabled={loading || !selectedRole}
                >
                  {loading ? '신청 중...' : '신청하기'}
                </button>
                <button
                  className="btn btn-light"
                  onClick={() => {
                    setShowLevelUpModal(false);
                    setSelectedRole('');
                  }}
                >
                  취소
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )
      }

      {/* 이미지 확대 모달 - Portal로 body에 직접 렌더링 */}
      {
        imageModalOpen && selectedImage && createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4"
            onClick={() => {
              setImageModalOpen(false);
              setSelectedImage('');
            }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <div className="relative max-w-4xl max-h-[90vh]">
              <img
                src={selectedImage}
                alt="사업자등록증"
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSI1MDAiIGZpbGw9IiNFQkVCRUIiLz48dGV4dCB4PSIxNTAiIHk9IjI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmaWxsPSIjNjY2NjY2Ij7snbTrr7jsp4Drk6TsnZgg67Cc7IOd7J2EIOyeheugpe2VqeyzkuycvOuhnDwvdGV4dD48L3N2Zz4=";
                }}
              />
              <button
                className="absolute top-2 right-2 btn btn-sm btn-light shadow-lg"
                onClick={() => {
                  setImageModalOpen(false);
                  setSelectedImage('');
                }}
              >
                <KeenIcon icon="cross" className="text-lg" />
              </button>
              <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-3">
                <a
                  href={selectedImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-primary shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <KeenIcon icon="external-link" className="me-1" />
                  새 탭에서 열기
                </a>
                <button
                  className="btn btn-sm btn-light shadow-lg"
                  onClick={() => {
                    setImageModalOpen(false);
                    setSelectedImage('');
                  }}
                >
                  <KeenIcon icon="cross" className="me-1" />
                  닫기
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      }
    </CommonTemplate >
  );
};

export { ProfilePage };