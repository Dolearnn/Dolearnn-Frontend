'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { dashboardPathForRole, loginWithGoogle } from '@/lib/api/auth';

interface GoogleAuthButtonProps {
  mode: 'login' | 'register';
}

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  ux_mode?: 'popup' | 'redirect';
}

interface GoogleButtonOptions {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  width?: number;
  logo_alignment?: 'left' | 'center';
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfig) => void;
          renderButton: (parent: HTMLElement, options: GoogleButtonOptions) => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GSI_SRC = 'https://accounts.google.com/gsi/client';

export default function GoogleAuthButton({ mode }: GoogleAuthButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  const mutation = useMutation({
    mutationFn: loginWithGoogle,
    onSuccess: ({ user }) => {
      toast({
        title: mode === 'register' ? 'Account created' : 'Welcome back',
        description: `Signed in as ${user.name}.`,
      });
      if (user.mustChangePassword) {
        router.push('/change-password');
        router.refresh();
        return;
      }
      router.push(dashboardPathForRole(user.role));
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: 'Google sign-in failed',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const mutateRef = useRef(mutation.mutate);
  useEffect(() => {
    mutateRef.current = mutation.mutate;
  }, [mutation.mutate]);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const update = () => {
      const next = wrapperRef.current?.offsetWidth ?? 0;
      setWidth(next);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !overlayRef.current || width === 0) return;

    const render = () => {
      const target = overlayRef.current;
      if (!window.google?.accounts?.id || !target) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        ux_mode: 'popup',
        callback: (response) => {
          if (response?.credential) {
            mutateRef.current({ idToken: response.credential });
          }
        },
      });
      target.innerHTML = '';
      window.google.accounts.id.renderButton(target, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: mode === 'register' ? 'signup_with' : 'continue_with',
        logo_alignment: 'center',
        width,
      });
    };

    if (window.google?.accounts?.id) {
      render();
      return;
    }

    let script = document.querySelector<HTMLScriptElement>(
      `script[src="${GSI_SRC}"]`,
    );
    if (!script) {
      script = document.createElement('script');
      script.src = GSI_SRC;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
    script.addEventListener('load', render);
    return () => {
      script?.removeEventListener('load', render);
    };
  }, [mode, width]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <Button
        type="button"
        variant="outline"
        className="w-full rounded-full border-gray-300 dark:border-border bg-white dark:bg-card text-gray-800 dark:text-foreground hover:bg-gray-50 dark:hover:bg-white/5"
        onClick={() =>
          toast({
            title: 'Google sign-in is not configured',
            description: 'Use email to continue.',
          })
        }
      >
        <GoogleMark />
        Continue with Google
      </Button>
    );
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <Button
        type="button"
        variant="outline"
        disabled={mutation.isPending}
        tabIndex={-1}
        aria-hidden="true"
        className="w-full rounded-full border-gray-300 dark:border-border bg-white dark:bg-card text-gray-800 dark:text-foreground hover:bg-gray-50 dark:hover:bg-white/5"
      >
        <GoogleMark />
        {mutation.isPending
          ? 'Signing you in...'
          : mode === 'register'
            ? 'Sign up with Google'
            : 'Continue with Google'}
      </Button>
      <div
        ref={overlayRef}
        className="absolute inset-0 flex items-center justify-center opacity-0 [&>*]:!w-full"
        aria-label={mode === 'register' ? 'Sign up with Google' : 'Continue with Google'}
      />
    </div>
  );
}

function GoogleMark() {
  return (
    <svg
      className="mr-2 h-4 w-4"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
