import { GraphQLScalarType, Kind, type ValueNode } from 'graphql'

function parseJsonLiteral(ast: ValueNode): unknown {
  switch (ast.kind) {
    case Kind.STRING:
      try {
        return JSON.parse(ast.value) as unknown
      } catch {
        return ast.value
      }
    case Kind.INT:
    case Kind.FLOAT:
      return Number(ast.value)
    case Kind.BOOLEAN:
      return ast.value
    case Kind.NULL:
      return null
    case Kind.LIST:
      return ast.values.map(parseJsonLiteral)
    case Kind.OBJECT:
      return Object.fromEntries(
        ast.fields.map((field) => [field.name.value, parseJsonLiteral(field.value)])
      )
    default:
      return null
  }
}

export const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'Arbitrary JSON value',
  serialize: (value: unknown): unknown => value,
  parseValue: (value: unknown): unknown => value,
  parseLiteral: parseJsonLiteral,
})
