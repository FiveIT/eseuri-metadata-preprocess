import { log } from "lib";
import { readCSVObjects, readerFromStreamReader } from "deps";

const COUNTIES_URL =
  "https://gist.githubusercontent.com/tmaxmax/167f784be942789804d58f804fa3c8a0/raw/00de7589d8f7f3409b654412ebbd08f553a73869/coduri-judete.csv";

export type Counties = Record<string, string>;

/**
 * Returns all the counties in Romania, by fetching the following Github gist:
 * https://gist.github.com/mgax/7468143.
 * 
 * @param timeout Time in milliseconds after which to abort the request.
 * @returns The fetched counties.
 */
export default async function (signal?: AbortSignal): Promise<Counties> {
  const { body, ok, status, statusText, text } = await fetch(COUNTIES_URL, {
    signal,
  });

  if (!ok) {
    throw new Error(JSON.stringify({
      status,
      statusText,
      text: await text(),
    }));
  }

  const reader = readerFromStreamReader(body!.getReader());
  const csv = readCSVObjects(reader);

  const judete: Counties = {};

  for await (const judet of csv) {
    const id = judet["cod"];
    const name = judet["județ"];

    log.verbose({ id, name });

    if (!id || !name) {
      throw new Error(
        `Counties CSV schema changed, row looks like: ${JSON.stringify(judet)}`,
      );
    }

    judete[id] = name;
  }

  return judete;
}
