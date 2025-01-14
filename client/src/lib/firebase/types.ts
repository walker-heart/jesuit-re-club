export interface UserInfo {
  firstName: string;
  lastName: string;
  email: string;
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
  numberOfTexts: number;
  textFields: string[];
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
