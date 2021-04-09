import { titleCase } from "lib";

const letterRegex = /[a-z0-9áéóőöăâîșț]/i;

function isLetter(l: string): boolean {
  return letterRegex.test(l);
}

function isQuote(l: string): boolean {
  return l === '"' || l === "'" || l === "’" || l === "”" || l === "„" ||
    l === "“" || l === "’";
}

function isComma(l: string): boolean {
  return l === ",";
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

function isLine(l: string): boolean {
  return l === "-" || l === "–" || l === "—";
}

function isUnderscore(l: string): boolean {
  return l === "_";
}

function isParenthesis(l: string): boolean {
  return l === "(" || l === ")";
}

function isNotLetter(l: string): boolean {
  return isBlank(l) || isShorthand(l) || isQuote(l) || isLine(l) ||
    isComma(l) || isParenthesis(l);
}

const cedilaLookup = {
  "ţ": "ț",
  "Ţ": "Ț",
  "ş": "ș",
  "Ş": "Ș",
} as const;

type Cedila = keyof (typeof cedilaLookup);

function prenormalize(s: string): string {
  let i = 0;

  const skip = () => {
    const begin = i;
    while (
      !isUnderscore(s[i]) && !(s[i] in cedilaLookup) && i < s.length
    ) {
      i++;
    }
    return s.slice(begin, i);
  };

  let ret = "";
  while (true) {
    ret += skip();
    if (i === s.length) {
      return ret;
    } else if (isUnderscore(s[i])) {
      ret += ". ";
    } else {
      // skip stops on either underscore or cedila character,
      // so here s[i] is surely Cedila.
      ret += cedilaLookup[s[i] as Cedila];
    }
    i++;
  }
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
 * assertEquals(normalized, 'Colegiul „Aurel Vijoi” Făgăraș');
 * 
 * @param s The string to normalize.
 * @returns The normalized string.
 */
export function normalize(s: string): string {
  s = prenormalize(s);

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
      } else if (isComma(first)) {
        ret += `${w}, `;
      }

      let mid = nw;
      let midTrim = nw;
      if (mid.length > 2) {
        mid = mid.slice(1, -1);
      }
      if (mid.length > 1) {
        midTrim = mid.trim();
      }

      if (isLine(midTrim)) {
        ret += w;
        if (mid === midTrim) {
          ret += "-";
        } else {
          ret += "—";
        }
      }

      const last = nw[nw.length - 1];

      if (isQuote(last)) {
        const begin = i;
        skipWhile((l) => !isQuote(l));
        if (!wasShorthand) {
          ret += `${w} `;
        }
        // TODO: remove recursion, as preprocess runs twice
        ret += `${QUOTE_OPEN}${normalize(s.slice(begin, i))}${QUOTE_CLOSE}`;
        i++;
        skipWhile(isQuote);
        const next = nextPred(isNotLetter);
        if (isBlankString(next)) {
          ret += " ";
        } else {
          ret += `${next.trim()} `;
        }
      }
    }
  }

  return ret.trimRight();
}
