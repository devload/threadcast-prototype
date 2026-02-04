import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { api } from '../../services/api';

interface TerminalViewerProps {
  todoId: string;
  sessionActive?: boolean;
}

export const TerminalViewer = ({ todoId, sessionActive = false }: TerminalViewerProps) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);
  const eventSource = useRef<EventSource | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        selectionBackground: '#264f78',
      },
      scrollback: 1000,
      convertEol: true,
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(terminalRef.current);

    terminalInstance.current = term;
    fitAddon.current = fit;

    // Delay fit() to ensure DOM is ready
    const fitTimeout = setTimeout(() => {
      try {
        fit.fit();
      } catch (e) {
        console.warn('Terminal fit failed:', e);
      }
    }, 100);

    // Handle resize with debounce
    let resizeTimeout: ReturnType<typeof setTimeout>;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        try {
          if (terminalInstance.current && fitAddon.current) {
            fitAddon.current.fit();
          }
        } catch (e) {
          console.warn('Terminal resize fit failed:', e);
        }
      }, 50);
    });
    resizeObserver.observe(terminalRef.current);

    return () => {
      clearTimeout(fitTimeout);
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
      term.dispose();
    };
  }, []);

  // Connect to terminal stream
  useEffect(() => {
    if (!sessionActive || !terminalInstance.current) return;

    const term = terminalInstance.current;
    term.clear();
    term.writeln('\x1b[33mConnecting to terminal...\x1b[0m');

    // First, get current screen content
    api.get<string>(`/todos/${todoId}/terminal/screen`)
      .then((screenContent: string) => {
        if (screenContent) {
          term.clear();
          // Decode base64 if needed
          try {
            const content = atob(screenContent);
            term.write(content);
          } catch {
            term.write(screenContent);
          }
        }
        setIsConnected(true);
        setError(null);
      })
      .catch((err: Error) => {
        setError('Failed to get screen: ' + err.message);
      });

    // Connect to SSE stream for real-time updates
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:21000';
    const url = `${baseUrl}/api/todos/${todoId}/terminal/stream`;

    const es = new EventSource(url);
    eventSource.current = es;

    es.addEventListener('screen', (event) => {
      try {
        const content = atob(event.data);
        term.clear();
        term.write(content);
      } catch {
        term.write(event.data);
      }
    });

    es.onerror = () => {
      setIsConnected(false);
      setError('Connection lost');
    };

    es.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    return () => {
      es.close();
      eventSource.current = null;
    };
  }, [todoId, sessionActive]);

  // Handle keyboard input (send to terminal)
  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (!sessionActive) return;

    let keys = '';
    if (e.key === 'Enter') {
      keys = '';
      await sendKeys(keys, true);
    } else if (e.key === 'Backspace') {
      keys = '\x7f';
      await sendKeys(keys, false);
    } else if (e.key === 'Escape') {
      keys = '\x1b';
      await sendKeys(keys, false);
    } else if (e.key.length === 1) {
      keys = e.key;
      await sendKeys(keys, false);
    }
  };

  const sendKeys = async (keys: string, enter: boolean) => {
    try {
      await api.post(`/todos/${todoId}/terminal/sendkeys`, { keys, enter });
    } catch (err) {
      console.error('Failed to send keys:', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#252526] border-b border-[#3c3c3c]">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Terminal</span>
          {isConnected ? (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Live
            </span>
          ) : (
            <span className="text-xs text-gray-500">Disconnected</span>
          )}
        </div>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>

      {/* Terminal */}
      <div
        ref={terminalRef}
        className="flex-1 p-2"
        onKeyDown={handleKeyDown}
        tabIndex={0}
        style={{ minHeight: '300px' }}
      />

      {/* Footer with instructions */}
      {!sessionActive && (
        <div className="px-3 py-2 bg-[#252526] border-t border-[#3c3c3c]">
          <span className="text-xs text-gray-500">
            Start the worker to see terminal output
          </span>
        </div>
      )}
    </div>
  );
};

export default TerminalViewer;
