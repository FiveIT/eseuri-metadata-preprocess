import { normalize } from "./util.ts";
import { log } from "lib";
import { readCSVObjects } from "deps";

interface School {
  "name": string;
  "short_name"?: string;
  "county_id": string;
}

/**
 * Returns all the schools in the given reader. It parses CSV.
 * 
 * @param reader The reader to read from.
 * @param counties A lookup table to replace counties with their county ID.
 * @returns The fetched schools.
 */
export default async function* (
  reader: Deno.Reader,
  counties?: Record<string, string>,
): AsyncGenerator<School> {
  const csv = readCSVObjects(reader, {
    lineSeparator: "\r\n",
    columnSeparator: ";",
    quote: `"`,
  });

  for await (const school of csv) {
    log.verbose("Before:", school);

    const obj: Partial<School> = {};

    const nameInput = school["name"];
    obj.name = normalize(nameInput);

    const shortNameInput = school["short_name"];
    if (nameInput !== shortNameInput) {
      obj.short_name = normalize(shortNameInput);
    }

    let countyInput = normalize(school["county_id"]);
    if (countyInput.includes("București")) {
      countyInput = "București";
    }
    if (counties && !(countyInput in counties)) {
      throw new Error(`County "${countyInput}" not in counties dictionary!`);
    }
    obj.county_id = counties?.[countyInput] || countyInput;

    log.verbose("After:", obj);
    log.verbose();

    yield obj as School;
  }
}
