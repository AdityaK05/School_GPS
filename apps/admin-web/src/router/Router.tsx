import React, { createContext, useContext, useState, useEffect } from 'react';

export type PersonaMode = 'admin' | 'parent' | 'attendant' | 'mobile_preview';

interface RouterContextType {
  pathname: string;
  navigate: (path: string) => void;
  persona: PersonaMode;
  setPersona: (p: PersonaMode) => void;
  showDemoPanel: boolean;
  setShowDemoPanel: (show: boolean) => void;
  getParam: (name: string) => string | undefined;
}

const RouterContext = createContext<RouterContextType>({
  pathname: '/',
  navigate: () => {},
  persona: 'admin',
  setPersona: () => {},
  showDemoPanel: false,
  setShowDemoPanel: () => {},
  getParam: () => undefined,
});

export const useRouter = () => useContext(RouterContext);

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pathname, setPathname] = useState<string>(() => window.location.pathname || '/');
  const [showDemoPanel, setShowDemoPanel] = useState<boolean>(false);
  
  // Determine initial persona from pathname
  const [persona, setPersonaState] = useState<PersonaMode>(() => {
    const p = window.location.pathname || '/';
    if (p.startsWith('/parent')) return 'parent';
    if (p.startsWith('/attendant')) return 'attendant';
    if (p.startsWith('/mobile')) return 'mobile_preview';
    return 'admin';
  });

  const setPersona = (newPersona: PersonaMode) => {
    setPersonaState(newPersona);
    if (newPersona === 'admin' && (pathname.startsWith('/parent') || pathname.startsWith('/attendant') || pathname.startsWith('/mobile'))) {
      navigate('/');
    } else if (newPersona === 'parent' && !pathname.startsWith('/parent')) {
      navigate('/parent');
    } else if (newPersona === 'attendant' && !pathname.startsWith('/attendant')) {
      navigate('/attendant');
    } else if (newPersona === 'mobile_preview' && !pathname.startsWith('/mobile')) {
      navigate('/mobile');
    }
  };

  const navigate = (path: string) => {
    if (path !== pathname) {
      window.history.pushState(null, '', path);
      setPathname(path);
      if (path.startsWith('/parent')) setPersonaState('parent');
      else if (path.startsWith('/attendant')) setPersonaState('attendant');
      else if (path.startsWith('/mobile')) setPersonaState('mobile_preview');
      else setPersonaState('admin');
      window.scrollTo(0, 0);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname || '/';
      setPathname(p);
      if (p.startsWith('/parent')) setPersonaState('parent');
      else if (p.startsWith('/attendant')) setPersonaState('attendant');
      else if (p.startsWith('/mobile')) setPersonaState('mobile_preview');
      else setPersonaState('admin');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const getParam = (name: string): string | undefined => {
    const segments = pathname.split('/').filter(Boolean);
    // Standard pattern: /resource/:id
    if (segments.length >= 2 && name === 'id') {
      return segments[1];
    }
    return undefined;
  };

  return (
    <RouterContext.Provider
      value={{
        pathname,
        navigate,
        persona,
        setPersona,
        showDemoPanel,
        setShowDemoPanel,
        getParam,
      }}
    >
      {children}
    </RouterContext.Provider>
  );
};
