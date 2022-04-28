import { DIDDocument, DIDResolutionResult, DIDResolver, ParsedDID } from 'did-resolver'
import axios from 'axios'

import { Did } from './types/identity'

const DOC_PATH = '/.well-known/psqr'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function get(url: string): Promise<any> {
  // set required accept headers
  const config = {
    headers: {
      accept: 'application/json,application/did+json',
    },
  }

  // retrieve and validate DID from url
  const res = await axios.get(url, config)
  if (res.status >= 400) {
    throw new Error(`Bad response ${res.statusText}`)
  }
  return res.data
}

export function getResolver(): Record<string, DIDResolver> {
  async function resolve(did: string, parsed: ParsedDID): Promise<DIDResolutionResult> {
    let err = null
    let path = decodeURIComponent(parsed.id) + DOC_PATH
    const id = parsed.id.split(':')
    if (id.length > 1) {
      path = id.map(decodeURIComponent).join('/')
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

      const docIdMatchesDid = didDocument?.id === did
      if (!docIdMatchesDid) {
        err = 'resolver_error: DID document id does not match requested did'
      }

      // validate did format
      try {
        Did.check(didDocument)
      } catch (error) {
        err = `resolver_error: DID document is not in a valid format: ${error}`
        break
      }

      // eslint-disable-next-line no-constant-condition
    } while (false)

    const contentType =
      typeof didDocument?.['@context'] !== 'undefined' ? 'application/did+ld+json' : 'application/did+json'

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
