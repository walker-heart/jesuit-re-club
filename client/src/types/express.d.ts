import { SelectUser } from '@db/schema';

declare global {
  namespace Express {
    interface User extends Omit<SelectUser, 'password'> {}
  }
}
