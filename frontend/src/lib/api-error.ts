import axios from 'axios';

type ErrorResponse = {
  message?: string;
};

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<ErrorResponse>(error)) {
    return error.response?.data?.message ?? fallback;
  }

  return fallback;
}
