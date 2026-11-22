import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './AcceptInvitePage.css';

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ name: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!token) return setError('This invitation link is missing its security token.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    setSubmitting(true);
    try {
      const response = await api.post('/invites/accept', { token, name: form.name, password: form.password });
      login(response.data);
      navigate(response.data.role === 'admin' ? '/admin' : '/staff', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.response?.data?.message || 'This invitation could not be accepted.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="accept-invite-page">
      <section className="accept-invite-panel" aria-labelledby="accept-invite-title">
        <p className="eyebrow">Secure onboarding</p>
        <h1 id="accept-invite-title">Join the operations team</h1>
        <p className="accept-invite-description">Create your account to activate the role assigned to this invitation.</p>
        {error && <p className="accept-invite-error" role="alert">{error}</p>}
        <form className="accept-invite-form" onSubmit={submit}>
          <label htmlFor="invite-name">Full name</label>
          <input id="invite-name" type="text" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <label htmlFor="invite-password">Password</label>
          <input id="invite-password" type="password" minLength="8" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          <label htmlFor="invite-confirm-password">Confirm password</label>
          <input id="invite-confirm-password" type="password" minLength="8" required value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} />
          <button className="accept-invite-button" type="submit" disabled={submitting}>{submitting ? 'Activating account...' : 'Accept invitation'}</button>
        </form>
      </section>
    </main>
  );
}