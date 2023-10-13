import 'regenerator-runtime/runtime';

import React, {
  useState,
  FormEvent,
  ChangeEvent,
  useEffect,
  useRef,
} from 'react';
import Messages from './Messages';
import { Message } from 'ai/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faStop } from '@fortawesome/free-solid-svg-icons';
import { createSpeechlySpeechRecognition } from '@speechly/speech-recognition-polyfill';
import SpeechRecognition, {
  useSpeechRecognition,
} from 'react-speech-recognition';

const appId: string = 'df9e9323-8c5d-43c6-a215-f1c6084091f8';
const SpeechlySpeechRecognition = createSpeechlySpeechRecognition(appId);
SpeechRecognition.applyPolyfill(SpeechlySpeechRecognition);

interface ChatProps {
  input: string;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleMessageSubmit: (e: FormEvent<HTMLFormElement>) => Promise<void>;
  messages: Message[];
  isLoading: boolean;
  isWebSpeechEnabled: boolean;
  isSpeechStopped: boolean;
}

const Chat: React.FC<ChatProps> = ({
  input,
  handleInputChange,
  handleMessageSubmit,
  messages,
  isLoading,
  isWebSpeechEnabled,
  isSpeechStopped,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const { transcript } = useSpeechRecognition();
  const [isStopFading, setIsStopFading] = useState(false);
  const handleInputChangeRef = useRef(handleInputChange);

  useEffect(() => {
    if (transcript) {
      handleInputChangeRef.current({
        target: { value: transcript },
      } as ChangeEvent<HTMLInputElement>);
    }
  }, [transcript]);

  const startListening = () => {
    SpeechRecognition.startListening();
  };
  const stopListening = () => {
    SpeechRecognition.stopListening();
  };

  const stopSpeaking = () => {
    setIsStopFading(true);
    setTimeout(() => setIsStopFading(false), 1000);
    speechSynthesis.cancel();
    setIsRecording(false);
  };

  const toggleListening = async () => {
    if (isRecording) {
      stopListening();
      if (input) {
        await handleMessageSubmit(
          new Event('submit') as unknown as FormEvent<HTMLFormElement>
        );
      }
    } else {
      startListening();
    }
    setIsRecording(!isRecording);
  };

  // Extracted the nested ternary operation into a separate variable
  const recordButtonTitle = () => {
    if (isWebSpeechEnabled && !isRecording) return 'Record a Message';
    if (isWebSpeechEnabled && isRecording) return 'Send Message';
    return 'Enable Web Speech to Record a Message';
  };

  return (
    <div id="chat" className="flex flex-col w-full lg:w-3/5 px-2 flex-grow">
      <Messages
        messages={messages}
        isLoading={isLoading}
        isWebSpeechEnabled={isWebSpeechEnabled}
        isSpeechStopped={isSpeechStopped}
      />
      <form
        onSubmit={handleMessageSubmit}
        className="mt-5 mb-2 relative bg-iridium-chat rounded-lg"
      >
        <input
          type="text"
          className="input-glow appearance-none border rounded w-full py-2 px-3 text-gray-200 leading-tight focus:outline-none focus:shadow-outline pl-3 pr-16 bg-iridium-chat border-gray-600 transition-shadow duration-200"
          value={input}
          onChange={handleInputChange}
        />
        <span
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400"
          style={{ color: '#D2D6DC' }}
        >
          Send Message ⮐
          <div>
            <button
              type="button"
              className={`ml-2 ${
                isWebSpeechEnabled
                  ? '#D2D6DC animate-pulse-once'
                  : 'text-gray-500 cursor-not-allowed'
              }`}
              onClick={toggleListening}
              disabled={!isWebSpeechEnabled}
              title={recordButtonTitle()}
            >
              <FontAwesomeIcon icon={faMicrophone} fade={isRecording} />
            </button>
            <button
              type="button"
              className={`ml-2 ${
                isWebSpeechEnabled
                  ? '#D2D6DC animate-pulse-once'
                  : 'text-gray-500 cursor-not-allowed'
              }`}
              onClick={stopSpeaking}
              disabled={!isWebSpeechEnabled}
              title={
                isWebSpeechEnabled
                  ? 'Stop Message'
                  : 'Enable Web Speech to Stop ongoing Messages'
              }
            >
              <FontAwesomeIcon icon={faStop} fade={isStopFading} />
            </button>
          </div>
        </span>
      </form>
    </div>
  );
};

export default Chat;
