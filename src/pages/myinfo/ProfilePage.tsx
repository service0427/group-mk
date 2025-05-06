import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/auth';
import { KeenIcon } from '@/components';
import { supabase } from '@/supabase';
import { CommonTemplate } from '@/components/pageTemplate';
import { BusinessUpgradeModal } from '@/components/business';

const ProfilePage = () => {
  const { currentUser } = useAuthContext();

  const [password, setPassword] = useState<string>('');
  const [change_password, setChangePassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [hasBusinessInfo, setHasBusinessInfo] = useState<boolean>(false);
  const [hasPendingRequest, setHasPendingRequest] = useState<boolean>(false);
  const [hasRejectedRequest, setHasRejectedRequest] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  
  // 사업자 정보와 등업 신청 현황 체크
  useEffect(() => {
    const checkBusinessStatus = async () => {
      try {
        // 사용자의 business 정보 체크
        if (currentUser?.business) {
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

  const handleUpgradeSuccess = () => {
    // 등업 신청 성공 후 상태 업데이트
    setHasBusinessInfo(true);
    setHasPendingRequest(true);
    setHasRejectedRequest(false);
    setRejectionReason('');
  };
  
  // 이전 사업자 정보 가져오기
  const getPreviousBusinessInfo = () => {
    if (currentUser?.business) {
      return {
        business_number: currentUser.business.business_number,
        business_name: currentUser.business.business_name,
        representative_name: currentUser.business.representative_name
      };
    }
    return undefined;
  };

  const handlePasswordChange = async () => {
    // 비밀번호 변경 로직을 여기에 추가합니다.
    if (!password && !change_password) {
      alert('비밀번호를 입력하세요.');
      return;
    }

    if (!password) {
      alert('현재 비밀번호를 입력하세요.');
      return;
    } else if (!change_password) {
      alert('새 비밀번호를 입력하세요.');
      return;
    }

    if (password === change_password) {
      alert('현재 비밀번호와 새 비밀번호가 같습니다.');
      return;
    }

    try {
      // 현재 비밀번호 확인
      const verifyPassword = await supabase.rpc('verify_password', {
        password: password,
        user_id: currentUser?.id,
      });

      if (!verifyPassword.data || verifyPassword.error) {
        console.error('비밀번호 확인 오류:', verifyPassword.error);
        alert('현재 비밀번호가 일치하지 않습니다.');
        return;
      }

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

      // 3. 마지막으로 Supabase Auth 업데이트
      console.log('비밀번호 변경 시도');
      const { error: updateAuthError } = await supabase.auth.updateUser({
        password: change_password,
      });

      if (updateAuthError) {
        console.error('Auth 비밀번호 변경 실패:', updateAuthError);
        throw new Error(updateAuthError.message);
      }

      console.log('비밀번호 변경 완료');
      setMessage('비밀번호가 변경되었습니다.');

      // 입력 필드 초기화
      setPassword('');
      setChangePassword('');

      // 페이지 새로고침 방지를 위해 딜레이 추가 (선택사항)
      // setTimeout(() => {
      //   window.location.reload();
      // }, 2000);

    } catch (error: any) {
      console.error('비밀번호 변경 중 오류가 발생했습니다.', error);
      setMessage('비밀번호 변경에 실패했습니다: ' + error.message);
    }
  }

  return (
    <CommonTemplate
      title="내정보 관리"
      description="기본 관리 > 내정보 관리"
      showPageMenu={false}
    >
      <div className="flex flex-col">
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
                  <td className="py-2 text-gray-800 font-normaltext-sm">{currentUser?.full_name || '이름 없음'}</td>
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
                    {message && (
                      <span role="alert" className="text-success text-xs mt-1">
                        {message}
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

          </div>

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
                        {currentUser?.business?.business_number || '-'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 text-gray-600 font-normal">상호명</td>
                      <td className="py-3 text-gray-800 font-normal">
                        {currentUser?.business?.business_name || '-'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 text-gray-600 font-normal">대표자명</td>
                      <td className="py-3 text-gray-700 text-sm font-normal">
                        {currentUser?.business?.representative_name || '-'}
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
              onClick={handlePasswordChange}
            >
              비밀번호 수정
            </button>
            
            {!hasPendingRequest && (
              <button
                className="btn btn-secondary"
                onClick={handleOpenUpgradeModal}
                disabled={hasPendingRequest}
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
      />
    </CommonTemplate>
  );
};

export { ProfilePage };