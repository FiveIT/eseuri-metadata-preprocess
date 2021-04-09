import { sqlutil } from "lib";
import { readCSVObjects } from "deps";

export default async function* (
  reader: Deno.Reader,
): AsyncGenerator<sqlutil.Input> {
  for await (const row of readCSVObjects(reader)) {
    yield row;
  }
}
