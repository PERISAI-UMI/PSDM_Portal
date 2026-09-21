import type { AppDatabase } from '../db/index.ts';
import type { User, Session, PjDepartment } from '../db/schema/index.ts';

export interface UserWithPj extends Omit<User, 'passwordHash'> {
  pjDepartments?: PjDepartment[];
}

export type HonoBindings = {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN?: string;
  SESSION_SECRET?: string;
  ALLOWED_ORIGIN?: string;
  B2_APPLICATION_KEY_ID?: string;
  B2_APPLICATION_KEY?: string;
  B2_BUCKET_NAME?: string;
  B2_ENDPOINT?: string;
  B2_REGION?: string;
};

export type HonoVariables = {
  db: AppDatabase;
  user: UserWithPj;
  session: Session;
};

export type AppEnv = {
  Bindings: HonoBindings;
  Variables: HonoVariables;
};
