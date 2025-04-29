import React, { useState } from "react"

interface WithdrawUserFormProps {
    users:User[];
    globalSettings: any;
    onSave: (userSetting: UserSetting) => Promise<boolean>;
}

interface User {
    id: string;
    email: string;
    full_name: string;
}

interface UserSetting {
    user_id: string;
    min_request_amount: number;
    min_request_percentage: number;
}


const WithdrawUserForm: React.FC<WithdrawUserFormProps> = ({users, globalSettings, onSave}) => {
    
    // 기본 폼 데이터 상태 관리
    const [formData, setFormData] = useState<UserSetting>({
        user_id: "",
        min_request_amount: 0,
        min_request_percentage: 0
    });

    // 저장 로딩 상태 관리
    const [isSaving, setIsSaving] = useState(false);

    // 폼 데이터 변경 핸들러
    const handleChange = (e: React.ChangeEvent) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: name === 'user_id' ? value : Number(value)}));
    }

    // 저장 핸들러
    const handleSubmit = () => {

    }


    return(
        <div className="flex items-center space-x-4 p-4">
      {/* 사용자 선택 */}
      <select
        name="user_id"
        value={formData.user_id}
        onChange={handleChange}
        className="h-10 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={isSaving}
      >
        <option value="">사용자 선택</option>
        {users.map(user => (
          <option key={user.id} value={user.id}>
            {user.full_name} ({user.email})
          </option>
        ))}
      </select>

      {/* 최소 출금 금액 */}
      <div className="flex flex-col">
        <label className="text-sm text-gray-600">최소 출금 금액</label>
        <input
          type="number"
          name="minAmount"
          value={formData.min_request_amount}
          onChange={handleChange}
          className="h-10 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSaving}
        />
      </div>

      {/* 출금 수수료율 */}
      <div className="flex flex-col">
        <label className="text-sm text-gray-600">출금 수수료율 (%)</label>
        <input
          type="number"
          name="feeRate"
          value={formData.min_request_percentage}
          onChange={handleChange}
          min="0"
          max="100"
          step="0.1"
          className="h-10 px-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isSaving}
        />
      </div>

      {/* 저장 버튼 */}
      <button
        onClick={handleSubmit}
        className="h-10 px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition disabled:bg-blue-300"
        disabled={isSaving}
      >
        {isSaving ? '저장 중...' : '저장'}
      </button>
    </div>
    )
}

export default WithdrawUserForm;