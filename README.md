# PSQR DID Resolver

This library is intended to represent domains accessed through https as
[Decentralized Identifiers](https://w3c.github.io/did-core/#identifier)
and retrieve an associated [DID Document](https://w3c.github.io/did-core/#did-document-properties)

It supports the proposed [`did:psqr` method spec](https://vpsqr.com/did-method-psqr/v1/).

It requires the `did-resolver` library, which is the primary interface for resolving DIDs.

## DID method

To encode a DID for an HTTPS domain, simply prepend `did:psqr:` to domain name.

eg: `https://example.com -> did:psqr:example.com`

## DID Document

The DID resolver takes the domain and forms a [well-known URI](https://tools.ietf.org/html/rfc5785)
to access the DID Document.

For a did `did:psqr:example.com`, the resolver will attempt to access the document at
`https://example.com/.well-known/psqr`

A minimal DID Document might contain the following information:

```json
{
    "@context": [
        "https://www.w3.org/ns/did/v1",
        "https://vpsqr.com/ns/did-psqr/v1"
    ],
    "id": "did:psqr:id.ology.com/joe-test",
    "psqr": {
        "publicIdentity": {
            "name": "Joe Test"
        },
        "publicKeys": [
            {
                "kty": "EC",
                "x": "GSswmWMS8j-KXycyyKUZ5MZ4Zf6u-oJ4WJ2BVnTG_ZFBPt1tAdZ_aVNmWAJ-9CeW",
                "y": "fmhXHl66obOeGW1hDOtqBrdf1OKFL1jXmSTtZ7d9piPDPrAfwYYRoez7yEBUuG7o",
                "crv": "P-384",
                "alg": "ES384",
                "kid": "did:psqr:id.ology.com/joe-test#publish"
            }
        ],
        "permissions": [
            {
                "grant": [
                    "publish",
                    "provenance"
                ],
                "kid": "did:psqr:id.ology.com/joe-test#publish"
            }
        ],
        "updated": 1649247931161
    }
}
```

## Resolving a DID document

The resolver presents a simple `resolver()` function that returns a ES6 Promise returning the DID document.

```js
import { Resolver } from 'did-resolver'
import { getResolver } from 'psqr-did-resolver'

const psqrResolver = getResolver()

const didResolver = new Resolver({
    ...psqrResolver
    //...you can flatten multiple resolver methods into the Resolver
})

didResolver.resolve('did:psqr:id.ology.com/joe-test').then(doc => console.log(doc))

// You can also use ES7 async/await syntax
;(async () => {
    const doc = await didResolver.resolve('did:psqr:id.ology.com/joe-test')
    console.log(doc)
})();
```
