import { titleCase } from "lib";

const letterRegex = /[a-zăâîșț]/i;

function isLetter(l: string): boolean {
  return letterRegex.test(l);
}

function isQuote(l: string): boolean {
  return l === '"' || l === "'" || l === "’";
}

function isBlank(l: string): boolean {
  return l === " ";
}

function isBlankString(s: string): boolean {
  for (let i = 0; i < s.length; i++) {
    if (!isBlank(s[i])) {
      return false;
    }
  }
  return true;
}

function isShorthand(l: string): boolean {
  return l === ".";
}

function isNotLetter(l: string): boolean {
  return isBlank(l) || isQuote(l) || isShorthand(l);
}

const cedilaLookup = Object.freeze({
  "ţ": "ț",
  "Ţ": "Ț",
  "ş": "ș",
  "Ş": "Ș",
});

type Cedila = keyof (typeof cedilaLookup);

function normalizeCedilas(s: string): string {
  let i = 0;

  const skip = () => {
    const begin = i;
    // Satisfy Typescript, this will always be undefined
    while (!cedilaLookup[s[i] as Cedila] && i < s.length) {
      i++;
    }
    return s.slice(begin, i);
  };

  let ret = "";
  while (i < s.length) {
    ret += skip();
    ret += cedilaLookup[s[i] as Cedila] || "";
    i++;
  }
  return ret;
}

const excludeFromTitle = /^(a|ale|de|și)$/i;
const locale = "ro-RO";

function title(w: string): string {
  if (w.match(excludeFromTitle)) {
    return w.toLocaleLowerCase(locale);
  }
  return titleCase(w, locale);
}

const QUOTE_OPEN = "„";
const QUOTE_CLOSE = "”";

/**
 * Normalizes the given string, as required by
 * the input in data/schools.csv.
 * 
 * @example
 * const input = "COLEGIUL   'Aurel Vijoi' Făgăraș";
 * const normalized = normalize(input);
 * assertEquals(normalized, 'Colegiul "Aurel Vijoi" Făgăraș');
 * 
 * @param s The string to normalize.
 * @returns The normalized string.
 */
export function normalize(s: string): string {
  s = normalizeCedilas(s);

  let i = 0;

  type Predicate = (l: string) => boolean;

  const skipWhile = (pred: Predicate) => {
    while (pred(s[i]) && i < s.length) {
      i++;
    }
  };

  const nextPred = (pred: Predicate): string => {
    const begin = i;
    skipWhile(pred);
    return s.slice(begin, i);
  };

  const next = () => {
    const word = nextPred(isLetter);
    const nonWord = nextPred(isNotLetter);
    if (word === nonWord) {
      throw new Error(`Unknown character ${s[i]}`);
    }
    return [title(word), nonWord];
  };

  let ret = "";
  let shouldPrependSpace = false;
  while (i < s.length) {
    const [w, nw] = next();
    if (isBlankString(nw)) {
      if (shouldPrependSpace) {
        ret += " ";
        shouldPrependSpace = false;
      }
      ret += `${w} `;
    } else {
      const first = nw[0];
      let wasShorthand = false;
      if (isShorthand(first)) {
        wasShorthand = true;
        ret += `${w}.`;
        if (w.length !== 1) {
          ret += " ";
        } else {
          shouldPrependSpace = true;
        }
      }

      const last = nw[nw.length - 1];

      if (isQuote(last)) {
        const begin = i;
        skipWhile((l) => !isQuote(l));
        if (!wasShorthand) {
          ret += `${w} `;
        }
        ret += `${QUOTE_OPEN}${normalize(s.slice(begin, i))}${QUOTE_CLOSE}`;
        i++;
      }
    }
  }

  return ret.trimRight();
}
