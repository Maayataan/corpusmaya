export type ContributionStatus = 'pending' | 'approved' | 'rejected';

export type Dialect =
  | 'oriente'
  | 'noroccidente'
  | 'centro'
  | 'sur'
  | 'costa'
  | 'otro';

export type Source =
  | 'hablante_nativo'
  | 'estudiante'
  | 'academico'
  | 'evento'
  | 'otro';

export interface Contribution {
  id: string;
  maya_text: string;
  spanish_translation: string;
  prompt_topic: string | null;
  audio_url: string | null;
  contributor_name: string;
  consent_given: boolean;
  dialect: Dialect;
  source: Source;
  status: ContributionStatus;
  created_at: string;
}

export interface SpeakerInterest {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  dialect: Dialect | null;
  is_native_speaker: boolean;
  wants_to_validate: boolean;
  message: string | null;
  created_at: string;
}

export interface AllyInterest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  organization: string | null;
  roles: string[];
  message: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      contributions: {
        Row: Contribution;
        Insert: Omit<Contribution, 'id' | 'created_at' | 'status'>;
        Update: Partial<Contribution>;
      };
      speakers_interest: {
        Row: SpeakerInterest;
        Insert: Omit<SpeakerInterest, 'id' | 'created_at'>;
        Update: Partial<SpeakerInterest>;
      };
      allies_interest: {
        Row: AllyInterest;
        Insert: Omit<AllyInterest, 'id' | 'created_at'>;
        Update: Partial<AllyInterest>;
      };
    };
  };
}
