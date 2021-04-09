export type Input = Record<string, string | number>;

/**
 * Writes INSERT statements to the specified writer.
 * 
 * @param table The SQL table to create the queries for.
 * @param input The new table rows.
 * @param writer The writer to write to.
 */
export default async function (
  table: string,
  input: Iterable<Input> | AsyncIterable<Input>,
  writer: Deno.Writer,
): Promise<void> {
  const encoder = new TextEncoder();

  for await (const row of input) {
    const columns = Object.entries(row).filter(([, value]) =>
      value === 0 || value
    );
    const keys = columns.map(([header]) => `"${header}"`).join(", ");
    const values = columns.map(([, column]) =>
      typeof column === "number" ? column : `'${column}'`
    ).join(", ");
    const query = encoder.encode(
      `INSERT INTO "${table}" (${keys}) VALUES (${values});\n`,
    );
    await writer.write(query);
  }
}

/**
 * Transforms a dictionary, of which keys are the rows' IDs and the values are
 * the rows' other columns, to an array of rows.
 * 
 * @param dict The dictionary to transform.
 * @returns The rows.
 */
export function* fromDictionary(
  dict: Record<string | number, Input>,
): Generator<Input> {
  for (const [id, row] of Object.entries(dict)) {
    yield {
      id,
      ...row,
    };
  }
}

/**
 * Transforms a record, of which keys are the rows' IDs and the values are the
 * rows' names, to an array of rows with the columns `id` and `name`.
 * 
 * @param record The record to transform.
 * @returns The rows.
 */
export function* fromStringRecord(
  record: Record<string | number, string>,
): Generator<Input> {
  for (const [id, name] of Object.entries(record)) {
    yield {
      id,
      name,
    };
  }
}
