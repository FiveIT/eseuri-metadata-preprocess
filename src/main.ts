import {
  fetchCounties,
  fetchSchools,
  invertDictionary,
  log,
  requestPermissions,
  sql,
  sqlutil,
} from "lib";
import { blue, fs, green, path } from "deps";

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
);

const INPUT_FILE = path.join("data", "schools.csv");
const OUTPUT_DIR = "output";
const OUTPUT_FILE = path.join(OUTPUT_DIR, "metadata.sql");

if (Deno.args.length > 0) {
  log.isVerbose(true);
}

let input: Deno.File | undefined;
let output: Deno.File | undefined;

try {
  log.essential(blue("Fetching counties..."));
  const counties = await fetchCounties();
  const countiesData = sqlutil.fromStringRecord(counties);
  const countiesInverted = invertDictionary(counties);
  log.essential(green("Counties fetched successfully!"));

  log.essential(blue("Fetching schools..."));
  input = await Deno.open(INPUT_FILE, {
    read: true,
  });
  const schools = fetchSchools(input, countiesInverted);
  log.essential(green("Schools fetched successfully!"));

  log.essential(blue("Creating output dir..."));
  await fs.ensureDir(OUTPUT_DIR);
  output = await Deno.create(OUTPUT_FILE);
  log.essential(green("Output dir created successfully!"));

  log.essential(blue("Wwriting SQL statements..."));
  await sql("counties", countiesData, output);
  await sql("schools", schools as AsyncIterable<sqlutil.Input>, output);
  log.essential(green("SQL statements written successfully!"));
} catch (err) {
  console.error(err);

  if (output) {
    await Deno.remove(OUTPUT_DIR, {
      recursive: true,
    });
  }
} finally {
  if (input) {
    Deno.close(input.rid);
  }
  if (output) {
    Deno.close(output.rid);
  }
}
