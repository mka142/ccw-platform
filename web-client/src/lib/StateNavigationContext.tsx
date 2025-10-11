import React, { useState, useEffect, useMemo } from "react";

export const EMPTY_STATE_ID = "EMPTY" as const;

type TEmptyStateId = typeof EMPTY_STATE_ID;

// This will create a type error if the union contains "EMPTY"
type ForbidEmpty<T extends string> = T extends TEmptyStateId ? never : T;
interface StateNavigationContextType<T extends string = string> {
  activeState: T | TEmptyStateId;
  shouldTransitionBegin: boolean;
  transitionFinished: boolean;
  nextActiveState: T | null;
  setShouldTransitionBegin: (value: boolean) => void;
  setTransitionFinished: (value: boolean) => void;
}

export const StateNavigationContext =
  React.createContext<StateNavigationContextType>({
    activeState: EMPTY_STATE_ID,
    shouldTransitionBegin: false,
    transitionFinished: false,
    nextActiveState: null,
    setShouldTransitionBegin: (value: boolean) => {},
    setTransitionFinished: (value: boolean) => {},
  });

export interface StateNavigationComponentProps {
  shouldTransitionBegin: boolean;
  setTransitionFinished: () => void;
}

export const StateNavigationProvider = StateNavigationContext.Provider;

export function WithStateNavigation<T extends string>({
  children,
  state,
}: {
  children: React.ReactNode;
  state: ForbidEmpty<T>;
}) {
  const [activeState, setActiveState] = useState<T | TEmptyStateId>(state);
  const [nextActiveState, setNextActiveState] = useState<T | null>(null);
  const [shouldTransitionBegin, setShouldTransitionBegin] = useState(false);
  const [transitionFinished, setTransitionFinished] = useState(false);

  useEffect(() => {
    if (state !== activeState) {
      setNextActiveState(state);
      setShouldTransitionBegin(true);
    }
  }, [state]);

  useEffect(() => {
    if (transitionFinished && nextActiveState) {
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

export function StateNavigationPage<T extends string>({
  pageState,
  component,
}: {
  pageState: ForbidEmpty<T>;
  component: React.ComponentType<StateNavigationComponentProps> | null;
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
