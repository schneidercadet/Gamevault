import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function checkPasswordStrength(password: string): { score: number; message: string } {
  if (!password) {
    return { score: 0, message: 'Password is required' };
  }

  let score = 0;
  const checks = {
    length: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  // Add to score based on criteria
  if (checks.length) score++;
  if (checks.hasUpperCase && checks.hasLowerCase) score++;
  if (checks.hasNumbers) score++;
  if (checks.hasSpecialChar) score++;

  // Return score and appropriate message
  if (score <= 1) {
    return { score, message: 'Weak' };
  } else if (score === 2) {
    return { score, message: 'Moderate' };
  } else if (score === 3) {
    return { score, message: 'Strong' };
  } else {
    return { score, message: 'Very Strong' };
  }
}
