import { ClerkProvider as ClerkProviderBase } from '@clerk/clerk-react';
import { ReactNode } from 'react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key. Please add VITE_CLERK_PUBLISHABLE_KEY to your .env file");
}

interface ClerkProviderProps {
  children: ReactNode;
}

export default function ClerkProvider({ children }: ClerkProviderProps) {
  return (
    <ClerkProviderBase publishableKey={PUBLISHABLE_KEY}>
      {children}
    </ClerkProviderBase>
  );
}
