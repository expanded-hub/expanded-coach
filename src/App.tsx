import { useState, useCallback } from 'react';
import Header from './components/Header';
import ChatStage from './components/ChatStage';
import EmailGate from './components/EmailGate';
import ResultsDisplay from './components/ResultsDisplay';
import { parseProfile, containsProfile, type Message, type ProfileData } from './api/chat';

type Stage = 'chat' | 'email' | 'results';

export default function App() {
  const [stage, setStage] = useState<Stage>('chat');
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const handleProfileReady = useCallback((messages: Message[]) => {
    // Find the last assistant message that contains the profile
    const profileMsg = [...messages]
      .reverse()
      .find((m) => m.role === 'assistant' && containsProfile(m.content));

    if (profileMsg) {
      setProfile(parseProfile(profileMsg.content));
      setStage('email');
    }
  }, []);

  const handleEmailSubmitted = useCallback(() => {
    setStage('results');
  }, []);

  return (
    <div className="app">
      <Header />
      <main className="main">
        {stage === 'chat' && (
          <ChatStage onProfileReady={handleProfileReady} />
        )}
        {stage === 'email' && (
          <EmailGate onSubmitted={handleEmailSubmitted} />
        )}
        {stage === 'results' && profile && (
          <ResultsDisplay profile={profile} />
        )}
      </main>
    </div>
  );
}
