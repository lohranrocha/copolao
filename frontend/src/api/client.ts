import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3333/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bolao.token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem("bolao.token");
      localStorage.removeItem("bolao.user");

      if (!["/login", "/cadastro"].includes(window.location.pathname)) {
        window.location.assign("/login");
      }
    }

    return Promise.reject(error);
  }
);

export function getApiError(error: unknown) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? "Nao foi possivel concluir a acao.";
  }
  return "Nao foi possivel concluir a acao.";
}

export function getPublicAssetUrl(path: string | null | undefined) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;

  const apiBaseUrl = api.defaults.baseURL ?? "http://localhost:3333/api";
  const publicBaseUrl = apiBaseUrl.replace(/\/api\/?$/, "");
  return `${publicBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}
