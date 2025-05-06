import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/auth';
import { KeenIcon } from '@/components';
import { supabase } from '@/supabase';
import { CommonTemplate } from '@/components/pageTemplate';
import { BusinessUpgradeModal } from '@/components/business';

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
  
  // 사업자 정보와 등업 신청 현황 체크
  // 초기 상태 설정 및 디버깅을 위한 useEffect
  useEffect(() => {
    console.log('[초기화] 프로필 페이지 컴포넌트 마운트됨');
    
    const checkBusinessStatus = async () => {
      try {
        // 사용자 정보 설정
        if (currentUser?.full_name) {
          console.log('[초기화] 사용자 이름 설정:', currentUser.full_name);
          setFullName(currentUser.full_name);
        }
        
        // 사용자의 business 정보 체크
        if (currentUser?.business) {
          console.log('[초기화] 사업자 정보 있음');
          setHasBusinessInfo(true);
        }
        
        // 대기 중인 등업 신청이 있는지 체크
        const { data: pendingData, error: pendingError } = await supabase
          .from('levelup_apply')
          .select('*')
          .eq('user_id', currentUser?.id)
          .eq('status', 'pending')
          .limit(1);
          
        if (pendingError) throw pendingError;
        setHasPendingRequest(pendingData && pendingData.length > 0);
        
        // 거부된 등업 신청이 있는지 체크
        const { data: rejectedData, error: rejectedError } = await supabase
          .from('levelup_apply')
          .select('*')
          .eq('user_id', currentUser?.id)
          .eq('status', 'rejected')
          .order('updated_at', { ascending: false })
          .limit(1);
          
        if (rejectedError) throw rejectedError;
        
        if (rejectedData && rejectedData.length > 0) {
          setHasRejectedRequest(true);
          setRejectionReason(rejectedData[0].rejection_reason || '');
        } else {
          setHasRejectedRequest(false);
          setRejectionReason('');
        }
      } catch (err) {
        console.error('사업자 정보 조회 에러:', err);
      }
    };
    
    if (currentUser?.id) {
      checkBusinessStatus();
    }
  }, [currentUser]);

  const roleClass = currentUser?.role === 'operator' ? 'badge-primary' :
    currentUser?.role === 'developer' ? 'badge-warning' :
      currentUser?.role === 'distributor' ? 'badge-success' :
        currentUser?.role === 'agency' ? 'badge-info' :
          currentUser?.role === 'advertiser' ? 'badge-secodary' : '';

  const roleText = currentUser?.role === 'operator' ? '관리자' :
    currentUser?.role === 'developer' ? '개발자' :
      currentUser?.role === 'distributor' ? '총판' :
        currentUser?.role === 'agency' ? '대행사' :
          currentUser?.role === 'advertiser' ? '광고주' : '';
  console.log(currentUser)

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
  const openImageModal = (imageUrl: string) => {
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
      console.log('등업 신청 성공 후 데이터 새로고침');
      const { data: refreshedUser, error: refreshError } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser?.id)
        .single();
        
      if (refreshError) {
        console.error('사용자 정보 새로고침 오류:', refreshError);
      } else if (refreshedUser && setCurrentUser) {
        console.log('성공 후 사용자 정보 업데이트');
        setCurrentUser(refreshedUser);
      }
    } catch (err) {
      console.error('사용자 정보 갱신 실패:', err);
    }
  };
  
  // 이전 사업자 정보 가져오기 (이미지와 이메일 정보 포함)
  const getPreviousBusinessInfo = () => {
    if (currentUser?.business) {
      return {
        business_number: currentUser.business.business_number,
        business_name: currentUser.business.business_name,
        representative_name: currentUser.business.representative_name,
        business_email: currentUser.business.business_email || '',
        business_image_url: currentUser.business.business_image_url || ''
      };
    }
    return undefined;
  };

  // 이 함수는 더 이상 사용되지 않지만 참조용으로 남겨둡니다

  const handleSaveProfile = async () => {
    // 메시지 상태 변수
    let updatedSuccessfully = false;
    let successMessage = '';
    let messageTimer: NodeJS.Timeout;
    
    try {
      console.log('저장하기 버튼 클릭됨');
      console.log('초기 상태 현재 이름:', currentUser?.full_name, '입력 이름:', fullName);
      
      // 변경 감지 변수
      let nameUpdated = false;
      let passwordUpdated = false;
      let businessInfoUpdated = false;
      
      // 1. 이름 업데이트 (값이 있고 변경되었을 때만)
      if (fullName && fullName !== currentUser?.full_name) {
        console.log('이름 변경 감지:', currentUser?.full_name, '->', fullName);
        
        try {
          // Supabase Auth 메타데이터 업데이트
          const { error: updateAuthError } = await supabase.auth.updateUser({
            data: { full_name: fullName }
          });
  
          if (updateAuthError) {
            console.error('Auth 사용자 이름 변경 실패:', updateAuthError);
            throw new Error(updateAuthError.message);
          }
          
          console.log('Auth 사용자 이름 변경 성공');
  
          // users 테이블 업데이트
          const { error: updateDBError } = await supabase
            .from('users')
            .update({ full_name: fullName })
            .eq('id', currentUser?.id);
  
          if (updateDBError) {
            console.error('DB 이름 업데이트 오류:', updateDBError);
            throw new Error(updateDBError.message);
          }
          
          console.log('DB 사용자 이름 업데이트 성공');
          
          // 현재 사용자 상태 업데이트 
          if (currentUser) {
            const updatedUser = {
              ...currentUser,
              full_name: fullName
            };
            
            // 상태 업데이트
            setCurrentUser(updatedUser);
            console.log('로컬 상태 업데이트됨');
            
            // 세션 스토리지에 업데이트된 사용자 정보 저장 (새로고침 시 활용)
            try {
              sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
              console.log('세션 스토리지 업데이트됨');
            } catch (e) {
              console.error('캐시 저장 오류:', e);
            }
            
            // 새로운 사용자 정보로 세션 갱신
            try {
              await supabase.auth.refreshSession();
              console.log('이름 변경 후 세션 갱신됨');
            } catch (refreshError) {
              console.error('세션 갱신 실패:', refreshError);
            }
          }
          
          // 이름이 변경되었다고 표시
          nameUpdated = true;
          console.log('이름 변경 작업 완료, nameUpdated=', nameUpdated);
          
        } catch (nameError: any) {
          console.error('이름 변경 중 오류 발생:', nameError);
          alert('이름 변경 중 오류가 발생했습니다: ' + nameError.message);
        }
      } else {
        console.log('이름 변경 없음 -', '현재:', currentUser?.full_name, '입력:', fullName);
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
              console.error('비밀번호 확인 오류:', verifyPassword.error);
              alert('현재 비밀번호가 일치하지 않습니다.');
            } else {
              console.log('비밀번호 확인 성공:', verifyPassword.data);
              
              // 1. 먼저 users 테이블에 새 비밀번호의 해시값 저장
              const hashPassword = await supabase.rpc('hash_password', {
                password: change_password // 새 비밀번호 해싱
              });
              
              if (hashPassword.error) {
                console.error('비밀번호 해싱 오류:', hashPassword.error);
                throw new Error(hashPassword.error.message);
              }
              
              // 2. users 테이블 업데이트
              const { error: updateDBError } = await supabase
                .from('users')
                .update({ password_hash: hashPassword.data })
                .eq('id', currentUser?.id);
              
              if (updateDBError) {
                console.error('DB 업데이트 오류:', updateDBError);
                throw new Error(updateDBError.message);
              }
              
              // 3. Supabase Auth 업데이트
              console.log('비밀번호 변경 시도');
              const { error: updateAuthError } = await supabase.auth.updateUser({
                password: change_password,
              });
              
              if (updateAuthError) {
                console.error('Auth 비밀번호 변경 실패:', updateAuthError);
                throw new Error(updateAuthError.message);
              }
              
              console.log('비밀번호 변경 완료');
              
              // 비밀번호가 변경되었다고 표시
              passwordUpdated = true;
              console.log('비밀번호 변경 작업 완료, passwordUpdated=', passwordUpdated);
              
              // 입력 필드 초기화
              setPassword('');
              setChangePassword('');
            }
          }
        } catch (passwordError: any) {
          console.error('비밀번호 변경 중 오류 발생:', passwordError);
          alert('비밀번호 변경 중 오류가 발생했습니다: ' + passwordError.message);
        }
      }
      
      // 3. 사업자 정보 업데이트 (승인 대기 중에도 가능하게 수정)
      if (currentUser?.business) {
        console.log('사업자 정보 업데이트 시도');
        
        try {
          // 데이터 복사하고 비교하기 위한 원본 저장
          const originalBusiness = JSON.stringify(currentUser.business);
          
          // 승인 대기 중인 경우 업데이트 대상 필드 제한 (verified 필드는 유지)
          let businessData = { ...currentUser.business };
          
          if (hasPendingRequest) {
            console.log('승인 대기 중에도 사업자 정보 업데이트 진행');
            
            // 이미지는 Base64인 경우 처리
            if (businessData.business_image_url && businessData.business_image_url.startsWith('data:image')) {
              console.log('Base64 이미지 처리: 이미지 데이터 저장 중');
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
            console.error('사업자 정보 업데이트 오류:', updateBusinessError);
            throw new Error(updateBusinessError.message);
          }
          
          console.log('사업자 정보 업데이트 성공');
          
          // 세션 스토리지에 업데이트된 사용자 정보 저장 (새로고침 시 활용)
          try {
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
            console.log('사업자 정보가 포함된 세션 스토리지 업데이트됨');
          } catch (e) {
            console.error('캐시 저장 오류:', e);
          }
          
          // 변경 감지
          if (originalBusiness !== JSON.stringify(currentUser.business)) {
            businessInfoUpdated = true;
            console.log('사업자 정보 변경됨');
          }
        } catch (businessError: any) {
          console.error('사업자 정보 업데이트 오류:', businessError);
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
      console.log('최종 작업 완료 상태:', updatedSuccessfully);
      console.log('nameUpdated=', nameUpdated, 'passwordUpdated=', passwordUpdated, 'businessInfoUpdated=', businessInfoUpdated);
      
      // 변경사항이 있는지, 없는지에 따라 메시지 표시
      const displayMessage = updatedSuccessfully 
        ? successMessage 
        : '변경된 내용이 없습니다.';
      
      // 최종 메시지 디버깅
      console.log('표시할 메시지:', displayMessage);
      
      // 항상 alert로 표시 (디버깅용)
      alert(displayMessage);
      
      // React state 업데이트
      setMessage(displayMessage);
      
      // 메시지가 화면에 표시되는지 확인하기 위한 디버깅 로그
      console.log('메시지 설정 직후 메시지 상태:', displayMessage);
      
      // 5초 후에 메시지 숨기기
      messageTimer = setTimeout(() => {
        console.log('메시지 타이머 완료, 메시지 초기화');
        setMessage('');
      }, 5000);

    } catch (error: any) {
      // 전체 함수에 대한 에러 처리
      console.error('프로필 업데이트 중 오류가 발생했습니다.', error);
      
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
        
        <div className="bg-card rounded-lg shadow-sm p-5 space-y-4">
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
              <span className={`badge ${roleClass} px-2 py-1 rounded text-xs`}>
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
                          {currentUser?.business?.business_number || '-'}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 text-gray-600 font-normal">상호명</td>
                      <td className="py-3 text-gray-800 font-normal">
                        <div className="border border-gray-200 rounded p-2 bg-gray-50">
                          {currentUser?.business?.business_name || '-'}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 text-gray-600 font-normal">대표자명</td>
                      <td className="py-3 text-gray-700 text-sm font-normal">
                        <div className="border border-gray-200 rounded p-2 bg-gray-50">
                          {currentUser?.business?.representative_name || '-'}
                        </div>
                      </td>
                    </tr>
                    {/* 사업자용 이메일 추가 */}
                    <tr>
                      <td className="py-3 text-gray-600 font-normal">사업자용 이메일</td>
                      <td className="py-3 text-gray-700 text-sm font-normal">
                        <div className="border border-gray-200 rounded p-2 bg-gray-50">
                          {currentUser?.business?.business_email || '-'}
                        </div>
                      </td>
                    </tr>
                    {/* 사업자등록증 이미지 표시 - 항상 표시 */}
                    <tr>
                      <td className="py-3 text-gray-600 font-normal">사업자등록증</td>
                      <td className="py-3 text-gray-700 text-sm font-normal">
                        {currentUser?.business?.business_image_url ? (
                          <div className="border rounded p-3 bg-white">
                            <div className="flex flex-col items-center">
                              <div className="relative cursor-pointer" onClick={() => openImageModal(currentUser.business.business_image_url)}>
                                <img
                                  src={currentUser.business.business_image_url}
                                  alt="사업자등록증"
                                  className="max-h-48 object-contain mb-2 hover:opacity-90 transition-opacity"
                                  onError={(e) => {
                                    console.error('이미지 로드 실패:', currentUser.business.business_image_url);
                                    
                                    // URL 상세 정보 로깅
                                    try {
                                      if (currentUser.business.business_image_url && !currentUser.business.business_image_url.startsWith('data:')) {
                                        const url = new URL(currentUser.business.business_image_url);
                                        console.log('이미지 URL 분석:');
                                        console.log('- 프로토콜:', url.protocol);
                                        console.log('- 호스트:', url.hostname);
                                        console.log('- 경로:', url.pathname);
                                        console.log('- 쿼리 파라미터:', url.search);
                                      }
                                    } catch (urlError) {
                                      console.error('URL 분석 오류:', urlError);
                                    }
                                    
                                    // 대체 이미지 표시
                                    (e.target as HTMLImageElement).src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFQkVCRUIiLz48dGV4dCB4PSI0MCIgeT0iMTAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiM2NjY2NjYiPuyVhOuvuOyekOujjOymnSDsnbTrr7jsp4A8L3RleHQ+PC9zdmc+";
                                    
                                    // URL이 Supabase Storage URL이고 만료되었을 가능성이 있는 경우
                                    if (currentUser.business.business_image_storage_type === 'supabase_storage') {
                                      console.warn('Supabase Storage URL 로드 실패. URL이 만료되었거나 접근 권한이 없을 수 있습니다.');
                                    }
                                  }}
                                  onLoad={() => {
                                    console.log('이미지 로드 성공');
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
                                {currentUser.business.business_image_storage_type === 'base64' ? 
                                  '(Base64 저장)' : 
                                  '(Storage 저장)'}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="border border-gray-200 rounded p-2 bg-gray-50 text-center py-4">
                            <span className="text-gray-500">등록된 이미지가 없습니다</span>
                          </div>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 text-gray-600 font-normal">인증 상태</td>
                      <td className="py-3 text-gray-700 text-sm font-normal">
                        {hasPendingRequest ? (
                          <span className="badge badge-sm badge-warning">승인 대기중</span>
                        ) : currentUser?.business?.verified ? (
                          <span className="badge badge-sm badge-success">인증됨</span>
                        ) : (
                          <span className="badge badge-sm badge-error">미인증</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            
            {!hasPendingRequest && (
              <>
                {!hasBusinessInfo && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <p className="text-gray-600 mb-2">
                      사업자 등록 정보가 없습니다. 등업 신청을 위해 사업자 정보를 등록해주세요.
                    </p>
                  </div>
                )}
                
                {hasRejectedRequest && (
                  <div className="bg-danger/10 p-4 rounded-lg mb-4 border border-danger/20">
                    <h5 className="text-danger font-semibold mb-2">이전 등업 신청이 거부되었습니다</h5>
                    <div className="mb-3">
                      <p className="text-gray-700 font-medium">거부 사유:</p>
                      <p className="text-gray-600 mt-1 p-2 bg-white rounded border border-gray-200">
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
            >
              저장하기
            </button>
            
            {hasPendingRequest ? (
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
                console.error('이미지 모달 로드 실패');
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