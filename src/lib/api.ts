const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const getHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleErrorResponse = async (res: Response) => {
  const errorBody = await res.json().catch(() => ({ error: 'An error occurred' }));
  const customError = new Error(errorBody.error || `HTTP error! status: ${res.status}`) as any;
  customError.status = res.status;
  Object.assign(customError, errorBody);
  return customError;
};

export const api = {
  async get(path: string) {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw await handleErrorResponse(res);
    }
    return res.json();
  },

  async post(path: string, data: any) {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw await handleErrorResponse(res);
    }
    return res.json();
  },

  async put(path: string, data: any) {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw await handleErrorResponse(res);
    }
    return res.json();
  },

  async delete(path: string) {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw await handleErrorResponse(res);
    }
    return res.json();
  },
};
