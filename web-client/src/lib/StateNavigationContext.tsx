import { EventType } from "@/config";
import { AppState, isAppState, Payload } from "@/hooks/useAppState";
import React, { useState, useEffect, useMemo } from "react";

export const EMPTY_STATE_ID = "EMPTY" as const;

type TEmptyStateId = typeof EMPTY_STATE_ID;

// This will create a type error if the union contains "EMPTY"
type ForbidEmpty<T extends string> = T extends TEmptyStateId ? never : T;
interface StateNavigationContextType<T extends string = string> {
  activeState: T | TEmptyStateId;
  payload: Payload;
  shouldTransitionBegin: boolean;
  transitionFinished: boolean;
  setShouldTransitionBegin: (value: boolean) => void;
  setTransitionFinished: (value: boolean) => void;
}

export const StateNavigationContext =
  React.createContext<StateNavigationContextType>({
    activeState: EMPTY_STATE_ID,
    payload: {},
    shouldTransitionBegin: false,
    transitionFinished: false,
    setShouldTransitionBegin: (value: boolean) => {},
    setTransitionFinished: (value: boolean) => {},
  });

export interface StateNavigationComponentProps {
  shouldTransitionBegin: boolean;
  setTransitionFinished: () => void;
  payload: Payload;
}

export const StateNavigationProvider = StateNavigationContext.Provider;

export function WithStateNavigation({
  children,
  state,
}: {
  children: React.ReactNode;
  state: AppState | null;
}) {
  const [activeState, setActiveState] = useState<EventType | TEmptyStateId>(
    EMPTY_STATE_ID
  );
  const [nextState, setNextState] = useState<AppState | null>(null);
  const [payload, setPayload] = useState<Payload>({});
  const [shouldTransitionBegin, setShouldTransitionBegin] = useState(false);
  const [transitionFinished, setTransitionFinished] = useState(false);

  useEffect(() => {
    if (!isAppState(state)) return;
    if (state.type !== activeState) {
      setNextState(state);
      setShouldTransitionBegin(true);
    }
  }, [state]);

  useEffect(() => {
    if ((transitionFinished || activeState === EMPTY_STATE_ID) && nextState) {
      setActiveState(nextState.type);
      setPayload(nextState.payload);
      setShouldTransitionBegin(false);
      setTransitionFinished(false);
      setNextState(null);
    }
  }, [transitionFinished, nextState]);

  return (
    <StateNavigationProvider
      value={{
        activeState,
        payload,
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
  const { activeState, payload, shouldTransitionBegin, setTransitionFinished } =
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
            payload={payload}
          />
        ) : null}
      </>
    );
  }
  return null;
}
