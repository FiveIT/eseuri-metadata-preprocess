import { red } from "deps";

/**
 * Transforms a string to Titlecase
 * 
 * @param s The string to transform.
 * @param locales Locales to use.
 * @returns The transformed string.
 */
export function titleCase(s: string, locales?: string | string[]): string {
  return (
    s.charAt(0).toLocaleUpperCase(locales) +
    s.slice(1).toLocaleLowerCase(locales)
  );
}

function getPermissionLocation(descriptor: Deno.PermissionDescriptor) {
  switch (descriptor.name) {
    case "env":
    case "hrtime":
    case "plugin":
    case "run":
      return "";
    case "net":
      return ` ${descriptor.host}`;
    case "read":
    case "write":
      return ` ${descriptor.path}`;
  }
}

/**
 * Requests the specified permission and, if rejected, exits the program.
 * 
 * @param descriptor The permission descriptor
 */
export async function requestPermissions(
  ...descriptors: Readonly<Deno.PermissionDescriptor>[]
) {
  for (const descriptor of descriptors) {
    const { state } = await Deno.permissions.request(descriptor);
    if (state !== "granted") {
      const { name } = descriptor;
      const location = getPermissionLocation(descriptor);
      console.error(
        red(`${titleCase(name)} permission for${location} is required!`),
      );
      Deno.exit(1);
    }
  }
}

export function invertDictionary<K extends PropertyKey, V extends PropertyKey>(
  dict: Record<K, V>,
): Record<V, K> {
  return Object.fromEntries(Object.entries(dict).map(([k, v]) => [v, k]));
}
