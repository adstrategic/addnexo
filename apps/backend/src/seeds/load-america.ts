import "dotenv/config";

import { prisma } from "@repo/db";
import { parse } from "csv-parse";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CSV_DIR = path.resolve(__dirname, "../../csv");
const LOOKUP_BATCH_SIZE = 500;
const INSERT_BATCH_SIZE = 1_000;

interface CountryCSV {
  id: string;
  iso2: string;
  name: string;
}

interface StateCSV {
  country_id: string;
  id: string;
  name: string;
}

interface CityCSV {
  name: string;
  state_id: string;
}

async function loadCSV(filePath: string) {
  return new Promise<any[]>((resolve, reject) => {
    const records: any[] = [];
    fs.createReadStream(filePath)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on("data", (row) => records.push(row))
      .on("end", () => {
        resolve(records);
      })
      .on("error", reject);
  });
}

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  if (chunkSize <= 0) {
    throw new Error("chunkSize must be greater than 0");
  }

  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

async function main() {
  const startTime = Date.now();
  console.log("Iniciando carga de países, estados y ciudades...");

  // 1. Cargar países (batch)
  const countries = (await loadCSV(
    path.join(CSV_DIR, "countries.csv"),
  )) as CountryCSV[];
  const countryIdMap: Record<string, number> = {};
  const normalizedCountries = countries
    .filter((country) => country.iso2 && country.name)
    .map((country) => ({
      csvId: country.id,
      code: country.iso2.trim().toUpperCase(),
      name: country.name.trim(),
    }));

  const uniqueCountryCodes = Array.from(
    new Set(normalizedCountries.map((country) => country.code)),
  );
  const existingCountriesByCode = new Map<
    string,
    { codigo: string; id: number }
  >();
  for (const chunk of chunkArray(uniqueCountryCodes, LOOKUP_BATCH_SIZE)) {
    const foundCountries = await prisma.pais.findMany({
      where: { codigo: { in: chunk }, organizationId: null },
      select: { id: true, codigo: true },
    });
    for (const country of foundCountries) {
      existingCountriesByCode.set(country.codigo.toUpperCase(), country);
    }
  }

  const missingCountries = normalizedCountries.filter(
    (country) => !existingCountriesByCode.has(country.code),
  );

  if (missingCountries.length > 0) {
    console.log(`Creando ${missingCountries.length} países nuevos...`);
    for (const chunk of chunkArray(missingCountries, INSERT_BATCH_SIZE)) {
      await prisma.pais.createMany({
        data: chunk.map((country) => ({
          nombre: country.name,
          codigo: country.code,
        })),
      });
    }
  } else {
    console.log("Todos los países ya existen.");
  }

  for (const chunk of chunkArray(uniqueCountryCodes, LOOKUP_BATCH_SIZE)) {
    const refreshedCountries = await prisma.pais.findMany({
      where: { codigo: { in: chunk }, organizationId: null },
      select: { id: true, codigo: true },
    });
    for (const country of refreshedCountries) {
      existingCountriesByCode.set(country.codigo.toUpperCase(), country);
    }
  }

  for (const country of normalizedCountries) {
    const persistedCountry = existingCountriesByCode.get(country.code);
    if (persistedCountry) {
      countryIdMap[country.csvId] = persistedCountry.id;
    }
  }
  console.log(`Países procesados: ${Object.keys(countryIdMap).length}`);

  // 2. Cargar estados (batch)
  const states = (await loadCSV(
    path.join(CSV_DIR, "states.csv"),
  )) as StateCSV[];
  const stateIdMap: Record<string, number> = {};
  const stateRows = states
    .map((state) => {
      const paisId = countryIdMap[state.country_id];
      if (!paisId || !state.name) return null;
      return {
        csvId: state.id,
        nombre: state.name.trim(),
        paisId,
      };
    })
    .filter((state): state is NonNullable<typeof state> => Boolean(state));

  if (stateRows.length > 0) {
    console.log(`Insertando/actualizando ${stateRows.length} estados...`);
    for (const chunk of chunkArray(stateRows, INSERT_BATCH_SIZE)) {
      await prisma.estado.createMany({
        data: chunk.map((state) => ({
          nombre: state.nombre,
          paisId: state.paisId,
        })),
        skipDuplicates: true,
      });
    }
  } else {
    console.log("No hay estados válidos para insertar.");
  }

  const involvedCountryIds = Array.from(
    new Set(stateRows.map((state) => state.paisId)),
  );
  const statesByKey = new Map<string, number>();
  for (const chunk of chunkArray(involvedCountryIds, LOOKUP_BATCH_SIZE)) {
    const persistedStates = await prisma.estado.findMany({
      where: { paisId: { in: chunk } },
      select: { id: true, nombre: true, paisId: true },
    });
    for (const state of persistedStates) {
      statesByKey.set(`${state.nombre}::${state.paisId}`, state.id);
    }
  }

  for (const state of stateRows) {
    const persistedStateId = statesByKey.get(
      `${state.nombre}::${state.paisId}`,
    );
    if (persistedStateId) {
      stateIdMap[state.csvId] = persistedStateId;
    }
  }
  console.log(`Estados procesados: ${Object.keys(stateIdMap).length}`);

  // 3. Cargar ciudades (batch + chunking para evitar payload gigante)
  const cities = (await loadCSV(path.join(CSV_DIR, "cities.csv"))) as CityCSV[];

  const cityData: { estadoId: number; nombre: string }[] = [];
  for (const city of cities) {
    const estadoId = stateIdMap[city.state_id];
    if (!estadoId) continue;
    if (!city.name) continue;
    cityData.push({ nombre: city.name.trim(), estadoId });
  }

  console.log(
    `Insertando/actualizando ${cityData.length} ciudades en lotes...`,
  );
  const cityChunks = chunkArray(cityData, INSERT_BATCH_SIZE);
  for (const [i, cityChunk] of cityChunks.entries()) {
    await prisma.ciudad.createMany({
      data: cityChunk,
      skipDuplicates: true,
    });
    if ((i + 1) % 25 === 0 || i === cityChunks.length - 1) {
      console.log(`Lote de ciudades ${i + 1}/${cityChunks.length} completado`);
    }
  }

  console.log(`Carga completada en ${(Date.now() - startTime) / 1000}s`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
