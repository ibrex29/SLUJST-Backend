import { UserType } from './user.type';

export enum LabelStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export const LabelType = UserType;

export enum LabelApplicationStatus {
  ACTIVE = 'active',
  APPROVED = 'approved',
}
