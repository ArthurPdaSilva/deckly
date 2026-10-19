import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";

interface AsyncState<T> {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
}

export interface AsyncData<T> extends AsyncState<T> {
  reload: () => void;
  setData: Dispatch<SetStateAction<T | undefined>>;
}

/**
 * Carrega dados assíncronos (repositórios) e expõe `reload` para refazer a
 * consulta e `setData` para atualizações otimistas.
 */
export function useAsyncData<T>(
  loader: () => Promise<T>,
  dependencies: readonly unknown[],
): AsyncData<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: undefined,
    error: undefined,
    loading: true,
  });
  const [version, setVersion] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: as dependências são informadas por quem chama o hook
  useEffect(() => {
    let active = true;
    setState((current) => ({ ...current, loading: true, error: undefined }));

    loader().then(
      (data) => {
        if (active) setState({ data, error: undefined, loading: false });
      },
      (cause: unknown) => {
        if (active) {
          setState({
            data: undefined,
            error: cause instanceof Error ? cause : new Error(String(cause)),
            loading: false,
          });
        }
      },
    );

    return () => {
      active = false;
    };
  }, [...dependencies, version]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);
  const setData: Dispatch<SetStateAction<T | undefined>> = useCallback(
    (value) =>
      setState((current) => ({
        ...current,
        data:
          typeof value === "function"
            ? (value as (previous: T | undefined) => T | undefined)(
                current.data,
              )
            : value,
      })),
    [],
  );

  return { ...state, reload, setData };
}
