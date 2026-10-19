import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { isTeacher, error: sessionError, signInTeacher } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await signInTeacher(username, password);
      navigate('/teacher/quizzes', { replace: true });
    } catch (signInError) {
      setError(signInError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container login-page">
      <div className="page-header">
        <h1 className="page-title">Choose how to continue</h1>
        <p className="page-description">Students can take quizzes as guests. Teacher sign-in is required to manage quizzes.</p>
      </div>
      <div className="login-options">
        <section className="builder-section login-card">
          <h2>Student</h2>
          <p>Continue as a guest to take quizzes and view results.</p>
          <Link to="/categories" className="btn btn-primary">Continue as Student</Link>
        </section>
        <section className="builder-section login-card">
          <h2>Teacher</h2>
          {isTeacher ? (
            <>
              <p>You are signed in as the teacher.</p>
              <Link to="/teacher/quizzes" className="btn btn-primary">Manage Quizzes</Link>
            </>
          ) : (
            <form className="teacher-login-form" onSubmit={handleSubmit}>
              <label className="form-label" htmlFor="teacher-username">Username</label>
              <input
                id="teacher-username"
                className="input-text builder-input"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
              <label className="form-label" htmlFor="teacher-password">Password</label>
              <input
                id="teacher-password"
                className="input-text builder-input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              {error && <p className="form-error" role="alert">{error}</p>}
              <p className="form-help">Demo browser-only teacher login credentials: username <strong>teacher</strong> and password <strong>teacher123</strong>.</p>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in…' : 'Teacher Sign In'}
              </button>
            </form>
          )}
        </section>
      </div>
      {sessionError && <p className="form-error" role="alert">{sessionError}</p>}
    </div>
  );
};

export default Login;
