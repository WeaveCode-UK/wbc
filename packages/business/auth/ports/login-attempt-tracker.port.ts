export interface LoginAttemptTracker {
  /**
   * Records a failed login attempt for the given identifier (typically an
   * email or `${email}:${ip}` key). Returns the current failure count.
   */
  recordFailure(identifier: string): Promise<number>;

  /**
   * Returns true if the identifier currently exceeds the lockout threshold.
   */
  isLocked(identifier: string): Promise<boolean>;

  /**
   * Clears recorded failures (e.g. after a successful login).
   */
  clearAttempts(identifier: string): Promise<void>;
}
