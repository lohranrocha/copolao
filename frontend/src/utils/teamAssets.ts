type TeamAsset = {
  code: string;
  flag: string;
};

const assets: Record<string, TeamAsset> = {
  Alemanha: { code: "GER", flag: "🇩🇪" },
  "África do Sul": { code: "RSA", flag: "🇿🇦" },
  "Arábia Saudita": { code: "KSA", flag: "🇸🇦" },
  Argentina: { code: "ARG", flag: "🇦🇷" },
  Argélia: { code: "ALG", flag: "🇩🇿" },
  Austrália: { code: "AUS", flag: "🇦🇺" },
  Áustria: { code: "AUT", flag: "🇦🇹" },
  Bélgica: { code: "BEL", flag: "🇧🇪" },
  "Bósnia e Herzegovina": { code: "BIH", flag: "🇧🇦" },
  Brasil: { code: "BRA", flag: "🇧🇷" },
  "Cabo Verde": { code: "CPV", flag: "🇨🇻" },
  Canadá: { code: "CAN", flag: "🇨🇦" },
  Catar: { code: "QAT", flag: "🇶🇦" },
  Colômbia: { code: "COL", flag: "🇨🇴" },
  "Coreia do Sul": { code: "KOR", flag: "🇰🇷" },
  "Costa do Marfim": { code: "CIV", flag: "🇨🇮" },
  Croácia: { code: "CRO", flag: "🇭🇷" },
  Curaçao: { code: "CUW", flag: "🇨🇼" },
  Egito: { code: "EGY", flag: "🇪🇬" },
  Equador: { code: "ECU", flag: "🇪🇨" },
  Escócia: { code: "SCO", flag: "🏴" },
  Espanha: { code: "ESP", flag: "🇪🇸" },
  "Estados Unidos": { code: "USA", flag: "🇺🇸" },
  França: { code: "FRA", flag: "🇫🇷" },
  Gana: { code: "GHA", flag: "🇬🇭" },
  Haiti: { code: "HAI", flag: "🇭🇹" },
  Holanda: { code: "NED", flag: "🇳🇱" },
  Inglaterra: { code: "ENG", flag: "🏴" },
  Irã: { code: "IRN", flag: "🇮🇷" },
  Iraque: { code: "IRQ", flag: "🇮🇶" },
  Japão: { code: "JPN", flag: "🇯🇵" },
  Jordânia: { code: "JOR", flag: "🇯🇴" },
  Marrocos: { code: "MAR", flag: "🇲🇦" },
  México: { code: "MEX", flag: "🇲🇽" },
  Noruega: { code: "NOR", flag: "🇳🇴" },
  "Nova Zelândia": { code: "NZL", flag: "🇳🇿" },
  Panamá: { code: "PAN", flag: "🇵🇦" },
  Paraguai: { code: "PAR", flag: "🇵🇾" },
  Portugal: { code: "POR", flag: "🇵🇹" },
  "RD Congo": { code: "COD", flag: "🇨🇩" },
  Senegal: { code: "SEN", flag: "🇸🇳" },
  Suécia: { code: "SWE", flag: "🇸🇪" },
  Suíça: { code: "SUI", flag: "🇨🇭" },
  Tchéquia: { code: "CZE", flag: "🇨🇿" },
  Tunísia: { code: "TUN", flag: "🇹🇳" },
  Turquia: { code: "TUR", flag: "🇹🇷" },
  Uruguai: { code: "URU", flag: "🇺🇾" },
  Uzbequistão: { code: "UZB", flag: "🇺🇿" }
};

export function getTeamAsset(teamName: string) {
  return assets[teamName] ?? { code: teamName.slice(0, 3).toUpperCase(), flag: "🏳️" };
}
