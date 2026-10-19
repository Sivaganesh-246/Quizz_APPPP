import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, TEACHER_LOGIN_EMAIL } from '../lib/supabase';

const TEACHER_DEMO_USERNAME = 'teacher';
const TEACHER_DEMO_PASSWORD = 'teacher123';
const LOCAL_TEACHER_SESSION_KEY = 'quizmaster-teacher-session';

const getStoredTeacherSession = () => {
  if (typeof window === 'undefined') return null;

  try {
    const stored = window.localStorage.getItem(LOCAL_TEACHER_SESSION_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    if (parsed?.user?.email === TEACHER_LOGIN_EMAIL && parsed?.browserTeacher) {
      return parsed;
    }
  } catch (error) {
    console.warn('Could not read local teacher session.', error);
  }

  return null;
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(supabase));
  const [error, setError] = useState('');

  useEffect(() => {
    const storedTeacherSession = getStoredTeacherSession();
    if (storedTeacherSession) {
      setSession(storedTeacherSession);
      setIsLoading(false);
      return undefined;
    }

    if (!supabase) {
      setIsLoading(false);
      return undefined;
    }

    let isMounted = true;

    supabase.auth.getSession()
      .then(({ data, error: sessionError }) => {
        if (!isMounted) return;
        if (sessionError) setError(sessionError.message);
        setSession(data.session);
        setIsLoading(false);
      })
      .catch((sessionError) => {
        if (isMounted) {
          setError(sessionError.message);
          setIsLoading(false);
        }
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (isMounted) setSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({
    session,
    isLoading,
    error,
    isTeacher: session?.__browserTeacher === true || session?.user?.email === TEACHER_LOGIN_EMAIL,
    async signInTeacher(username, password) {
      const trimmedUsername = username.trim().toLowerCase();
      const trimmedPassword = password.trim();

      if (trimmedUsername === TEACHER_DEMO_USERNAME && trimmedPassword === TEACHER_DEMO_PASSWORD) {
        const browserSession = {
          user: { email: TEACHER_LOGIN_EMAIL },
          __browserTeacher: true
        };

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(LOCAL_TEACHER_SESSION_KEY, JSON.stringify(browserSession));
        }

        setSession(browserSession);
        return;
      }

      if (!supabase) {
        throw new Error('Teacher username or password is incorrect.');
      }

      if (trimmedUsername !== TEACHER_DEMO_USERNAME) {
        throw new Error('Teacher username or password is incorrect.');
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: TEACHER_LOGIN_EMAIL,
        password
      });
      if (signInError) throw signInError;
      if (data.user?.email !== TEACHER_LOGIN_EMAIL) {
        await supabase.auth.signOut();
        throw new Error('This account is not authorized as a teacher.');
      }
    },
    async signOut() {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(LOCAL_TEACHER_SESSION_KEY);
      }

      if (!supabase) {
        setSession(null);
        return;
      }

      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      setSession(null);
    }
  }), [error, isLoading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
};
