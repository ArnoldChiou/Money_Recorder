import React, { useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User } from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);

  useEffect(() => {
    // 嘗試從 localStorage 取得自動登入 email
    const saved = localStorage.getItem('autoLoginEmail');
    if (saved) {
      setEmail(saved);
      setAutoLogin(true);
    }
  }, []);

  useEffect(() => {
    // 如果 firebase 已登入，直接觸發 onAuthSuccess
    if (auth.currentUser) {
      onAuthSuccess(auth.currentUser);
      onClose();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let userCredential;
      if (isRegister) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
      // 自動登入功能：只記錄 email，不存密碼
      if (autoLogin) {
        localStorage.setItem('autoLoginEmail', email);
      } else {
        localStorage.removeItem('autoLoginEmail');
      }
      onAuthSuccess(userCredential.user);
      onClose();
    } catch (err: any) {
      setError(err.message || '發生錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs">
        <h2 className="text-xl font-bold mb-4 text-center">{isRegister ? '註冊帳號' : '登入'}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="border rounded px-3 py-2"
            required
          />
          <input
            type="password"
            placeholder="密碼"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border rounded px-3 py-2"
            required
          />
          {/* 自動登入選項 */}
          {!isRegister && (
            <label className="flex items-center text-sm select-none">
              <input
                type="checkbox"
                checked={autoLogin}
                onChange={e => setAutoLogin(e.target.checked)}
                className="mr-2"
              />
              自動登入
            </label>
          )}
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded mt-2"
            disabled={loading}
          >
            {loading ? '處理中...' : isRegister ? '註冊' : '登入'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button
            className="text-indigo-600 hover:underline text-sm"
            onClick={() => setIsRegister(!isRegister)}
            disabled={loading}
          >
            {isRegister ? '已有帳號？登入' : '沒有帳號？註冊'}
          </button>
        </div>
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
          onClick={onClose}
          aria-label="關閉"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default AuthModal;
