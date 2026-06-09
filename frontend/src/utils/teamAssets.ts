export type TeamAsset = {
  code: string;
  flag: string;
  flagSvg?: string;
};

function svgDataUri(svg: string) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function flagCdn(code: string) {
  return `https://flagcdn.com/${code}.svg`;
}

function teamAsset(code: string, flagCode: string): TeamAsset {
  return {
    code,
    flag: code,
    flagSvg: flagCdn(flagCode)
  };
}

const englandFlag = svgDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 36">
    <rect width="60" height="36" fill="#fff"/>
    <path fill="#c8102e" d="M0 14h60v8H0z"/>
    <path fill="#c8102e" d="M26 0h8v36h-8z"/>
  </svg>
`);

const scotlandFlag = svgDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 36">
    <rect width="60" height="36" fill="#0065bd"/>
    <path stroke="#fff" stroke-width="7" d="M0 0l60 36M60 0L0 36"/>
  </svg>
`);

const assets: Record<string, TeamAsset> = {
  Alemanha: teamAsset("GER", "de"),
  "África do Sul": teamAsset("RSA", "za"),
  "Arábia Saudita": teamAsset("KSA", "sa"),
  Argentina: teamAsset("ARG", "ar"),
  Argélia: teamAsset("ALG", "dz"),
  Austrália: teamAsset("AUS", "au"),
  Áustria: teamAsset("AUT", "at"),
  Bélgica: teamAsset("BEL", "be"),
  "Bósnia e Herzegovina": teamAsset("BIH", "ba"),
  Brasil: teamAsset("BRA", "br"),
  "Cabo Verde": teamAsset("CPV", "cv"),
  Canadá: teamAsset("CAN", "ca"),
  Catar: teamAsset("QAT", "qa"),
  Colômbia: teamAsset("COL", "co"),
  "Coreia do Sul": teamAsset("KOR", "kr"),
  "Costa do Marfim": teamAsset("CIV", "ci"),
  Croácia: teamAsset("CRO", "hr"),
  Curaçao: teamAsset("CUW", "cw"),
  Egito: teamAsset("EGY", "eg"),
  Equador: teamAsset("ECU", "ec"),
  Escócia: { code: "SCO", flag: "Escócia", flagSvg: scotlandFlag },
  Espanha: teamAsset("ESP", "es"),
  "Estados Unidos": teamAsset("USA", "us"),
  França: teamAsset("FRA", "fr"),
  Gana: teamAsset("GHA", "gh"),
  Haiti: teamAsset("HAI", "ht"),
  Holanda: teamAsset("NED", "nl"),
  Inglaterra: { code: "ENG", flag: "Inglaterra", flagSvg: englandFlag },
  Irã: teamAsset("IRN", "ir"),
  Iraque: teamAsset("IRQ", "iq"),
  Japão: teamAsset("JPN", "jp"),
  Jordânia: teamAsset("JOR", "jo"),
  Marrocos: teamAsset("MAR", "ma"),
  México: teamAsset("MEX", "mx"),
  Noruega: teamAsset("NOR", "no"),
  "Nova Zelândia": teamAsset("NZL", "nz"),
  Panamá: teamAsset("PAN", "pa"),
  Paraguai: teamAsset("PAR", "py"),
  Portugal: teamAsset("POR", "pt"),
  "RD Congo": teamAsset("COD", "cd"),
  Senegal: teamAsset("SEN", "sn"),
  Suécia: teamAsset("SWE", "se"),
  Suíça: teamAsset("SUI", "ch"),
  Tchéquia: teamAsset("CZE", "cz"),
  Tunísia: teamAsset("TUN", "tn"),
  Turquia: teamAsset("TUR", "tr"),
  Uruguai: teamAsset("URU", "uy"),
  Uzbequistão: teamAsset("UZB", "uz")
};

export function getTeamAsset(teamName: string) {
  return assets[teamName] ?? { code: teamName.slice(0, 3).toUpperCase(), flag: "🏳️" };
}
