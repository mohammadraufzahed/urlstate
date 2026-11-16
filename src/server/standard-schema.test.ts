import { describe, expect, it } from 'vitest'
import { createStandardSchemaV1 } from '@/server/standard-schema'
import { parseAsInteger, parseAsString } from '@/parsers/index'

describe('createStandardSchemaV1', () => {
  const parsers = { page: parseAsInteger.withDefault(1), q: parseAsString }

  it('validates search params', () => {
    const schema = createStandardSchemaV1(parsers)
    expect(schema['~standard'].vendor).toBe('urlstate')
    expect(schema['~standard'].validate('?page=2')).toEqual({ value: { page: 2, q: null } })
    const failed = schema['~standard'].validate('?page=x')
    expect('issues' in failed && failed.issues?.length).toBe(1)
  })

  it('supports partial output', () => {
    const schema = createStandardSchemaV1(parsers, { partialOutput: true })
    expect(schema['~standard'].validate('?q=a')).toEqual({ value: { page: 1, q: 'a' } })
    expect(schema['~standard'].validate('')).toEqual({ value: { page: 1 } })
  })
})
