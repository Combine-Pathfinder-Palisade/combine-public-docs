# Feature: PKI Certificates: OCSP Support

As of Bricks Version 3.13.2 Combine has support for OCSP and provdies an OCSP Responder Endpoint through the TAP Server.

## Configuration

To enable OCSP you set the following configuration value to `true`:

`combine.tap.certificates.ocsp`

If this is set then any User or Server/NPE certificates issued by TAP will include an AIA block listing the following OCSP Endpoints:

`ocsp.c2s.ic.gov`
`ocsp.sc2s.sgov.gov`

There are several additional configuration parameters:

`combine.tap.ocsp.responder.signerCertificate.cache.duration` which is how long in milliseconds to cache the Signer Certificate before refreshing it from S3. Defaults to 15 minutes.

`combine.tap.ocsp.responder.nextUpdate.duration` which is how long Combine advertises before the next update to OCSP. Defaults to 24 hours.

## Certificate Revocation

Combine supports Certificate Revocation by setting a configuration value for each revoked certificate.

`combine.tap.certificates.revocation.certificate.<serial number>.date` which is the epoch time in milliseconds at which the certificate was revoked.

The TAP Dashboard will respect certificate revocation during authentication.

## Notes

WARNING: Browsers are very very aggressive about enforcing OCSP for certificates and will not validate a certificate if they cannot reach at least one of the advertised OCSP Responder Endpoints. This means that if you use an OCSP Signed Certificate for a server, and try to reach that server with a client browser, the browser must have access to the OCSP Endpoint through Private DNS for your client.