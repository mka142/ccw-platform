import React, { useState, useEffect, useMemo } from "react";

export const StateNavigationContext = React.createContext({
  activeState: null,
  shouldTransitionBegin: false,
  transitionFinished: false,
  nextActiveState: null,
  setShouldTransitionBegin: (value: boolean) => {},
  setTransitionFinished: (value: boolean) => {},
});

export const StateNavigationProvider = StateNavigationContext.Provider;

export function WithStateNavigation({
  children,
  state,
}: {
  children: React.ReactNode;
  state: string;
}) {
  const [activeState, setActiveState] = useState(state);
  const [nextActiveState, setNextActiveState] = useState(null);
  const [shouldTransitionBegin, setShouldTransitionBegin] = useState(false);
  const [transitionFinished, setTransitionFinished] = useState(false);

  useEffect(() => {
    if (state !== activeState) {
      setNextActiveState(state);
      setShouldTransitionBegin(true);
    }
  }, [state]);

  useEffect(() => {
    if (transitionFinished) {
      setActiveState(nextActiveState);
      setShouldTransitionBegin(false);
      setTransitionFinished(false);
      setNextActiveState(null);
    }
  }, [transitionFinished]);

  return (
    <StateNavigationProvider
      value={{
        activeState,
        nextActiveState,
        shouldTransitionBegin,
        transitionFinished,
        setShouldTransitionBegin,
        setTransitionFinished,
      }}
    >
      {children}
    </StateNavigationProvider>
  );
}

export function StateNavigationPage({
  pageState,
  component,
}: {
  pageState: string;
  component: React.ComponentType<any>;
}) {
  const { activeState, shouldTransitionBegin, setTransitionFinished } =
    React.useContext(StateNavigationContext);

  const isActive = useMemo(() => {
    return activeState === pageState;
  }, [activeState, pageState]);

  if (isActive) {
    // mount the props to the component
    const Component = component;
    return (
      <>
        {Component ? (
          <Component
            shouldTransitionBegin={shouldTransitionBegin}
            setTransitionFinished={() => {
              setTransitionFinished(true);
            }}
          />
        ) : null}
      </>
    );
  }
  return null;
}
