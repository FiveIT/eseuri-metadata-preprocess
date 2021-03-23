export type Input = Record<string, string>;

/**
 * Writes INSERT statements to the specified writer.
 * 
 * @param table The SQL table to create the queries for.
 * @param input The new table rows.
 * @param writer The writer to write to.
 */
export default async function (
  table: string,
  input: Input[],
  writer: Deno.Writer,
): Promise<void> {
  const encoder = new TextEncoder();

  for (const row of input) {
    const headers = Object.keys(row), columns = Object.values(row);
    const keys = headers.map((header) => `"${header}"`).join(", ");
    const values = columns.map((column) => `'${column}'`).join(", ");
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
export function fromDictionary(dict: Record<string | number, Input>): Input[] {
  return Object.entries(dict).map(([id, row]) => ({ id, ...row }));
}

/**
 * Transforms a record, of which keys are the rows' IDs and the values are the
 * rows' names, to an array of rows with the columns `id` and `name`.
 * 
 * @param record The record to transform.
 * @returns The rows.
 */
export function fromStringRecord(
  record: Record<string | number, string>,
): Input[] {
  return Object.entries(record).map(([id, name]) => ({ id, name }));
}