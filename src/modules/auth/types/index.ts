export type JwtPayload = {
  sub: string;
  roles: string[];
  email?: string;
  sectionId?: string | null;
};

export type SessionUser = {
  userId: string;
  phoneNumber: string;
  email: string;
  roles: Array<string>;
};
