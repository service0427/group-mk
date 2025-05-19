import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/auth';
import { KeenIcon } from '@/components';
import { supabase } from '@/supabase';
import { CommonTemplate } from '@/components/pageTemplate';
import { BusinessUpgradeModal } from '@/components/business';
import { USER_ROLES, USER_ROLE_THEME_COLORS, getRoleDisplayName, getRoleBadgeColor, getRoleThemeColors, RoleThemeColors } from '@/config/roles.config';

const ProfilePage = () => {
  const { currentUser, setCurrentUser } = useAuthContext();

  const [password, setPassword] = useState<string>('');
  const [change_password, setChangePassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [hasBusinessInfo, setHasBusinessInfo] = useState<boolean>(false);
  const [hasPendingRequest, setHasPendingRequest] = useState<boolean>(false);
  const [hasRejectedRequest, setHasRejectedRequest] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [imageModalOpen, setImageModalOpen] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
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
        } else {
          setHasBusinessInfo(false);
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
    
  }, [hasBusinessInfo, hasPendingRequest, hasRejectedRequest, isUpgradeModalOpen]);

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

  // 등업 신청 모달 관리
  const handleOpenUpgradeModal = () => {
    setIsUpgradeModalOpen(true);
  };

  const handleCloseUpgradeModal = () => {
    setIsUpgradeModalOpen(false);
  };
  
  // 이미지 확대 모달 열기
  // 이미지 모달 열기 함수 - null/undefined 체크 추가
  const openImageModal = (imageUrl: string | undefined) => {
    if (!imageUrl) {
      return;
    }
    setSelectedImage(imageUrl);
    setImageModalOpen(true);
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
          
          alert('이름 변경 중 오류가 발생했습니다: ' + nameError.message);
        }
      } else {
        
      }

      // 2. 비밀번호 업데이트 (입력된 경우에만)
      if (password && change_password) {
        try {
          if (password === change_password) {
            alert('현재 비밀번호와 새 비밀번호가 같습니다.');
          } else {
            // 현재 비밀번호 확인
            const verifyPassword = await supabase.rpc('verify_password', {
              password: password,
              user_id: currentUser?.id,
            });
            
            if (!verifyPassword.data || verifyPassword.error) {
              
              alert('현재 비밀번호가 일치하지 않습니다.');
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
          
          alert('비밀번호 변경 중 오류가 발생했습니다: ' + passwordError.message);
        }
      }
      
      // 3. 사업자 정보 업데이트 (승인 대기 중에도 가능하게 수정)
      if (currentUser && currentUser.business) {
        
        
        try {
          // 데이터 복사하고 비교하기 위한 원본 저장
          const originalBusiness = JSON.stringify(currentUser.business);
          
          // 승인 대기 중인 경우 업데이트 대상 필드 제한 (verified 필드는 유지)
          let businessData = { ...currentUser.business };
          
          if (hasPendingRequest) {
            
            
            // 이미지는 Base64인 경우 처리
            if (businessData && businessData.business_image_url && businessData.business_image_url.startsWith('data:image')) {
              
              // 이미지가 이미 Base64면 그대로 사용
            }
          }
          
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
          
          
          
          // 세션 스토리지에 업데이트된 사용자 정보 저장 (새로고침 시 활용)
          try {
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            
          } catch (e) {
            
          }
          
          // 변경 감지
          if (currentUser && currentUser.business && originalBusiness !== JSON.stringify(currentUser.business)) {
            businessInfoUpdated = true;
            
          }
        } catch (businessError: any) {
          
          alert('사업자 정보 업데이트 중 오류가 발생했습니다: ' + businessError.message);
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
      
      
      // 항상 alert로 표시 (디버깅용)
      alert(displayMessage);
      
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
      alert(errorMessage);
      
      // 오류 메시지도 5초 후에 자동으로 지우기
      messageTimer = setTimeout(() => {
        setMessage('');
      }, 5000);
    }
  }

  return (
    <CommonTemplate
      title="내정보 관리"
      description="기본 관리 > 내정보 관리"
      showPageMenu={false}
    >
      <div className="flex flex-col">
        {/* 전체 알림 메시지 - 상단에 더 눈에 띄게 배치 */}
        {message && (
          <div id="alertMessage" className="alert bg-success/20 border border-success/30 text-success shadow-lg mb-4 p-4 rounded-md animate-fadeIn transition-all duration-300">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-success fill-success/10 shrink-0 h-6 w-6 mr-3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="font-medium text-success-active">{message}</span>
            </div>
          </div>
        )}
        
        {/* 고정 메시지 테스트 (문제 해결 후 제거) */}
        <div className="alert bg-info/20 border border-info/30 text-info shadow-lg mb-4 p-4 rounded-md">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-info fill-info/10 shrink-0 h-6 w-6 mr-3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="font-medium">프로필 수정 후에는 변경사항이 즉시 표시됩니다.</span>
          </div>
        </div>
        
        <div className="card rounded-lg shadow-sm p-5 space-y-4">
          {/* 프로필 헤더 */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-2xl text-gray-600">
                {currentUser?.full_name?.charAt(0) || '?'}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-medium">
                {currentUser?.full_name || '사용자'}
              </h3>
              <span className={`badge ${roleClass} px-2 py-1 rounded text-xs`}
                style={roleThemeColors ? {
                  backgroundColor: `${roleThemeColors.baseHex}15`, /* 10% 투명도 */
                  color: roleThemeColors.baseHex
                } : undefined}>
                {roleText || '사용자'}
              </span>
            </div>
          </div>

          {/* 사용자 정보 테이블 */}
          <div className="card-table scrollable-x-auto pb-3">
            <table className="table align-middle text-sm text-gray-500">
              <tbody>
                <tr>
                  <td className="py-2 text-gray-600 font-normal">이름</td>
                  <td className="py-2 text-gray-800 font-normal">
                    <input
                      type="text"
                      className="input form-control"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="이름을 입력하세요"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-600 font-normal">상태</td>
                  <td className="py-3 text-gray-800 font-normal">
                    <span className={`badge badge-sm badge-outline ${statusClass}`}>{statusText || '권한 없음'}</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-600 font-normal">이메일</td>
                  <td className="py-3 text-gray-700 text-sm font-normal">{currentUser?.email || '이메일 없음'}</td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-600 font-normal">비밀번호</td>
                  <td className="py-3 text-gray-700 text-sm font-normal">
                    <input
                      type="password"
                      className="input form-control"
                      placeholder="비밀번호"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-gray-600 font-normal">새 비밀번호</td>
                  <td className="py-3 text-gray-700 text-sm font-normal">
                    <input
                      type="password"
                      className="input form-control"
                      placeholder="새 비밀번호"
                      value={change_password}
                      onChange={(e) => setChangePassword(e.target.value)}
                    />
                  </td>
                </tr>
              </tbody>
            </table>

          </div>
          
          {/* 알림 메시지는 상단으로 이동됨 */}

          {/* 사업자 정보 섹션 */}
          <div className="mt-8 border-t pt-6">
            <h4 className="text-lg font-semibold mb-4">사업자 정보</h4>
            
            {hasBusinessInfo && (
              <div className="card-table scrollable-x-auto pb-3">
                <table className="table align-middle text-sm text-gray-500">
                  <tbody>
                    <tr>
                      <td className="py-2 text-gray-600 font-normal">사업자 등록번호</td>
                      <td className="py-2 text-gray-800 font-normal">
                        <div className="border border-gray-200 rounded p-2 bg-gray-50">
                          {currentUser && (currentUser.business || currentUser["business"]) ? 
                            (currentUser.business || currentUser["business"]).business_number || '-' : 
                            '-'}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 text-gray-600 font-normal">상호명</td>
                      <td className="py-3 text-gray-800 font-normal">
                        <div className="border border-gray-200 rounded p-2 bg-gray-50">
                          {currentUser && (currentUser.business || currentUser["business"]) ? 
                            (currentUser.business || currentUser["business"]).business_name || '-' : 
                            '-'}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 text-gray-600 font-normal">대표자명</td>
                      <td className="py-3 text-gray-700 text-sm font-normal">
                        <div className="border border-gray-200 rounded p-2 bg-gray-50">
                          {currentUser && (currentUser.business || currentUser["business"]) ? 
                            (currentUser.business || currentUser["business"]).representative_name || '-' : 
                            '-'}
                        </div>
                      </td>
                    </tr>
                    {/* 사업자용 이메일 추가 */}
                    <tr>
                      <td className="py-3 text-gray-600 font-normal">사업자용 이메일</td>
                      <td className="py-3 text-gray-700 text-sm font-normal">
                        <div className="border border-gray-200 rounded p-2 bg-gray-50">
                          {currentUser && (currentUser.business || currentUser["business"]) ? 
                            ((currentUser.business || currentUser["business"]) as any).business_email || '-' : 
                            '-'}
                        </div>
                      </td>
                    </tr>
                    {/* 사업자등록증 이미지 표시 - 항상 표시 */}
                    <tr>
                      <td className="py-3 text-gray-600 font-normal">사업자등록증</td>
                      <td className="py-3 text-gray-700 text-sm font-normal">
                        {(() => {
                          // currentUser와 business 객체가 존재하는지 확인
                          if (!currentUser || !(currentUser.business || currentUser["business"])) {
                            return (
                              <div className="border border-gray-200 rounded p-2 bg-gray-50 text-center py-4">
                                <span className="text-gray-500">등록된 이미지가 없습니다</span>
                              </div>
                            );
                          }
                          
                          // business 객체를 안전하게 처리
                          const business = (currentUser.business || currentUser["business"]) as any;
                          const imageUrl = business.business_image_url;
                          
                          if (!imageUrl) {
                            return (
                              <div className="border border-gray-200 rounded p-2 bg-gray-50 text-center py-4">
                                <span className="text-gray-500">등록된 이미지가 없습니다</span>
                              </div>
                            );
                          }
                          
                          return (
                            <div className="border rounded p-3 bg-white">
                              <div className="flex flex-col items-center">
                                <div className="relative cursor-pointer" onClick={() => openImageModal(imageUrl)}>
                                  <img
                                    src={imageUrl}
                                    alt="사업자등록증"
                                    className="max-h-48 object-contain mb-2 hover:opacity-90 transition-opacity"
                                    onError={(e) => {
                                      
                                      
                                      // URL 상세 정보 로깅
                                      try {
                                        if (imageUrl && !imageUrl.startsWith('data:')) {
                                          const url = new URL(imageUrl);
                                          
                                          
                                          
                                          
                                          
                                        }
                                      } catch (urlError) {
                                        
                                      }
                                      
                                      // 대체 이미지 표시
                                      (e.target as HTMLImageElement).src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFQkVCRUIiLz48dGV4dCB4PSI0MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2NjY2NjYiPuyVhOuvuOyekOujjOymnSDsnbTrr7jsp4A8L3RleHQ+PC9zdmc+";
                                      
                                      // URL이 Supabase Storage URL이고 만료되었을 가능성이 있는 경우
                                      if (business.business_image_storage_type === 'supabase_storage') {
                                        
                                      }
                                    }}
                                    onLoad={() => {
                                      
                                    }}
                                  />
                                  <div className="absolute top-0 right-0 bg-primary/80 text-white rounded-full w-5 h-5 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                  </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 text-center">클릭하면 크게 볼 수 있습니다</p>
                                <div className="mt-1 text-xs text-gray-500">
                                  {business.business_image_storage_type === 'base64' ? 
                                    '(Base64 저장)' : 
                                    '(Storage 저장)'}
                                </div>
                              </div>
                            </div>
                          );
                        })() || (
                          <div className="border border-gray-200 rounded p-2 bg-gray-50 text-center py-4">
                            <span className="text-gray-500">등록된 이미지가 없습니다</span>
                          </div>
                        )}
                      </td>
                    </tr>
                    
                    {/* 은행 정보 표시 */}
                    <tr>
                      <td className="py-3 text-gray-600 font-normal">입금 계좌 정보</td>
                      <td className="py-3 text-gray-700 text-sm font-normal">
                        {currentUser && (currentUser.business || currentUser["business"]) && ((currentUser.business || currentUser["business"]) as any).bank_account ? (
                          <div className="border border-gray-200 rounded p-3 bg-gray-50">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="text-sm">
                                <span className="font-medium text-gray-600">은행명:</span> {((currentUser.business || currentUser["business"]) as any).bank_account.bank_name || '-'}
                              </div>
                              <div className="text-sm">
                                <span className="font-medium text-gray-600">예금주:</span> {((currentUser.business || currentUser["business"]) as any).bank_account.account_holder || '-'}
                              </div>
                              <div className="text-sm col-span-2">
                                <span className="font-medium text-gray-600">계좌번호:</span> {((currentUser.business || currentUser["business"]) as any).bank_account.account_number || '-'}
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-info bg-info/10 p-2 rounded">
                              입금 계좌 정보는 최초 등록 후 수정이 불가능합니다.
                            </div>
                          </div>
                        ) : (
                          <div className="border border-gray-200 rounded p-2 bg-gray-50 text-center py-4">
                            <span className="text-gray-500">등록된 계좌 정보가 없습니다</span>
                          </div>
                        )}
                      </td>
                    </tr>
                    
                    <tr>
                      <td className="py-3 text-gray-600 font-normal">인증 상태</td>
                      <td className="py-3 text-gray-700 text-sm font-normal">
                        {loading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-gray-500">확인 중...</span>
                          </div>
                        ) : hasPendingRequest ? (
                          <div className="flex items-center">
                            <span className="badge badge-sm badge-warning mr-2">승인 대기중</span>
                            <span className="text-xs text-gray-500">관리자 승인 대기 중입니다</span>
                          </div>
                        ) : (currentUser && (currentUser.business || currentUser["business"]) && (currentUser.business || currentUser["business"]).verified) ? (
                          <div className="flex items-center">
                            <span className="badge badge-sm badge-success mr-2">인증됨</span>
                            <span className="text-xs text-gray-500">사업자 인증이 완료되었습니다</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <span className="badge badge-sm badge-error mr-2">미인증</span>
                            <span className="text-xs text-gray-500">등업 신청이 필요합니다</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="ml-3 text-gray-500">정보를 불러오는 중입니다...</p>
              </div>
            ) : (
              <>
                {hasPendingRequest && (
                  <div className="bg-warning/10 p-4 rounded-lg mb-4 border border-warning/20">
                    <h5 className="text-warning font-semibold mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      등업 신청이 대기 중입니다
                    </h5>
                    <p className="text-gray-600">
                      관리자 승인 후 총판 권한으로 변경됩니다. 승인까지 일정 시간이 소요될 수 있습니다.
                    </p>
                  </div>
                )}
                
                {!hasPendingRequest && !hasBusinessInfo && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-gray-600 mb-2">
                          사업자 등록 정보가 없습니다. 등업 신청을 위해 사업자 정보를 등록해주세요.
                        </p>
                        <p className="text-sm text-gray-500">
                          아래 '사업자 등록 및 등업 신청' 버튼을 클릭하여 등록을 진행해주세요.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {!hasPendingRequest && hasRejectedRequest && (
                  <div className="bg-danger/10 p-4 rounded-lg mb-4 border border-danger/20">
                    <h5 className="text-danger font-semibold mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      이전 등업 신청이 거부되었습니다
                    </h5>
                    <div className="mb-3">
                      <p className="text-gray-700 font-medium">거부 사유:</p>
                      <p className="text-gray-600 mt-1 p-3 bg-white rounded border border-gray-200">
                        {rejectionReason || '관리자가 등업 신청을 거부했습니다.'}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500">
                      아래 정보를 수정하여 다시 신청해 주세요.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 하단 버튼 */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              className="btn btn-primary"
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
              ) : '저장하기'}
            </button>
            
            {loading ? (
              <button
                className="btn btn-secondary"
                disabled
              >
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  로딩 중...
                </span>
              </button>
            ) : hasPendingRequest ? (
              <button
                className="btn btn-secondary"
                onClick={handleOpenUpgradeModal}
              >
                사업자 정보 수정
              </button>
            ) : (
              <button
                className="btn btn-secondary"
                onClick={handleOpenUpgradeModal}
              >
                {hasBusinessInfo ? '등업 신청' : '사업자 등록 및 등업 신청'}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* 등업 신청 모달 */}
      <BusinessUpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={handleCloseUpgradeModal}
        onSuccess={handleUpgradeSuccess}
        initialData={getPreviousBusinessInfo()}
        isEditMode={hasPendingRequest}
        setCurrentUser={setCurrentUser}
      />
      
      
      {imageModalOpen && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/70"
          onClick={() => setImageModalOpen(false)} // 배경 클릭 시 모달 닫기
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] overflow-auto bg-white rounded-lg p-1"
            onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 이벤트 전파 방지
          >
            {/* 우측 상단 닫기 버튼 */}
            <button
              onClick={() => setImageModalOpen(false)}
              className="absolute top-3 right-3 z-10 bg-red-600 hover:bg-red-700 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg transition-all"
              aria-label="닫기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* 상단 닫기 텍스트 배너 */}
            <div className="bg-gray-800/80 text-white py-2 px-4 text-center mb-2">
              <button 
                onClick={() => setImageModalOpen(false)}
                className="flex items-center justify-center w-full"
              >
                <span>이미지 닫기</span>
                <div className="ml-2 inline-flex">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </button>
            </div>
            <img 
              src={selectedImage} 
              alt="사업자등록증" 
              className="max-h-[85vh] object-contain"
              onError={(e) => {
                
                (e.target as HTMLImageElement).src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSI1MDAiIGZpbGw9IiNFQkVCRUIiLz48dGV4dCB4PSIxNTAiIHk9IjI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmaWxsPSIjNjY2NjY2Ij7snbTrr7jsp4Drk6TsnZgg67Cc7IOd7J2EIOyeheugpe2VqeyzkuycvOuhnDwvdGV4dD48L3N2Zz4=";
              }}
            />
            <div className="flex justify-center items-center gap-4 mt-3 pb-2">
              <button 
                onClick={() => setImageModalOpen(false)}
                className="btn btn-danger flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>닫기</span>
              </button>
              
              <a 
                href={selectedImage} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-outline-primary flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>새 탭에서 열기</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </CommonTemplate>
  );
};

export { ProfilePage };