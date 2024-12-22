export interface FirebaseEvent {
  id?: string;
  title: string;
  date: string;
  time: string;
  location: string;
  speaker: string;
  speakerDescription: string;
  agenda: string;
  userCreated: string;
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface FirebaseResource {
  id?: string;
  title: string;
  description: string;
  numberOfTexts: number;
  textFields: string[];
  userId: string;
  creatorName?: string;
  userCreated: string;
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
}
