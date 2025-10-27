import { EVENT_TYPES, EventType } from "@/config";
import React, { useState, useEffect, useMemo } from "react";

export type Payload = Record<string, any>;
export type StateHash = string | null;

export interface AppState {
  type: EventType;
  payload: Payload;
  stateHash?: StateHash;
}

export const EMPTY_STATE_ID = "EMPTY" as const;

type TEmptyStateId = typeof EMPTY_STATE_ID;

// This will create a type error if the union contains "EMPTY"
type ForbidEmpty<T extends string> = T extends TEmptyStateId ? never : T;
interface StateNavigationContextType<T extends string = string> {
  activeState: T | TEmptyStateId;
  payload: Payload;
  stateHash: StateHash;
  shouldTransitionBegin: boolean;
  transitionFinished: boolean;
  setShouldTransitionBegin: (value: boolean) => void;
  setTransitionFinished: (value: boolean) => void;
}

export function isAppState(state: any): state is AppState {
  return (
    typeof state === "object" &&
    state !== null &&
    typeof state.type === "string" &&
    typeof state.payload === "object" &&
    state.payload !== null &&
    EVENT_TYPES.includes(state.type as EventType)
  );
}

export const StateNavigationContext =
  React.createContext<StateNavigationContextType>({
    activeState: EMPTY_STATE_ID,
    payload: {},
    stateHash: null,
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
  const [stateHash, setStateHash] = useState<string | null>(null);
  const [shouldTransitionBegin, setShouldTransitionBegin] = useState(false);
  const [transitionFinished, setTransitionFinished] = useState(false);

  useEffect(() => {
    if (!isAppState(state)) return;
    // Since stateHash is unique for each state,
    // we can use just stateHash to determine if the state has changed
    if (state.stateHash !== stateHash) {
      setNextState(state);
      setShouldTransitionBegin(true);
    }
  }, [state]);

  useEffect(() => {
    if ((transitionFinished || activeState === EMPTY_STATE_ID) && nextState) {
      setActiveState(nextState.type);
      setPayload(nextState.payload);
      setStateHash(nextState.stateHash || null);
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
        stateHash,
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
  const {
    activeState,
    payload,
    shouldTransitionBegin,
    setTransitionFinished,
    stateHash,
  } = React.useContext(StateNavigationContext);

  const isActive = useMemo(() => {
    return activeState === pageState;
  }, [activeState, pageState]);

  if (isActive) {
    // mount the props to the component
    const Component = component;
    const componentKey = `${pageState}-${String(stateHash ?? "NULL")}`;
    return (
      <>
        {Component ? (
          <Component
            key={componentKey}
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
