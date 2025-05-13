import { NextResponse } from 'next/server';

type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export const successResponse = <T>(data: T, message?: string): NextResponse<ApiResponse<T>> => {
  return NextResponse.json({
    success: true,
    data,
    message,
  });
};

export const errorResponse = (error: string, status = 400): NextResponse<ApiResponse> => {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
};

// Common error status codes
export const UNAUTHORIZED = 401;
export const FORBIDDEN = 403;
export const NOT_FOUND = 404;
export const SERVER_ERROR = 500; 