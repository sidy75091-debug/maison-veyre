import test from "node:test";
import assert from "node:assert/strict";
import { swissDepartures } from "../src/swissTime.ts";
const iso=(date,time)=>swissDepartures(date,time).map(d=>d.toISOString());
test("Heure suisse : hiver, été et passages à l’heure d’été et d’hiver",()=>{
  assert.deepEqual(iso("2027-01-14","09:00"),["2027-01-14T08:00:00.000Z"]);
  assert.deepEqual(iso("2027-07-14","09:00"),["2027-07-14T07:00:00.000Z"]);
  assert.deepEqual(iso("2027-03-28","02:30"),[]);
  assert.deepEqual(iso("2027-10-31","02:30"),["2027-10-31T00:30:00.000Z","2027-10-31T01:30:00.000Z"]);
});
