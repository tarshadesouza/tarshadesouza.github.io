/**
 * Validates the introspection queries against GraphQL's meta-schema.
 *
 * Parsing a query only proves it is well-formed; it says nothing about whether
 * the fields exist. `validate()` is the part that catches a wrong name, and
 * because introspection touches only the spec's own meta-types, it works
 * against any schema — no Cloudflare access required. This test fails on the
 * exact bug that reached CI: `type` selected on `__Type`, which has no such
 * field.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSchema, parse, validate } from 'graphql';

import {
  schemaRootQuery,
  typeFieldsQuery,
  fieldArgsQuery,
  inputFieldsQuery,
  named,
} from './introspection.mjs';

/**
 * Any schema will do: `__schema` and `__type` are built into every one of
 * them, and they are all this file selects.
 */
const schema = buildSchema('type Query { placeholder: String }');

const check = (query) => validate(schema, parse(query)).map((e) => e.message);

const QUERIES = {
  schemaRootQuery: schemaRootQuery(),
  typeFieldsQuery: typeFieldsQuery('Account'),
  fieldArgsQuery: fieldArgsQuery('Account'),
  inputFieldsQuery: inputFieldsQuery('AccountFilter'),
};

for (const [name, query] of Object.entries(QUERIES)) {
  test(`${name} is valid against the meta-schema`, () => {
    assert.deepEqual(check(query), [], `${name} produced:\n${query}`);
  });
}

test('type names are quoted as GraphQL string literals', () => {
  // A stray quote in a type name would otherwise change the query's shape.
  assert.match(typeFieldsQuery('Ac"count'), /name: "Ac\\"count"/);
});

test('the meta-schema check actually rejects a bad field', () => {
  // Guards the guard: if this ever passes, validate() has stopped doing its
  // job and every assertion above is worthless. This is the precise mistake
  // that shipped — `type` belongs on a field, not on __Type.
  const bad = '{ __type(name: "Query") { type { name } fields { name } } }';
  const errors = check(bad);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /Cannot query field "type" on type "__Type"/);
});

test('named() sees through NonNull and List wrappers', () => {
  const wrapped = {
    name: null,
    kind: 'NON_NULL',
    ofType: { name: null, kind: 'LIST', ofType: { name: 'RumGroups', kind: 'OBJECT' } },
  };
  assert.equal(named(wrapped), 'RumGroups');
  assert.equal(named({ name: 'String', kind: 'SCALAR' }), 'String');
  assert.equal(named(null), null);
});
