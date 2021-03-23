import { assertEquals, assertStrictEquals } from "testing";

import { normalize } from "./util.ts";

Deno.test("school/util.normalize", () => {
  assertStrictEquals(
    normalize('Colegiul Economic "Costin C. Kiriţescu"'),
    "Colegiul Economic „Costin C. Kirițescu”",
  );
  assertStrictEquals(
    normalize('Col. Ec. "Costin C. Kiriţescu"'),
    "Col. Ec. „Costin C. Kirițescu”",
  );
  assertStrictEquals(
    normalize("COLEGIUL DE ARTE BAIA MARE"),
    "Colegiul de Arte Baia Mare",
  );
  assertStrictEquals(
    normalize('COLEGIUL DE ARTE "SABIN DRAGOI" ARAD'),
    "Colegiul de Arte „Sabin Dragoi” Arad",
  );
  assertStrictEquals(
    normalize("Colegiul   'Aurel Vijoli' Făgăraș"),
    "Colegiul „Aurel Vijoli” Făgăraș",
  );
  assertStrictEquals(
    normalize('Colegiul Național "C. D. Loga" Timișoara'),
    "Colegiul Național „C.D. Loga” Timișoara",
  );
  assertEquals(
    normalize('COLEGIUL AUTO "TRAIAN VUIA" TG-JIU'),
    "Colegiul Auto „Traian Vuia” Tg-Jiu",
  );
});
