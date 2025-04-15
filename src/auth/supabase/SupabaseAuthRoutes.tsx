import React from 'react'
import { Route, Routes, Navigate } from 'react-router-dom'
import {
  SupabaseLogin,
  SupabaseSignup,
  SupabaseForgotPassword,
  SupabaseResetPassword,
} from './components/supabase'
import { SupabaseAuthProvider } from './SupabaseAuthProvider'

const SupabaseAuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className='d-flex flex-column flex-root'>
      <div className='d-flex flex-column flex-column-fluid bgi-position-y-bottom position-x-center bgi-no-repeat bgi-size-contain bgi-attachment-fixed'>
        <div className='d-flex flex-center flex-column flex-column-fluid p-10 pb-lg-20'>
          <div className='w-lg-500px bg-body rounded shadow-sm p-10 p-lg-15 mx-auto'>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

const SupabaseAuthRoutes = () => {
  return (
    <SupabaseAuthProvider>
      <Routes>
        <Route path='/' element={<Navigate to='/auth/supabase/login' />} />
        <Route
          path='/login'
          element={
            <SupabaseAuthLayout>
              <SupabaseLogin />
            </SupabaseAuthLayout>
          }
        />
        <Route
          path='/signup'
          element={
            <SupabaseAuthLayout>
              <SupabaseSignup />
            </SupabaseAuthLayout>
          }
        />
        <Route
          path='/forgot-password'
          element={
            <SupabaseAuthLayout>
              <SupabaseForgotPassword />
            </SupabaseAuthLayout>
          }
        />
        <Route
          path='/reset-password'
          element={
            <SupabaseAuthLayout>
              <SupabaseResetPassword />
            </SupabaseAuthLayout>
          }
        />
        <Route path='*' element={<Navigate to='/auth/supabase/login' />} />
      </Routes>
    </SupabaseAuthProvider>
  )
}

export default SupabaseAuthRoutes
