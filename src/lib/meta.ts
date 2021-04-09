import { sqlutil } from "lib";
import { readCSVObjects } from "deps";

export default async function* (
  reader: Deno.Reader,
): AsyncGenerator<sqlutil.Input> {
  for await (const row of readCSVObjects(reader)) {
    yield Object.fromEntries(
      Object.entries(row).map((
        [key, value],
      ) => [
        key,
        key === "id" || key.endsWith("_id") ? parseInt(value) : value,
      ]),
    );
  }
}
