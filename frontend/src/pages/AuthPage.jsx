import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AuthPage.css';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await api.post(endpoint.replace('/api', ''), formData);

      if (isLogin) {
      
        login(res.data);
        if (res.data.role === 'admin') navigate('/admin');
        else if (res.data.role === 'staff') navigate('/staff');
        else navigate('/');
      } else {
        setError('Registration successful. Please sign in.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="auth-title">
      <h2 id="auth-title">{isLogin ? 'Welcome back' : 'Create your account'}</h2>
      {error && <p className="auth-message" role="alert">{error}</p>}
      
      <form onSubmit={handleSubmit} className="auth-form">
        {!isLogin && (
          <div className="form-field">
            <label htmlFor="name">Name</label>
            <input 
              type="text" 
              name="name" 
              required 
              onChange={handleChange} 
              id="name"
            />
          </div>
        )}

        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input 
            type="email" 
            name="email" 
            required 
            onChange={handleChange} 
            id="email"
          />
        </div>

        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input 
            type="password" 
            name="password" 
            required 
            onChange={handleChange} 
            id="password"
          />
        </div>

        <button type="submit" className="auth-submit">
          {isLogin ? 'Login' : 'Register'}
        </button>
      </form>

      <p className="auth-switch">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button type="button" className="auth-switch-button"
          onClick={() => { setIsLogin(!isLogin); setError(''); }} 
        >
          {isLogin ? 'Register here' : 'Login here'}
        </button>
      </p>
      </section>
    </main>
  );
}