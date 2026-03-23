import { useEffect } from 'react';

interface Props {
  onSubmitted: () => void;
}

export default function EmailGate({ onSubmitted }: Props) {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Tally sends a postMessage when the form is submitted
      if (event.data?.event === 'Tally.FormSubmitted') {
        onSubmitted();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSubmitted]);

  return (
    <div className="email-gate">
      <div className="email-gate-content">
        <h2 className="email-gate-title">Your profile is ready.</h2>
        <p className="email-gate-subtitle">
          Enter your email to see your Human Edge Profile.
        </p>

        <div className="tally-embed-wrapper">
          <iframe
            src="https://tally.so/embed/2Erokg?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
            loading="lazy"
            width="100%"
            height="200"
            frameBorder="0"
            marginHeight={0}
            marginWidth={0}
            title="Get your results"
            style={{ border: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}
