// Kept separate from apiClient so modules in its import cycle (auth store,
// auth api) can read the base URL without hitting a partially initialized module.
//
// Each app injects its own URL source once at startup:
//   web    — setApiBaseUrl(process.env.NEXT_PUBLIC_API_URL)
//   mobile — setApiBaseUrl(Constants.expoConfig.extra.apiUrl)
//
// Always read through getApiBaseUrl() at call time. Capturing the value at
// module scope (e.g. `axios.create({ baseURL: getApiBaseUrl() })`) freezes the
// default before the app has had a chance to inject the real URL.

let baseUrl = "https://localhost:7249/api";

export const getApiBaseUrl = (): string => baseUrl;

export const setApiBaseUrl = (url: string): void => {
  baseUrl = url;
};
