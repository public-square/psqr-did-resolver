import { String } from 'runtypes'

const Url = String.withConstraint((str) => {
  try {
    new URL(str)
    return true
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return error.message
  }
})

const DID = String.withConstraint(
  (str) =>
    /did:psqr:[A-Za-z0-9.\-_/%]+$/g.test(str) ||
    'Invalid DID PSQR specified. Expected format: did:psqr:{hostname}/{path}'
)

const KID = String.withConstraint(
  (str) =>
    /did:psqr:[A-Za-z0-9.\-_/%]+#\w+$/g.test(str) ||
    'Invalid KID PSQR specified. Expected format: did:psqr:{hostname}/{path}#{keyId}'
)

export { Url, DID, KID }
