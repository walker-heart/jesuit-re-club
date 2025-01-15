export interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
}

export type UserRole = 'admin' | 'editor' | 'user' | 'test';

export interface FirebaseUser {
  uid: string;
  firstName: string;
  lastName: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  role: UserRole;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FirebaseEvent {
  id?: string;
  title: string;
  date: string;
  time: string;
  location: string;
  speaker: string;
  speakerDescription: string;
  agenda: string;
  url?: string;
  userId: string;
  createdBy: UserInfo;
  createdAt: string;
  updatedBy: UserInfo;
  updatedAt: string;
}

export interface FirebaseResource {
  id?: string;
  title: string;
  description: string;
  textFields: string[];
  urls?: string[];
  userId: string;
  createdBy: UserInfo;
  createdAt: string;
  updatedBy: UserInfo;
  updatedAt: string;
}

export interface FirebaseNews {
  id?: string;
  title: string;
  content: string;
  date: string;
  imageUrl?: string;
  tags?: string[];
  isPublished: boolean;
  userId: string;
  createdBy: UserInfo;
  createdAt: string;
  updatedBy: UserInfo;
  updatedAt: string;
}

export interface FirebaseInfo {
  id: string;
  title: string;
  icon: string;
  text: string;
  page: 'aboutus' | 'membership';
  sub?: 'top' | 'bottom';
  texts?: string[];
  url1Title?: string;
  url1?: string;
  url2Title?: string;
  url2?: string;
  userId: string;
  createdBy: FirebaseUser;
  createdAt: string;
  updatedBy: FirebaseUser;
  updatedAt: string;
}
