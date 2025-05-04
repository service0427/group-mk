import React, { useState } from 'react';
import { useAuthContext } from '@/auth';
import { KeenIcon } from '@/components';
import { supabase } from '@/supabase';
import { CommonTemplate } from '@/components/pageTemplate';

const ProfilePage = () => {
  const { currentUser } = useAuthContext();

  const [password, setPassword] = useState<string>('');
  const [change_password, setChangePassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');

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

          {/* 하단 버튼 */}
          <div className="flex justify-end mt-6">
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
              onClick={handlePasswordChange}
            >
              비밀번호 수정
            </button>
          </div>
        </div>
      </div>
    </CommonTemplate>
  );
};

export { ProfilePage };