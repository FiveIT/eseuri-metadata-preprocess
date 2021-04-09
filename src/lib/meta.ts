import { log, sqlutil } from "lib";
import { readCSVObjects } from "deps";

export default async function* (
  reader: Deno.Reader,
): AsyncGenerator<sqlutil.Input> {
  for await (const row of readCSVObjects(reader)) {
    log.verbose("Before:", row);
    const obj = Object.fromEntries(
      Object.entries(row).map((
        [key, value],
      ) => [
        key,
        key === "id" || key.endsWith("_id") ? parseInt(value) : value,
      ]),
    );
    log.verbose("After:", obj);
    yield obj;
  }
}
