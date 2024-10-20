import React, { useEffect, useState } from 'react';
import logo from '@assets/img/logo.svg';
import { createClient, User } from '@supabase/supabase-js'
import { chromeStorageKeys } from '../background';

const supabaseUrl = "https://qfxxcuboozaccrjdqhzq.supabase.co";
  const supabaseAnonKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmeHhjdWJvb3phY2NyamRxaHpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkzNDQxNTQsImV4cCI6MjA0NDkyMDE1NH0.2FiScM9ps-SQFtN2wODLr9dLYgDLzowKGrTUtvEDv9k';

export default function Popup() {

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setIsLoading(true);

   getCurrentUser().then((data) => {
    setIsLoading(false);
    setUser(data?.user ?? null);
   });
  }, []);

  const loginWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      })

      if (error) {
        console.log("Error: ", error);
      }

      await chrome.runtime.sendMessage({
        action: "signInWithGoogle",
        payload: { url: data.url } // url is something like: https://[project_id].supabase.co/auth/v1/authorize?provider=google
      });
  }

const getCurrentUser = async (): Promise<null | {
  user: User;
  accessToken: string;
  }> => {
    if (!chromeStorageKeys) {
      console.log("chromeStorageKeys is not defined");
      return null;
    }

  const gauthAccessToken = (
    await chrome.storage.sync.get(chromeStorageKeys?.gauthAccessToken)
  )[chromeStorageKeys?.gauthAccessToken];

  const gauthRefreshToken = (
    await chrome.storage.sync.get(chromeStorageKeys.gauthRefreshToken)
  )[chromeStorageKeys.gauthRefreshToken];

  if (gauthAccessToken && gauthRefreshToken) {
    try {
      // set user session from access_token and refresh_token
      const resp = await supabase.auth.setSession({
        access_token: gauthAccessToken,
        refresh_token: gauthRefreshToken,
      });

      const user = resp.data?.user;
      const supabaseAccessToken = resp.data.session?.access_token;

      if (user && supabaseAccessToken) {
        return { user, accessToken: supabaseAccessToken };
      }
    } catch (e: any) {
      console.error("Error: ", e);
    }
  }

  return null;
}

  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 text-center h-full p-3 bg-gray-800">
      {isLoading &&
        <img src={logo} className="h-36 pointer-events-none animate-spin-slow" alt="logo" />
      }

      {!isLoading && user && 
        <div>
          <p>Logged in as {user.email}</p>
        </div>
      }

      {!isLoading && !user &&
      <header className="flex flex-col items-center justify-center text-white">
        <p>
          Edit <code>src/pages/popup/Popup.jsx</code> and save to reload.
        </p>
        <a
          className="text-blue-400"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React!
        </a>
        <p>Popup styled with TailwindCSS!</p>

        <button onClick={loginWithGoogle}>Login with Google</button>
      </header>
}
    </div>
  );
}
