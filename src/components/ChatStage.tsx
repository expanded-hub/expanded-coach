import { useState, useRef, useEffect } from 'react';
import { sendMessage, containsProfile, type Message } from '../api/chat';

interface Props {
  onProfileReady: (messages: Message[]) => void;
}

export default function ChatStage({ onProfileReady }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [input]);

  // Start the conversation — send an empty user nudge to trigger the opening question
  const startConversation = async () => {
    setStarted(true);
    setIsLoading(true);
    setError(null);
    try {
      // Send an initial "hello" to trigger the coach's opening question
      const initMessages: Message[] = [
        { role: 'user', content: 'Hi, I\'m ready to begin.' },
      ];
      const reply = await sendMessage(initMessages);
      setMessages([
        { role: 'assistant', content: reply },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setStarted(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setError(null);
    const userMsg: Message = { role: 'user', content: trimmed };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');

    setIsLoading(true);
    try {
      // Build the full message history including the hidden initial user message
      const apiMessages: Message[] = [
        { role: 'user', content: 'Hi, I\'m ready to begin.' },
        ...updated,
      ];
      const reply = await sendMessage(apiMessages);
      const assistantMsg: Message = { role: 'assistant', content: reply };
      const newMessages = [...updated, assistantMsg];
      setMessages(newMessages);

      // Check if the profile has been generated
      if (containsProfile(reply)) {
        // Small delay so the user sees the message before transition
        setTimeout(() => onProfileReady(newMessages), 800);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Landing / start screen
  if (!started) {
    return (
      <div className="chat-landing">
        <div className="chat-landing-content">
          <h1 className="landing-title">Discover your Human Edge</h1>
          <p className="landing-subtitle">
            A short, coached conversation to uncover what makes you distinctively
            valuable in an AI world.
          </p>
          <p className="landing-time">Takes about 5 minutes</p>
          <button className="btn-primary" onClick={startConversation}>
            Begin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-stage">
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message chat-message--${msg.role}`}>
            <div className="chat-message-label">
              {msg.role === 'assistant' ? 'Coach' : 'You'}
            </div>
            <div className="chat-message-text">
              {msg.content.split('\n').map((line, j) => (
                <p key={j}>{line}</p>
              ))}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="chat-message chat-message--assistant">
            <div className="chat-message-label">Coach</div>
            <div className="chat-message-text">
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="chat-error">
            <p>{error}</p>
            <button className="btn-secondary" onClick={() => setError(null)}>
              Dismiss
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="chat-input-area">
        <div className="chat-input-wrapper">
          <textarea
            ref={inputRef}
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your response..."
            rows={1}
            disabled={isLoading}
          />
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
