export type CachedData = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export interface User {
  accessId: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
