import {
  fetchCounties,
  fetchMeta,
  fetchSchools,
  invertDictionary,
  log,
  requestPermissions,
  sql,
  sqlutil,
} from "lib";
import { blue, bold, fs, green, path, red } from "deps";

const inspect = (fn: (value: unknown) => void) =>
  <T>(value: T): T => {
    fn(value);
    return value;
  };

if (Deno.args.length > 0) {
  log.setVerbose(true);
}

await requestPermissions(
  {
    name: "net",
    host: "gist.githubusercontent.com",
  },
  {
    name: "read",
    path: "data",
  },
  {
    name: "read",
    path: "output",
  },
  {
    name: "write",
    path: "output",
  },
  {
    name: "read",
    path: "tmp",
  },
  {
    name: "write",
    path: "tmp",
  },
);

const METADATA_FILENAMES = "schools,authors,titles,characters".split(",");
const TMP_DIR = "tmp";
const OUTPUT_DIR = "output";
const OUTPUT_FILENAME = path.join(OUTPUT_DIR, "metadata.sql");

let metadata: Deno.File[] | undefined;
let schools: Deno.File | undefined;
let tempOutput: Deno.File[] | undefined;
let output: Deno.File | undefined;

try {
  log.essential(blue("Opening and creating required files..."));
  [[schools, ...metadata], tempOutput, output] = await Promise.all([
    Promise.all(
      METADATA_FILENAMES
        .map((name) => path.join("data", `${name}.csv`))
        .map((file) => Deno.open(file, { read: true })),
    ).then(
      inspect(() =>
        log.essential(green("Opened metadata dataset input files!"))
      ),
    ),
    fs.ensureDir(TMP_DIR).then(() =>
      Promise.all(
        METADATA_FILENAMES.map((name) => Deno.create(path.join(TMP_DIR, name))),
      )
    ).then(
      inspect(() => log.essential(green("Created temporary output files!"))),
    ),
    fs.ensureFile(OUTPUT_FILENAME).then(() =>
      Deno.open(OUTPUT_FILENAME, { write: true })
    ).then(inspect(() => log.essential(green("Created output file!")))),
  ]);

  log.essential(blue("Fetching counties..."));
  const counties = await fetchCounties();
  const countiesData = sqlutil.fromStringRecord(counties);
  log.essential(green("Counties fetched successfully!"));

  log.essential(blue("Writing SQL statements to temporary files..."));
  await Promise.all([
    sql("counties", countiesData, output),
    ...metadata.map((input, i) =>
      sql(METADATA_FILENAMES[i + 1], fetchMeta(input), tempOutput![i + 1])
    ),
    sql(
      METADATA_FILENAMES[0],
      fetchSchools(schools, invertDictionary(counties)) as AsyncIterable<
        sqlutil.Input
      >,
      tempOutput[0],
    ),
  ]);
  log.essential(green("SQL statements written to temp successfully!"));

  log.essential(blue("Writing SQL statements to final output file..."));
  await Promise.all(
    tempOutput.map(({ rid }) => Deno.seek(rid, 0, Deno.SeekMode.Start)),
  );
  for (const temp of tempOutput) {
    await Deno.copy(temp, output);
  }
  log.essential(bold(green("Finished!")));
} catch (err) {
  log.essential(bold(red("An error occurred:")));
  log.essential(red(err));

  if (output) {
    Deno.close(output.rid);
    await Deno.remove(OUTPUT_DIR, { recursive: true });
  }
} finally {
  if (metadata) {
    metadata.forEach(({ rid }) => Deno.close(rid));
  }
  if (schools) {
    Deno.close(schools.rid);
  }
  if (tempOutput) {
    tempOutput.forEach(({ rid }) => Deno.close(rid));
    await Deno.remove(TMP_DIR, { recursive: true });
  }
  if (output) {
    Deno.close(output.rid);
  }
}
