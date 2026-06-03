import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type FixtureSeed = {
  matchNumber: number;
  groupCode: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  city: string;
  matchDateUtc: string;
};

const teamNamesPt: Record<string, string> = {
  Algeria: "Argélia",
  Argentina: "Argentina",
  Australia: "Austrália",
  Austria: "Áustria",
  Belgium: "Bélgica",
  "Bosnia and Herzegovina": "Bósnia e Herzegovina",
  Brazil: "Brasil",
  Canada: "Canadá",
  "Cape Verde": "Cabo Verde",
  Colombia: "Colômbia",
  Croatia: "Croácia",
  Curacao: "Curaçao",
  Czechia: "Tchéquia",
  "DR Congo": "RD Congo",
  Ecuador: "Equador",
  Egypt: "Egito",
  England: "Inglaterra",
  France: "França",
  Germany: "Alemanha",
  Ghana: "Gana",
  Haiti: "Haiti",
  Iran: "Irã",
  Iraq: "Iraque",
  "Ivory Coast": "Costa do Marfim",
  Japan: "Japão",
  Jordan: "Jordânia",
  Mexico: "México",
  Morocco: "Marrocos",
  Netherlands: "Holanda",
  "New Zealand": "Nova Zelândia",
  Norway: "Noruega",
  Panama: "Panamá",
  Paraguay: "Paraguai",
  Portugal: "Portugal",
  Qatar: "Catar",
  "Saudi Arabia": "Arábia Saudita",
  Scotland: "Escócia",
  Senegal: "Senegal",
  "South Africa": "África do Sul",
  "South Korea": "Coreia do Sul",
  Spain: "Espanha",
  Sweden: "Suécia",
  Switzerland: "Suíça",
  Tunisia: "Tunísia",
  Turkiye: "Turquia",
  Uruguay: "Uruguai",
  Uzbekistan: "Uzbequistão",
  "United States": "Estados Unidos"
};

function teamNamePt(teamName: string) {
  return teamNamesPt[teamName] ?? teamName;
}

function lockAtUtc(matchDateUtc: string) {
  return new Date(new Date(matchDateUtc).getTime() - 60 * 60 * 1000);
}

const bonusLockAtUtc = new Date("2026-06-11T17:00:00.000Z");

const bonusQuestions = [
  {
    title: "Campeão",
    description: "Quem será o campeão da Copa?",
    points: 20
  },
  {
    title: "Vice-campeão",
    description: "Quem será o vice-campeão?",
    points: 12
  },
  {
    title: "Artilheiro",
    description: "Quem será o artilheiro da competição?",
    points: 15
  },
  {
    title: "Melhor ataque",
    description: "Qual seleção fará mais gols na Copa?",
    points: 10
  }
];

// Initial group-stage schedule based on FIFA's official calendar page and
// cross-checked with FourFourTwo's fixture list updated on 2026-04-08.
const fixtures: FixtureSeed[] = [
  { matchNumber: 1, groupCode: "A", homeTeam: "Mexico", awayTeam: "South Africa", venue: "Estadio Azteca", city: "Mexico City", matchDateUtc: "2026-06-11T18:00:00.000Z" },
  { matchNumber: 2, groupCode: "A", homeTeam: "South Korea", awayTeam: "Czechia", venue: "Estadio Akron", city: "Zapopan", matchDateUtc: "2026-06-12T01:00:00.000Z" },
  { matchNumber: 3, groupCode: "B", homeTeam: "Canada", awayTeam: "Bosnia and Herzegovina", venue: "BMO Field", city: "Toronto", matchDateUtc: "2026-06-12T19:00:00.000Z" },
  { matchNumber: 4, groupCode: "D", homeTeam: "United States", awayTeam: "Paraguay", venue: "SoFi Stadium", city: "Inglewood", matchDateUtc: "2026-06-13T01:00:00.000Z" },
  { matchNumber: 5, groupCode: "B", homeTeam: "Qatar", awayTeam: "Switzerland", venue: "Levi's Stadium", city: "Santa Clara", matchDateUtc: "2026-06-13T19:00:00.000Z" },
  { matchNumber: 6, groupCode: "C", homeTeam: "Brazil", awayTeam: "Morocco", venue: "Gillette Stadium", city: "Foxborough", matchDateUtc: "2026-06-13T22:00:00.000Z" },
  { matchNumber: 7, groupCode: "C", homeTeam: "Haiti", awayTeam: "Scotland", venue: "MetLife Stadium", city: "East Rutherford", matchDateUtc: "2026-06-14T01:00:00.000Z" },
  { matchNumber: 8, groupCode: "D", homeTeam: "Australia", awayTeam: "Turkiye", venue: "BC Place", city: "Vancouver", matchDateUtc: "2026-06-14T04:00:00.000Z" },
  { matchNumber: 9, groupCode: "E", homeTeam: "Germany", awayTeam: "Curacao", venue: "NRG Stadium", city: "Houston", matchDateUtc: "2026-06-14T17:00:00.000Z" },
  { matchNumber: 10, groupCode: "F", homeTeam: "Netherlands", awayTeam: "Japan", venue: "AT&T Stadium", city: "Arlington", matchDateUtc: "2026-06-14T20:00:00.000Z" },
  { matchNumber: 11, groupCode: "E", homeTeam: "Ivory Coast", awayTeam: "Ecuador", venue: "Lincoln Financial Field", city: "Philadelphia", matchDateUtc: "2026-06-14T23:00:00.000Z" },
  { matchNumber: 12, groupCode: "F", homeTeam: "Sweden", awayTeam: "Tunisia", venue: "Estadio BBVA", city: "Guadalupe", matchDateUtc: "2026-06-15T01:00:00.000Z" },
  { matchNumber: 13, groupCode: "H", homeTeam: "Spain", awayTeam: "Cape Verde", venue: "Mercedes-Benz Stadium", city: "Atlanta", matchDateUtc: "2026-06-15T16:00:00.000Z" },
  { matchNumber: 14, groupCode: "G", homeTeam: "Belgium", awayTeam: "Egypt", venue: "Lumen Field", city: "Seattle", matchDateUtc: "2026-06-15T19:00:00.000Z" },
  { matchNumber: 15, groupCode: "H", homeTeam: "Saudi Arabia", awayTeam: "Uruguay", venue: "Hard Rock Stadium", city: "Miami Gardens", matchDateUtc: "2026-06-15T22:00:00.000Z" },
  { matchNumber: 16, groupCode: "G", homeTeam: "Iran", awayTeam: "New Zealand", venue: "SoFi Stadium", city: "Inglewood", matchDateUtc: "2026-06-16T01:00:00.000Z" },
  { matchNumber: 17, groupCode: "I", homeTeam: "France", awayTeam: "Senegal", venue: "MetLife Stadium", city: "East Rutherford", matchDateUtc: "2026-06-16T19:00:00.000Z" },
  { matchNumber: 18, groupCode: "I", homeTeam: "Iraq", awayTeam: "Norway", venue: "Gillette Stadium", city: "Foxborough", matchDateUtc: "2026-06-16T22:00:00.000Z" },
  { matchNumber: 19, groupCode: "J", homeTeam: "Argentina", awayTeam: "Algeria", venue: "Arrowhead Stadium", city: "Kansas City", matchDateUtc: "2026-06-17T01:00:00.000Z" },
  { matchNumber: 20, groupCode: "J", homeTeam: "Austria", awayTeam: "Jordan", venue: "Levi's Stadium", city: "Santa Clara", matchDateUtc: "2026-06-17T04:00:00.000Z" },
  { matchNumber: 21, groupCode: "L", homeTeam: "England", awayTeam: "Croatia", venue: "AT&T Stadium", city: "Arlington", matchDateUtc: "2026-06-17T20:00:00.000Z" },
  { matchNumber: 22, groupCode: "L", homeTeam: "Ghana", awayTeam: "Panama", venue: "BMO Field", city: "Toronto", matchDateUtc: "2026-06-17T23:00:00.000Z" },
  { matchNumber: 23, groupCode: "K", homeTeam: "Portugal", awayTeam: "DR Congo", venue: "NRG Stadium", city: "Houston", matchDateUtc: "2026-06-17T17:00:00.000Z" },
  { matchNumber: 24, groupCode: "K", homeTeam: "Uzbekistan", awayTeam: "Colombia", venue: "Estadio Azteca", city: "Mexico City", matchDateUtc: "2026-06-18T01:00:00.000Z" },
  { matchNumber: 25, groupCode: "A", homeTeam: "Czechia", awayTeam: "South Africa", venue: "Mercedes-Benz Stadium", city: "Atlanta", matchDateUtc: "2026-06-18T16:00:00.000Z" },
  { matchNumber: 26, groupCode: "B", homeTeam: "Switzerland", awayTeam: "Bosnia and Herzegovina", venue: "SoFi Stadium", city: "Inglewood", matchDateUtc: "2026-06-18T19:00:00.000Z" },
  { matchNumber: 27, groupCode: "B", homeTeam: "Canada", awayTeam: "Qatar", venue: "BC Place", city: "Vancouver", matchDateUtc: "2026-06-18T22:00:00.000Z" },
  { matchNumber: 28, groupCode: "A", homeTeam: "Mexico", awayTeam: "South Korea", venue: "Estadio Akron", city: "Zapopan", matchDateUtc: "2026-06-19T00:00:00.000Z" },
  { matchNumber: 29, groupCode: "D", homeTeam: "United States", awayTeam: "Australia", venue: "Lumen Field", city: "Seattle", matchDateUtc: "2026-06-19T19:00:00.000Z" },
  { matchNumber: 30, groupCode: "C", homeTeam: "Scotland", awayTeam: "Morocco", venue: "Lincoln Financial Field", city: "Philadelphia", matchDateUtc: "2026-06-19T22:00:00.000Z" },
  { matchNumber: 31, groupCode: "D", homeTeam: "Turkiye", awayTeam: "Paraguay", venue: "Levi's Stadium", city: "Santa Clara", matchDateUtc: "2026-06-20T04:00:00.000Z" },
  { matchNumber: 32, groupCode: "C", homeTeam: "Brazil", awayTeam: "Haiti", venue: "Gillette Stadium", city: "Foxborough", matchDateUtc: "2026-06-20T01:00:00.000Z" },
  { matchNumber: 33, groupCode: "E", homeTeam: "Germany", awayTeam: "Ivory Coast", venue: "BMO Field", city: "Toronto", matchDateUtc: "2026-06-20T20:00:00.000Z" },
  { matchNumber: 34, groupCode: "F", homeTeam: "Netherlands", awayTeam: "Sweden", venue: "NRG Stadium", city: "Houston", matchDateUtc: "2026-06-20T17:00:00.000Z" },
  { matchNumber: 35, groupCode: "E", homeTeam: "Ecuador", awayTeam: "Curacao", venue: "Arrowhead Stadium", city: "Kansas City", matchDateUtc: "2026-06-21T00:00:00.000Z" },
  { matchNumber: 36, groupCode: "F", homeTeam: "Tunisia", awayTeam: "Japan", venue: "Estadio BBVA", city: "Guadalupe", matchDateUtc: "2026-06-21T03:00:00.000Z" },
  { matchNumber: 37, groupCode: "H", homeTeam: "Spain", awayTeam: "Saudi Arabia", venue: "Mercedes-Benz Stadium", city: "Atlanta", matchDateUtc: "2026-06-21T16:00:00.000Z" },
  { matchNumber: 38, groupCode: "G", homeTeam: "Belgium", awayTeam: "Iran", venue: "SoFi Stadium", city: "Inglewood", matchDateUtc: "2026-06-21T19:00:00.000Z" },
  { matchNumber: 39, groupCode: "H", homeTeam: "Uruguay", awayTeam: "Cape Verde", venue: "Hard Rock Stadium", city: "Miami Gardens", matchDateUtc: "2026-06-21T22:00:00.000Z" },
  { matchNumber: 40, groupCode: "G", homeTeam: "New Zealand", awayTeam: "Egypt", venue: "BC Place", city: "Vancouver", matchDateUtc: "2026-06-22T01:00:00.000Z" },
  { matchNumber: 41, groupCode: "J", homeTeam: "Argentina", awayTeam: "Austria", venue: "AT&T Stadium", city: "Arlington", matchDateUtc: "2026-06-22T17:00:00.000Z" },
  { matchNumber: 42, groupCode: "I", homeTeam: "France", awayTeam: "Iraq", venue: "Lincoln Financial Field", city: "Philadelphia", matchDateUtc: "2026-06-22T21:00:00.000Z" },
  { matchNumber: 43, groupCode: "I", homeTeam: "Norway", awayTeam: "Senegal", venue: "MetLife Stadium", city: "East Rutherford", matchDateUtc: "2026-06-23T00:00:00.000Z" },
  { matchNumber: 44, groupCode: "J", homeTeam: "Jordan", awayTeam: "Algeria", venue: "Levi's Stadium", city: "Santa Clara", matchDateUtc: "2026-06-23T03:00:00.000Z" },
  { matchNumber: 45, groupCode: "K", homeTeam: "Portugal", awayTeam: "Uzbekistan", venue: "NRG Stadium", city: "Houston", matchDateUtc: "2026-06-23T17:00:00.000Z" },
  { matchNumber: 46, groupCode: "L", homeTeam: "England", awayTeam: "Ghana", venue: "Gillette Stadium", city: "Foxborough", matchDateUtc: "2026-06-23T20:00:00.000Z" },
  { matchNumber: 47, groupCode: "L", homeTeam: "Panama", awayTeam: "Croatia", venue: "BMO Field", city: "Toronto", matchDateUtc: "2026-06-23T23:00:00.000Z" },
  { matchNumber: 48, groupCode: "K", homeTeam: "Colombia", awayTeam: "DR Congo", venue: "Estadio Akron", city: "Zapopan", matchDateUtc: "2026-06-24T01:00:00.000Z" },
  { matchNumber: 49, groupCode: "B", homeTeam: "Switzerland", awayTeam: "Canada", venue: "BC Place", city: "Vancouver", matchDateUtc: "2026-06-24T19:00:00.000Z" },
  { matchNumber: 50, groupCode: "B", homeTeam: "Bosnia and Herzegovina", awayTeam: "Qatar", venue: "Lumen Field", city: "Seattle", matchDateUtc: "2026-06-24T19:00:00.000Z" },
  { matchNumber: 51, groupCode: "C", homeTeam: "Scotland", awayTeam: "Brazil", venue: "Hard Rock Stadium", city: "Miami Gardens", matchDateUtc: "2026-06-24T22:00:00.000Z" },
  { matchNumber: 52, groupCode: "C", homeTeam: "Morocco", awayTeam: "Haiti", venue: "Mercedes-Benz Stadium", city: "Atlanta", matchDateUtc: "2026-06-24T22:00:00.000Z" },
  { matchNumber: 53, groupCode: "A", homeTeam: "Czechia", awayTeam: "Mexico", venue: "Estadio Azteca", city: "Mexico City", matchDateUtc: "2026-06-25T00:00:00.000Z" },
  { matchNumber: 54, groupCode: "A", homeTeam: "South Africa", awayTeam: "South Korea", venue: "Estadio BBVA", city: "Guadalupe", matchDateUtc: "2026-06-25T00:00:00.000Z" },
  { matchNumber: 55, groupCode: "E", homeTeam: "Curacao", awayTeam: "Ivory Coast", venue: "Lincoln Financial Field", city: "Philadelphia", matchDateUtc: "2026-06-25T20:00:00.000Z" },
  { matchNumber: 56, groupCode: "E", homeTeam: "Ecuador", awayTeam: "Germany", venue: "MetLife Stadium", city: "East Rutherford", matchDateUtc: "2026-06-25T20:00:00.000Z" },
  { matchNumber: 57, groupCode: "F", homeTeam: "Japan", awayTeam: "Sweden", venue: "AT&T Stadium", city: "Arlington", matchDateUtc: "2026-06-25T23:00:00.000Z" },
  { matchNumber: 58, groupCode: "F", homeTeam: "Tunisia", awayTeam: "Netherlands", venue: "Arrowhead Stadium", city: "Kansas City", matchDateUtc: "2026-06-25T23:00:00.000Z" },
  { matchNumber: 59, groupCode: "D", homeTeam: "Turkiye", awayTeam: "United States", venue: "SoFi Stadium", city: "Inglewood", matchDateUtc: "2026-06-26T02:00:00.000Z" },
  { matchNumber: 60, groupCode: "D", homeTeam: "Paraguay", awayTeam: "Australia", venue: "Levi's Stadium", city: "Santa Clara", matchDateUtc: "2026-06-26T02:00:00.000Z" },
  { matchNumber: 61, groupCode: "I", homeTeam: "Norway", awayTeam: "France", venue: "Gillette Stadium", city: "Foxborough", matchDateUtc: "2026-06-26T19:00:00.000Z" },
  { matchNumber: 62, groupCode: "I", homeTeam: "Senegal", awayTeam: "Iraq", venue: "BMO Field", city: "Toronto", matchDateUtc: "2026-06-26T19:00:00.000Z" },
  { matchNumber: 63, groupCode: "H", homeTeam: "Cape Verde", awayTeam: "Saudi Arabia", venue: "NRG Stadium", city: "Houston", matchDateUtc: "2026-06-27T00:00:00.000Z" },
  { matchNumber: 64, groupCode: "H", homeTeam: "Uruguay", awayTeam: "Spain", venue: "Estadio Akron", city: "Zapopan", matchDateUtc: "2026-06-26T23:00:00.000Z" },
  { matchNumber: 65, groupCode: "G", homeTeam: "Egypt", awayTeam: "Iran", venue: "Lumen Field", city: "Seattle", matchDateUtc: "2026-06-27T03:00:00.000Z" },
  { matchNumber: 66, groupCode: "G", homeTeam: "New Zealand", awayTeam: "Belgium", venue: "BC Place", city: "Vancouver", matchDateUtc: "2026-06-27T03:00:00.000Z" },
  { matchNumber: 67, groupCode: "L", homeTeam: "Panama", awayTeam: "England", venue: "MetLife Stadium", city: "East Rutherford", matchDateUtc: "2026-06-27T21:00:00.000Z" },
  { matchNumber: 68, groupCode: "L", homeTeam: "Croatia", awayTeam: "Ghana", venue: "Lincoln Financial Field", city: "Philadelphia", matchDateUtc: "2026-06-27T21:00:00.000Z" },
  { matchNumber: 69, groupCode: "K", homeTeam: "Colombia", awayTeam: "Portugal", venue: "Hard Rock Stadium", city: "Miami Gardens", matchDateUtc: "2026-06-27T23:30:00.000Z" },
  { matchNumber: 70, groupCode: "K", homeTeam: "DR Congo", awayTeam: "Uzbekistan", venue: "Mercedes-Benz Stadium", city: "Atlanta", matchDateUtc: "2026-06-27T23:30:00.000Z" },
  { matchNumber: 71, groupCode: "J", homeTeam: "Algeria", awayTeam: "Austria", venue: "Arrowhead Stadium", city: "Kansas City", matchDateUtc: "2026-06-28T02:00:00.000Z" },
  { matchNumber: 72, groupCode: "J", homeTeam: "Jordan", awayTeam: "Argentina", venue: "AT&T Stadium", city: "Arlington", matchDateUtc: "2026-06-28T02:00:00.000Z" }
];

async function main() {
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL ?? "admin@bolao.local";
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD ?? "Admin@2026";
  const inviteCode = (process.env.DEFAULT_INVITE_CODE ?? "COPA2026").toUpperCase();

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Administrador",
      nickname: "Admin",
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: "ADMIN"
    }
  });

  await prisma.inviteCode.upsert({
    where: { code: inviteCode },
    update: { isActive: true },
    create: {
      code: inviteCode,
      label: "Convite principal do bolao",
      isActive: true
    }
  });

  for (const fixture of fixtures) {
    await prisma.match.upsert({
      where: { matchNumber: fixture.matchNumber },
      update: {
        homeTeam: teamNamePt(fixture.homeTeam),
        awayTeam: teamNamePt(fixture.awayTeam),
        groupCode: fixture.groupCode,
        stage: "GROUP_STAGE",
        venue: fixture.venue,
        city: fixture.city,
        matchDateUtc: new Date(fixture.matchDateUtc),
        lockAtUtc: lockAtUtc(fixture.matchDateUtc)
      },
      create: {
        matchNumber: fixture.matchNumber,
        homeTeam: teamNamePt(fixture.homeTeam),
        awayTeam: teamNamePt(fixture.awayTeam),
        groupCode: fixture.groupCode,
        stage: "GROUP_STAGE",
        venue: fixture.venue,
        city: fixture.city,
        matchDateUtc: new Date(fixture.matchDateUtc),
        lockAtUtc: lockAtUtc(fixture.matchDateUtc)
      }
    });
  }

  for (const question of bonusQuestions) {
    await prisma.bonusQuestion.upsert({
      where: { title: question.title },
      update: {
        description: question.description,
        points: question.points,
        lockAtUtc: bonusLockAtUtc,
        isActive: true
      },
      create: {
        title: question.title,
        description: question.description,
        points: question.points,
        lockAtUtc: bonusLockAtUtc,
        isActive: true
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
