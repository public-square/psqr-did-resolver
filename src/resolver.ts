import fetch from 'cross-fetch'
import { DIDDocument, DIDResolutionResult, DIDResolver, ParsedDID } from 'did-resolver'

import { Did } from './types/identity'

const DOC_PATH = '/.well-known/psqr'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function get(url: string): Promise<any> {
  const res = await fetch(url, {
    mode: 'cors',
    headers: {
      Accept: 'application/json,application/did+json',
    },
    redirect: 'error',
  })

  if (res.status >= 400) {
    throw new Error(`Bad response ${res.statusText}`)
  }
  return res.json()
}

export function getResolver(): Record<string, DIDResolver> {
  async function resolve(did: string, parsed: ParsedDID): Promise<DIDResolutionResult> {
    let err = null
    // remove any url fragments
    let path = decodeURIComponent(parsed.id).replace(/[#\w]+/g, '')

    // if url path is not present, append path for root did
    const reg = /\/\w+/
    if (reg.test(path) === false) {
      path = path.replace(/\/?$/, DOC_PATH)
    }

    const url = `https://${path}`

    const didDocumentMetadata = {}
    let didDocument: DIDDocument | null = null

    do {
      try {
        didDocument = await get(url)
      } catch (error) {
        err = `resolver_error: DID must resolve to a valid https URL containing a JSON document: ${error}`
        break
      }

      // TODO: this excludes the use of query params
      const docIdMatchesDid = didDocument?.id === did
      if (!docIdMatchesDid) {
        err = 'resolver_error: DID document id does not match requested did'
        break
      }

      // validate did:psqr structure
      try {
        Did.check(didDocument)
      } catch (error: any) {
        err = `resolver_error: Invalid DID:PSQR document returned: ${error.details}`
        break
      }
      // eslint-disable-next-line no-constant-condition
    } while (false)

    const contentType = 'application/json,application/did+json'

    if (err) {
      return {
        didDocument,
        didDocumentMetadata,
        didResolutionMetadata: {
          error: 'notFound',
          message: err,
        },
      }
    } else {
      return {
        didDocument,
        didDocumentMetadata,
        didResolutionMetadata: { contentType },
      }
    }
  }

  return { psqr: resolve }
}
