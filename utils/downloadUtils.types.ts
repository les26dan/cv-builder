export interface CVData {
  contact: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
  };
  summary?: { content?: string };
  experience?: {
    items: Array<{
      id: string;
      title: string;
      company: string;
      location?: string;
      startDate: string;
      endDate?: string;
      current?: boolean;
      bullets?: string[];
    }>;
  };
  skills?: { items: any[] };
  education?: {
    items: Array<{
      id: string;
      degree: string;
      institution: string;
      location?: string;
      graduationDate: string;
      description?: string;
    }>;
  };
  sectionOrder?: string[];
  sectionTitles?: Record<string, string>;
  [key: string]: any;
}
