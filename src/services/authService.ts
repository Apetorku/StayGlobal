import { useUser } from "@clerk/clerk-react";

const ADMIN_EMAIL = 'bamenorhu8@gmail.com';

export const useIsAdmin = () => {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded || !user) {
    return false;
  }
  
  // Check if the current user's email matches the admin email
  const userEmail = user.emailAddresses?.[0]?.emailAddress;
  return userEmail === ADMIN_EMAIL;
};

export const checkIsAdmin = (userEmail?: string): boolean => {
  return userEmail === ADMIN_EMAIL;
};

export { ADMIN_EMAIL };
