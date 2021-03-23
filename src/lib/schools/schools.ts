import { normalize } from "./util.ts";
import { log } from "lib";
import { path, readCSVObjects } from "deps";

const INPUT_FILE = path.join("data", "schools.csv");

interface School {
  "name": string;
  "short_name"?: string;
  "county_id": string;
}

/**
 * Returns all the schools in Romania, by fetching the file at data/schools.csv.
 * 
 * @param counties A lookup table to replace counties with their county ID.
 * @returns The fetched schools.
 */
export default async function* (
  counties?: Record<string, string>,
): AsyncGenerator<School> {
  const file = await Deno.open(INPUT_FILE, {
    read: true,
  });
  const csv = readCSVObjects(file, {
    lineSeparator: "\r\n",
    columnSeparator: ";",
    quote: `"`,
  });

  for await (const school of csv) {
    log.verbose(school);

    const name = normalize(school["name"]);
    let shortName: string | undefined = normalize(school["short_name"]);
    if (name === shortName) {
      shortName = undefined;
    }
    const inputCounty = normalize(school["county_id"]);
    const countyID = counties?.[inputCounty] || inputCounty;

    log.verbose({ name, shortName, countyID });

    yield {
      name,
      short_name: shortName,
      county_id: countyID,
    };
  }

  Deno.close(file.rid);
}
