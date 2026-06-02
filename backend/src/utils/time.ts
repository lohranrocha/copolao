export const APP_TIME_ZONE = "America/Sao_Paulo";

export function formatBrazilDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: APP_TIME_ZONE,
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}
