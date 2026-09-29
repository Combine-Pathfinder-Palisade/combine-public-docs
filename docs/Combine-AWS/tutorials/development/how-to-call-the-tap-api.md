# Call the TAP API

The TAP API is the HTTPS API behind the TAP Dashboard. You can use it to script Dashboard tasks: manage Users, Servers, Groups and AWS Roles, sign certificates, review Alert Events, read partition and configuration data, and (when enabled) request temporary AWS credentials through the CAP / SCAP compatible endpoints.

Every endpoint, parameter and response is documented in the **Combine API** section of this site. This page covers what you need to make your first call. For a worked example of one endpoint, see [PKI Certificates: CSR Signing API](../../start-here/10-advanced-features/pki-certificates-csr-signing-api.md).

### Base URL

TAP API paths start with `/tap/api/v1/`. (The CAP / SCAP compatible endpoints use `/api/v1/`, `/api/v2/` and `/cap/gxCAP/`.) Send requests over HTTPS on port 443 to a TAP host name:

- **From your workstation**: use the User Portal URL in `dashboard.txt` in your Credential Package. This is the DNS name of the TAP External Load Balancer, for example `https://<load balancer name>.elb.<region>.amazonaws.com/`.
- **From inside a Combine VPC**: if your Combine Deployment emulates C2S or SC2S, the emulated TAP host name resolves to the TAP Internal Load Balancer. This is `cap.cia.ic.gov` for C2S and `geoaxis.nga.smil.mil` for SC2S.

For example: `https://cap.cia.ic.gov/tap/api/v1/users/current`

The TAP server certificate is issued by your Combine Certificate Authority, so your client must trust `certificates/ca-chain.cert.pem` from your Credential Package. Connect with a host name, not an IP address, so host name verification succeeds.

### Authentication

The TAP API uses mutual TLS. There is no login, token or session. Every request must present your Personal Certificate from your Credential Package: either `certificates/<username>.cert.pem` with `certificates/<username>.key.pem`, or `certificates/<username>.p12`. (`<username>` is your User name in lowercase, with everything except letters, digits and `_` removed.)

- **Identity**: the certificate's serial number is your User Id. TAP looks up the User on every request, so a new User can call the API as soon as they have their Credential Package, and a deactivated User is blocked from their next request. `GET /tap/api/v1/users/current` returns the User that your certificate maps to.
- **Roles**: every User has one of three roles: `user`, `admin` or `super_admin`. Administrative endpoints require `admin`, and `super_admin` passes every role check. Some endpoints also let a `user` act on their own record, for example `GET /tap/api/v1/users/{userId}` with their own User Id. Only a Super Admin can act on a Super Admin User. A request without the required role gets a `403`.
- **Authentication failures**: some requests fail authentication: a request with no client certificate, a revoked certificate, an unknown or inactive User, or a request sent over plain HTTP. These requests do not get a JSON error. TAP returns its HTML error page ("Combine Dashboard Error") with status `200`. TAP asks for a client certificate during the TLS handshake but does not require one, so the handshake itself succeeds. In scripts, treat a response from a JSON endpoint without a `Content-Type` of `application/json` as an authentication failure.

The OCSP responder (`/tap/api/v1/certificate/ocsp`) and the health check (`GET /combine/api/health`) do not require a client certificate.

### Required Headers

| Header | When | Value |
| --- | --- | --- |
| `X-Requested-By` | Every method except `GET` and `HEAD` | Any value. TAP only checks that the header is present. If it is missing, TAP returns `400` with an empty body. The OCSP responder does not need it. |
| `Content-Type` | Requests with a JSON body | `application/json`. Most endpoints only accept JSON. `curl -d` sends `application/x-www-form-urlencoded` by default, and TAP rejects that with `415`. |
| `Accept` | Optional | curl and Python `requests` send `*/*` by default, which works everywhere. If you set `Accept`, include `application/json`. Also include `text/plain` for Reference Data (`GET /tap/api/v1/reference-data/{id}`) and CSR signing. If `Accept` is only `text/html`, TAP rejects the request with `406`. |

### Examples

Run these commands from the folder where you unzipped your Credential Package. First, set the TAP host name and read the Credential Package password. The password file starts with a literal `Password: ` prefix, which is not part of the password:

```sh
TAP="https://<TAP host name>"
PASSWORD="$(sed 's/^Password: //' certificates/<username>_password.txt)"
```

Get the current User. In the response, `data.id` is your User Id:

```sh
curl --cacert certificates/ca-chain.cert.pem \
  --cert certificates/<username>.cert.pem \
  --key certificates/<username>.key.pem \
  "$TAP/tap/api/v1/users/current"
```

Create a Group. This requires the `admin` role. Because it is a `POST`, it needs `X-Requested-By`:

```sh
curl --cacert certificates/ca-chain.cert.pem \
  --cert certificates/<username>.cert.pem \
  --key certificates/<username>.key.pem \
  -X POST \
  -H "X-Requested-By: curl" \
  -H "Content-Type: application/json" \
  -d '{"name": "Example Group", "accountIds": ["111122223333"]}' \
  "$TAP/tap/api/v1/groups"
```

#### Encrypted Private Key

By default, `<username>.key.pem` is not encrypted. Some Combine Deployments set the `combine.tap.certificates.user.key.encrypted` Configuration Value to `true`. In that case, the key is encrypted with your Credential Package password. Pass the password with `--pass "$PASSWORD"` (otherwise curl prompts for it), or decrypt the key once and use the decrypted copy:

```sh
openssl pkey -in certificates/<username>.key.pem -passin "pass:$PASSWORD" -out <username>.decrypted.key.pem
```

Keep the decrypted key private.

#### PKCS12

You can also authenticate with the `.p12` file instead of the PEM files:

```sh
curl --cacert certificates/ca-chain.cert.pem \
  --cert-type P12 --cert "certificates/<username>.p12:$PASSWORD" \
  "$TAP/tap/api/v1/users/current"
```

_NOTE: The `.p12` file encrypts its certificates with the legacy RC2-40 algorithm. OpenSSL 3 cannot read it without its legacy provider, so a curl built with OpenSSL 3 may reject it. If that happens, use the PEM files._

#### Python

`requests` needs an unencrypted private key. (If your key is encrypted, use the decrypted copy from above.)

```python
import requests

TAP = "https://<TAP host name>"

session = requests.Session()
session.cert = ("certificates/<username>.cert.pem", "certificates/<username>.key.pem")
session.verify = "certificates/ca-chain.cert.pem"

response = session.get(f"{TAP}/tap/api/v1/users/current")
response.raise_for_status()
if not response.headers.get("Content-Type", "").startswith("application/json"):
    raise RuntimeError("TAP returned its HTML error page: the certificate was not accepted.")
print(response.json()["data"]["id"])

response = session.post(f"{TAP}/tap/api/v1/groups", json={"name": "Example Group"}, headers={"X-Requested-By": "python"})
print(response.json())
```

### Errors

Error responses come in three shapes:

| Source | Body |
| --- | --- |
| TAP endpoints (`/tap/api/v1/...`) | `{"success": false, "message": "..."}` |
| CAP / SCAP endpoints (`/api/v1/...`, `/api/v2/...`, `/cap/gxCAP/...`) | `{"status": 400, "message": "..."}` |
| Authentication failure (any path) | HTML error page with status `200` (see [Authentication](#authentication)) |

Endpoints that return plain text, such as CSR signing and Reference Data, return most of their errors as plain text.

Common status codes:

- `400`: `X-Requested-By` is missing (empty body), or a parameter or identifier is invalid.
- `403`: the User does not have the required role, or the target User is a Super Admin and the caller is not.
- `404`: the resource does not exist, or the feature is disabled. A disabled feature returns `{"success": false, "message": "API not enabled."}`. A disabled OCSP responder returns `404` without a JSON body, and an unknown path returns an HTML "not found" page.
- `413`: the upload is too large. A CloudFormation Template sent to `POST /tap/api/v1/tools/analyze/cloudformation/template` is limited by `combine.tap.tools.analyzeCloudFormationTemplate.byteLimit` (default `2097152` bytes). A CSR sent to `POST /tap/api/v1/admin/certificate/custom` is limited by `combine.tap.api.certificates.signCustomCSR.byteLimit` (default `65536` bytes).

### Feature Flags

Some endpoints are disabled unless a Configuration Value turns them on. See [Edit Combine Configuration Values](../operations/how-to-edit-combine-configuration.md) to change one.

| Configuration Value | Default | Endpoints it enables |
| --- | --- | --- |
| `combine.tap.api.cap.enable` | `false` (`true` by default in a Combine Deployment that emulates C2S) | `GET /api/v1/credentials`, `GET /api/v1/accounts/{accountId}/activity`, `GET /api/v1/accounts/{accountId}/trailevents`, `GET /api/v2/user/accesslist` |
| `combine.tap.api.scap.enable` | `false` (`true` by default in a Combine Deployment that emulates SC2S) | `GET /cap/gxCAP/getTemporaryCredentials`, `GET /cap/gxCAP/getAccessList` |
| `combine.tap.api.certificates.signCustomCSR.enable` | `false` | `POST /tap/api/v1/admin/certificate/custom` |
| `combine.tap.certificates.ocsp` | `false` | `POST /tap/api/v1/certificate/ocsp`, `GET /tap/api/v1/certificate/ocsp/{request}` |
| `combine.tap.application.feature.metadata` | `false` | `GET /tap/api/v1/metadata/api-handler-status`, `GET /tap/api/v1/metadata/all-configurations` |
| `combine.tap.application.feature.tools.analyzeCloudFormationTemplate` | `false` | `POST /tap/api/v1/tools/analyze/cloudformation/template` |
| `combine.tap.application.feature.tools.firewallRules` | `true` | `GET` and `POST /tap/api/v1/tools/firewall-rules` |
| `combine.tap.tools.workloadHealth.enable` | `false` | `GET` and `POST /tap/api/v1/tools/workload-health` |

Some endpoints check the role before the flag: CSR signing, firewall rules, and the workload health `POST`. On these endpoints, a caller without the `admin` role gets `403` even when the feature is disabled.
