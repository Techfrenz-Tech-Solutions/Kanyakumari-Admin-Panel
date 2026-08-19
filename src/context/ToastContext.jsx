import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle, XCircle, Info, X } from '../components/ui/Icons.jsx';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((title, message, type = 'info') => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => removeToast(id), 4200);
  }, [removeToast]);

  const toast = {
    success: (title, message) => showToast(title, message, 'success'),
    error: (title, message) => showToast(title, message, 'error'),
    info: (title, message) => showToast(title, message, 'info'),
  };

  const icons = { success: CheckCircle, error: XCircle, info: Info };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <div className={`toast ${t.type}`} key={t.id}>
              <Icon className="icon" />
              <div>
                <div className="t">{t.title}</div>
                {t.message && <div className="m">{t.message}</div>}
              </div>
              <span className="close" onClick={() => removeToast(t.id)}><X /></span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
