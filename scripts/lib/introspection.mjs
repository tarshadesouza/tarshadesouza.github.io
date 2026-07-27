/**
 * The GraphQL introspection queries used to discover Cloudflare's analytics
 * schema, kept apart from the report so they can be validated in tests.
 *
 * These are queries *about* a schema, so they only ever touch GraphQL's own
 * meta-types — `__Schema`, `__Type`, `__Field`, `__InputValue`. Those are
 * identical on every GraphQL server in existence, which means a test can check
 * these queries against the spec's meta-schema and catch a wrong field name
 * without any network access at all.
 *
 * That check exists because guessing at names in this file has been wrong
 * three times: `accounts` at the query root instead of under `viewer`, a type
 * assumed to be called `Account`, and a `type` selection placed on `__Type`
 * itself rather than on each field. All three parsed cleanly and all three
 * failed against the live API.
 */

/** JSON.stringify doubles as GraphQL string-literal quoting. */
const q = (value) => JSON.stringify(value);

/**
 * A type reference, unwrapped far enough to see through the `[Thing!]!`
 * wrappers Cloudflare uses. Three levels covers every shape in their schema.
 */
export const TYPE_REF =
  'type { name kind ofType { name kind ofType { name kind ofType { name } } } }';

/** The name of the root query type — the entry point for walking the schema. */
export const schemaRootQuery = () => '{ __schema { queryType { name } } }';

/** The fields of a named type, each with the type it resolves to. */
export const typeFieldsQuery = (typeName) =>
  `{ __type(name: ${q(typeName)}) { name fields { name ${TYPE_REF} } } }`;

/** The arguments each field of a type accepts — used to find the filter input. */
export const fieldArgsQuery = (typeName) =>
  `{ __type(name: ${q(typeName)}) { fields { name args { name ${TYPE_REF} } } } }`;

/** The keys of an input object — i.e. the valid filter keys. */
export const inputFieldsQuery = (typeName) =>
  `{ __type(name: ${q(typeName)}) { inputFields { name } } }`;

/** Unwrap NonNull/List wrappers down to the named type inside. */
export const named = (type) => {
  let t = type;
  while (t && !t.name) t = t.ofType;
  return t?.name ?? null;
};
