// Client-safe validation utilities

// Validate UAEU email
export const validateUAEUEmail = (email: string): boolean => {
  const uaeuEmailRegex = /^[^@]+@uaeu\.ac\.ae$/;
  return uaeuEmailRegex.test(email);
};