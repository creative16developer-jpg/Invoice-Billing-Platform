'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';

interface TemplateSettings {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  headerLayout: string;
  showLogo: boolean;
  showSignature: boolean;
  signatureUrl?: string;
  signatureName?: string;
  customTerms?: string;
}

interface User {
  id: string;
  email: string;
  businessName: string;
  ownerName: string;
  phone: string;
  address: string;
  businessType: string;
  productCategory: string;
  licenseNumber: string;
  logoUrl?: string;
  role: string;
  templateSettings: TemplateSettings;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: String) => Promise<void>;
  signup: (userData: any) => Promise<any>;
  verifyOtp: (email: string, otp: string) => Promise<any>;
  resendOtp: (email: string) => Promise<any>;
  logout: () => void;
  updateProfile: (profileData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const userData = await api.get('/auth/me');
        setUser(userData);
      } catch (err) {
        console.error('Failed to load user', err);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const login = async (email: string, password: String) => {
    setLoading(true);
    try {
      const data = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      setUser(data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData: any) => {
    setLoading(true);
    try {
      const data = await api.post('/auth/signup', userData);
      if (data.token) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        router.push('/dashboard');
      }
      return data;
    } catch (err: any) {
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    setLoading(true);
    try {
      const data = await api.post('/auth/verify-otp', { email, otp });
      if (data.token) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
        router.push('/dashboard');
      }
      return data;
    } catch (err: any) {
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async (email: string) => {
    setLoading(true);
    try {
      const data = await api.post('/auth/resend-otp', { email });
      return data;
    } catch (err: any) {
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/login');
  };

  const updateProfile = async (profileData: any) => {
    try {
      const data = await api.put('/auth/profile', profileData);
      setUser(data);
    } catch (err) {
      console.error('Failed to update profile', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, verifyOtp, resendOtp, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
