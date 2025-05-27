# Feature: PKI Certificates: CSR Signing API

Combine provides an API for Signing CSR Requests. This API is not an emulation and is not available on the high side. It solely exists to facilitate customers who want to use a CSR but also do not want to manually upload each CSR to Combine.

To enable this API set the following configuration value to `true`:

`combine.tap.api.certificates.signCustomCSR.enable`

Once enabled, this API Endpoint is:

`<tap server>/tap/api/v1/admin/certificate/custom`

It accepts a CSR as the body of a request and returns the signed Certificate as PEM encoded text.

Here is an example command that is made from inside a Combine VPC:

`curl -X POST -H "X-Requested-By: Combine" --data-binary @csr.pem --cacert ca-chain.cert.pem --cert <username>.cert.pem:<password> --key <username>.key.pem "https://cap.cia.ic.gov/tap/api/v1/admin/certificate/custom"`

NOTE: You need to provide a CSRF X-Requested-By header.