import { Resolver, DIDDocument, Resolvable } from 'did-resolver'
import { getResolver } from '../resolver'
import fetch from 'cross-fetch'
import didDocument from './test-identity.json';
jest.mock('cross-fetch')
const mockedFetch = jest.mocked(fetch, true)

describe('psqr did resolver', () => {
  const did: string = 'did:psqr:id.ology.com/joe-test'
  const didRoot: string = 'did:psqr:id.ology.com'
  const kid: string = 'did:psqr:id.ology.com/joe-test#publish'
  const validContentType = 'application/json'
  const validResponse: DIDDocument = didDocument
  const invalidDidDocument = {
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://vpsqr.com/ns/did-psqr/v1"
    ],
    "id": "did:psqr:id.ology.com/joe-test",
    "publicIdentity": {
      "name": "Joe Test"
    }
  }

  let didResolver: Resolvable

  beforeAll(async () => {
    didResolver = new Resolver(getResolver())
  })

  beforeEach(() => {
    mockedFetch.mockClear()
  })

  it('resolves document', async () => {
    expect.assertions(2)
    mockedFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(validResponse),
    } as Response)
    const result = await didResolver.resolve(did)
    expect(result.didDocument).toEqual(validResponse)
    expect(result.didResolutionMetadata.httpsUrl).toEqual('https://id.ology.com/joe-test')
  })

  it('resolves document with trailing slash', async () => {
    expect.assertions(2)
    mockedFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(validResponse),
    } as Response)
    const result = await didResolver.resolve(did + '/')
    expect(result.didDocument).toEqual(validResponse)
    expect(result.didResolutionMetadata.httpsUrl).toEqual('https://id.ology.com/joe-test')
  })

  it('resolves document with key fragment', async () => {
    expect.assertions(2)
    mockedFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(validResponse),
    } as Response)
    const result = await didResolver.resolve(kid)
    expect(result.didDocument).toEqual(validResponse)
    expect(result.didResolutionMetadata.httpsUrl).toEqual('https://id.ology.com/joe-test')
  })

  it('resolves document with root did', async () => {
    expect.assertions(2)
    const validResponseRoot: DIDDocument = JSON.parse(JSON.stringify(validResponse).replace(did, didRoot))
    mockedFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(validResponseRoot),
    } as Response)
    const result = await didResolver.resolve(didRoot)
    expect(result.didDocument).toEqual(validResponseRoot)
    expect(result.didResolutionMetadata.httpsUrl).toEqual('https://id.ology.com/.well-known/psqr')
  })

  it('fails if the did is not a valid https url', async () => {
    expect.assertions(1)
    mockedFetch.mockRejectedValueOnce({ status: 404 })
    const result = await didResolver.resolve(did)
    expect(result.didResolutionMetadata.error).toEqual('notFound')
  })

  it('fails if the did document is not valid json', async () => {
    expect.assertions(2)
    mockedFetch.mockResolvedValueOnce({
      json: () => Promise.reject(new Error('unable to parse json')),
    } as Response)
    const result = await didResolver.resolve(did)
    expect(result.didResolutionMetadata.error).toEqual('notFound')
    expect(result.didResolutionMetadata.message).toMatch(/unable to parse json/)
  })

  it('fails if the web server produces an error', async () => {
    expect.assertions(2)
    mockedFetch.mockResolvedValueOnce({
      status: 400,
    } as Response)
    const result = await didResolver.resolve(did)
    expect(result.didResolutionMetadata.error).toEqual('notFound')
    expect(result.didResolutionMetadata.message).toMatch(
      /DID must resolve to a valid https URL containing a JSON document: Error: Bad response/
    )
  })

  it('fails if the did document id does not match', async () => {
    expect.assertions(2)
    const wrongIdResponse: DIDDocument = {
      ...validResponse,
      id: 'did:psqr:wrong.com',
    }
    mockedFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(wrongIdResponse),
    } as Response)
    const result = await didResolver.resolve(did)
    expect(result.didResolutionMetadata.error).toEqual('notFound')
    expect(result.didResolutionMetadata.message).toMatch(/DID document id does not match requested did/)
  })

  it('fails if didDocument is not structured correctly', async () => {
    expect.assertions(2)
    const invalidStructureResponse: DIDDocument = {
      ...invalidDidDocument,
    }
    mockedFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(invalidStructureResponse),
    } as Response)
    const result = await didResolver.resolve(did)
    expect(result.didResolutionMetadata.error).toEqual('notFound')
    expect(result.didResolutionMetadata.message).toMatch(/Invalid DID:PSQR document returned: .+/)
  })
})
