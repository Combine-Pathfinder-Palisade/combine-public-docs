# View Combine Logs

## Overview

Combine can log detailed information about _every_ http request that it proxies. All logs are injected into three CloudWatch Log Groups:
- `Combine_Server_Endpoint` logs AWS Endpoint traffic (the Endpoint Server),
- `Combine_Firewall` logs traffic that the Combine Firewall alerts on or blocks, and
- `Combine_Server_TAP` logs the TAP Server (TAP Dashboard traffic).

If your Combine Deployment has a Shard ID, the Shard ID is included in each name (for example `Combine_<shard id>_Server_Endpoint`).

The Endpoint and TAP Log Groups hold Combine's application-level logging and the output of the servers themselves (see [Log Streams](#log-streams)). What Combine writes to them is controlled by the [Logging Configuration Values](#logging-configuration-values). By default a Combine Deployment does not log AWS API Calls that succeed (`2xx` responses). Each Log Group keeps log entries for 7 days.

Here are some guidelines to determine which Log Group to search in:
- If you are looking to find traffic that was blocked due to Combine's airgapping, look in the Firewall Log Group.
- If you are looking to find traffic relating to AWS Endpoint emulation, look at the Endpoint Log Group.
- If you are looking for User Management issues, look at the TAP Dashboard Log Group (unlikely).


## Log Streams

The Endpoint Server and TAP Server instances send their logs to CloudWatch with the Amazon CloudWatch Agent, which the server's bootstrap script installs. `Combine_Server_Endpoint` and `Combine_Server_TAP` use the same Log Stream names, built from the VPC Name of the Combine VPC (the `VpcName` parameter of the `combine-vpc.yaml` template, `Combine` by default):

| Log Stream | File on the instance | Contents |
|---|---|---|
| `<VpcName>` | `/opt/tomcat/logs/combine-log-*.log` | Combine's application-level log, one JSON log entry per line. The `type` field identifies the log entry, for example `transaction` for a request proxied by the Endpoint Server (see [Endpoint Logs](#endpoint-logs)), `token` for a credential request on the TAP Server, or `message` and `error` for other events. |
| `<VpcName>-Cloud-Init` | `/var/log/cloud-init-output.log` | Output of the bootstrap script that runs when the instance launches: installing Java, downloading the Combine release and certificates from the Combine DevOps bucket, installing NGINX (Endpoint Server only), creating and starting the server service, and installing the CloudWatch Agent. |
| `<VpcName>-Service` | `/opt/tomcat/logs/service.log` | Standard output of the Combine server process (the `endpoints` or `tap` systemd service). |
| `<VpcName>-Service-Error` | `/opt/tomcat/logs/service-error.log` | Standard error of the Combine server process: Tomcat's own log output (including normal startup messages) and Java stack traces. |
| `<VpcName>-NGINX-Error` | `/var/log/nginx/error.log` | NGINX error log. On the Endpoint Server, NGINX terminates TLS and forwards requests to Tomcat. The TAP Server does not run NGINX, so there is nothing to collect for this Log Stream in `Combine_Server_TAP`. |

The Log Stream names do not include the Shard ID or the instance ID, so every Endpoint Server instance in a VPC writes to the same Log Streams (and likewise every TAP Server instance).

When Combine runs in containers (see [Configure Combine on EKS](how-to-configure-combine-on-eks.md)), the bootstrap script does not install the CloudWatch Agent, and Combine writes its log entries to the container's standard output instead.

`Combine_Firewall` is written by AWS Network Firewall, not by a Combine server. The logging configuration of the Combine Firewall (in the `combine-vpc.yaml` template) sends its alert logs to this Log Group, and AWS Network Firewall creates and names the Log Streams. Flow logs are not sent, so only connections that match a Combine Firewall rule that alerts, rejects, or drops appear here (for example with the rule message `Combine Firewall Log`, `Reject HTTPS`, or `Drop UDP`).

### Where to look when a server fails to start

The bootstrap script stops at the first command that fails. It starts the server service without waiting for the server to finish starting, and installs the CloudWatch Agent after that. Check in this order:

1. **The instance's bootstrap output never appears in `<VpcName>-Cloud-Init`.** The bootstrap script stopped before it installed the CloudWatch Agent, so none of the instance's logs reach CloudWatch. Connect to the instance (for example with AWS Systems Manager Session Manager; the Endpoint Server and TAP Server instance roles include the `AmazonSSMManagedInstanceCore` policy) and read the end of `/var/log/cloud-init-output.log`. The last lines show the command that failed, for example a failed download from the Combine DevOps bucket, or `ERROR: Instance does not have enough memory.`
2. **`<VpcName>-Service-Error`**: if the bootstrap script finished, a failure of the server itself shows up here as Tomcat errors and Java stack traces.
3. **`<VpcName>-Service`**: if Tomcat fails to start, the server writes `SERVER CRASH: ERROR: Server encountered error and is shutting down!` here (the stack trace is in `<VpcName>-Service-Error`).
4. **`<VpcName>`**: once the server is running, Combine's own errors appear here, either as log entries with `type` set to `error` or in the `errorLog` of another log entry (see [Sample Queries](#sample-queries)).
5. **`<VpcName>-NGINX-Error`** (Endpoint Server only): NGINX errors, for example when NGINX cannot reach Tomcat because the server process is not running.


## Endpoint Logs

The Endpoint server achieves reserved region emulation by performing a man-in-the-middle "attack", inserting itself between your workload and AWS endpoints by way of Private DNS. Any traffic that is directed to the reserved region's endpoints is routed from that DNS name to a Load Balancer through to Combine's Endpoints Server(s), which establish a connection to AWS in the hosted region, receive the response, and send the response back to your workload.

When proxying traffic between your workload and AWS, Combine 'rewrites' various portions of the request from reserved region parlance to the hosted region, and 'rewrites' the response on its way back to your workload.

The Endpoint Logs capture this traffic in an intuitive manner. An individual log message (sometimes referred to as a 'Transaction' log) captures one HTTP request lifecycle, from request to response.

The Log structure for a 'transaction' log looks like this:

```json
{
  "transaction": {
    "metadata": {
      "api": "AWS",
      "accountNumber": "123456789012",
      "cloudPartition": "<emulated partition>",
      "cloudPartitionHost": "AWS",
      "service": "ec2",
      "serviceEndpointPrefix": "ec2",
      "serviceEndpoint": "https://ec2.us-east-1.amazonaws.com",
      "reflected": "false",
      "hostHeaderMismatched": "false",
      "regionId": "<emulated region>",
      "regionHostId": "us-east-1",
      "authorizationScheme": "AWS",
      "signingScheme": "Signed",
      "roleArn": "<unknown>"
    },
    "success": "true",
    "duration": 42,
    "request": {
        ... // the request from your workload to Combine, containing emulated region + partition ARNs and endpoints
      },
    "requestProxy": {
        ... // the request from Combine to AWS, rewritten by Combine from emulated region + partition to hosted region + partition ARNs and endpoints
    },
    "responseProxy": {
        ... // the response received from AWS to Combine, containing hosted region + partition ARNs and endpoints
    }, 
    "response": {
        ... // the response from Combine to your workload, rewritten by Combine from hosted region + partition to emulated region + partition 
    }
  },
  ...
  "messages": [
    // Combine log messages
  ]
}
```


## Logging Configuration Values

These Configuration Values control what the Endpoint Server and TAP Server write to the `<VpcName>` Log Stream. See [Edit Combine Configuration Values](how-to-edit-combine-configuration.md) for how to set a Configuration Value. List values are separated by a single space (for example `s3 dynamodb`).

An ignored request is dropped from the log entirely: its request, its response, and any `messages` and `errorLog` Combine recorded for it are not written. On the Endpoint Server, the ignore rules only apply to transactions with a known `service`, and never to a service listed in `combine.endpoints.log.ignore.services.never`.

The `combine.yaml` template sets `combine.log.level` and `combine.endpoints.log.ignore.response.codes.success` from its `LogLevel` (default `DEBUG`) and `LogIgnoreResponseCodesSuccess` (default `true`) parameters, so the defaults shown are those of a Combine Deployment. (Without them, Combine's built-in defaults are `INFO` and `false`.) Changing either template parameter writes the new value to the Configuration Store, replacing a value you set there directly.

### Log Level

| Configuration Value | Default | What it does |
|---|---|---|
| `combine.log.level` | `DEBUG` | How much detail the Endpoint Server and TAP Server log. See the levels below. |
| `combine.log` | `true` | `false` stops Combine from recording its messages and errors. Transaction and `token` log entries are still written. |

`combine.log.level` takes one of the following values. Each level also logs everything from the levels above it. A value Combine does not recognize is treated as `DEBUG`.

| Level | Adds |
|---|---|
| `INFO` | Transaction log entries and Combine's standard messages and errors. |
| `DEBUG` | How each request was handled, for example which credentials Combine used to sign it and which Filters applied. |
| `VERBOSE` | Timing checkpoints (`TIMER: Duration [...]`) and more Filter and Rewriter detail. |
| `VERBOSE_LOW_LEVEL` | Low-level detail such as the request signing String To Sign and signature, and on the TAP Server the HTTP request and response of each request it logs. |

### Endpoint Server

| Configuration Value | Default | What it does |
|---|---|---|
| `combine.endpoints.log.ignore.response.codes.success` | `true` | `true` ignores every transaction with a `2xx` response, so only AWS API Calls that fail are logged. Set to `false` to also log AWS API Calls that succeed. |
| `combine.endpoints.log.ignore.response.codes` | _(empty)_ | HTTP status codes to ignore, for example `404 409`. Matched against the response Combine returned to your workload (`transaction.response.code`). |
| `combine.endpoints.log.ignore.services` | _(empty)_ | Services to ignore, for example `s3 ec2`. Matched against `transaction.metadata.service`. |
| `combine.endpoints.log.ignore.services.never` | _(empty)_ | Services that are always logged, regardless of the other ignore rules. |
| `combine.endpoints.log.request.body` | `true` | Log request bodies (in `request` and `requestProxy`). |
| `combine.endpoints.log.request.body.byteLimit` | `32768` | A request body larger than this many bytes is logged as `Body Length [<length>] exceeded limit [<limit>]` instead. `-1` removes the limit. |
| `combine.endpoints.log.response.body` | `true` | Log response bodies (in `responseProxy` and `response`). |
| `combine.endpoints.log.response.body.byteLimit` | `32768` | The same limit for response bodies. |
| `combine.endpoints.log.ignore.api.handlers.disabled` | `true` | `false` adds a message for each Filter or Rewriter that configuration disabled (or force enabled) for the transaction. These messages are logged at `VERBOSE` and `VERBOSE_LOW_LEVEL`, so `combine.log.level` must be raised as well. |
| `combine.endpoints.aws.rewriter.response.logging.dynamodb.conditionalExpressionFailed.enable` | `true` | Ignores DynamoDB API Calls that fail with `ConditionalCheckFailedException`. Set to `false` to log them. |
| `combine.endpoints.aws.rewriter.response.logging.s3.accessDenied.enable` | `false` | `true` ignores S3 API Calls that fail with a `403` `AccessDenied` error. |

`combine.endpoints.log.ignore.services`, `combine.endpoints.log.ignore.services.never`, `combine.endpoints.log.ignore.response.codes`, and `combine.endpoints.log.ignore.response.codes.success` can each be set for a single AWS Account by adding `.<account id>` to the name (for example `combine.endpoints.log.ignore.response.codes.success.123456789012`). For requests from that AWS Account (`transaction.metadata.accountNumber`), a non-empty account value replaces the value without the suffix.

The `combine.endpoints.aws.api.logging.*` Configuration Values control a separate log of AWS API Calls kept in DynamoDB. See [AWS API Request Logging](../../start-here/10-advanced-features/aws-api-logging.md).

### TAP Server

The TAP Server writes a `token` log entry each time it issues AWS credentials: for CAP and SCAP credential requests, and for AWS Console sign-ins and credential requests from the TAP Dashboard.

| Configuration Value | Default | What it does |
|---|---|---|
| `combine.tap.log.ignore.request.dashboard.asset` | `true` | Ignores requests for TAP Dashboard assets (`/dashboard/assets`). |
| `combine.tap.log.ignore.request.success.dashboard` | `true` | Ignores successful (`2xx`) TAP Dashboard requests (`/dashboard`). |
| `combine.tap.log.tokenRequest.httpRequest.enable` | `false` | `true` adds the HTTP request to the `token` log entry. |
| `combine.tap.log.tokenRequest.credentialsRequest.enable` | `true` | Adds the AssumeRole request (Role ARN, session name, duration, and session policy) to the `token` log entry. |
| `combine.tap.log.tokenRequest.credentials.enable` | `true` | Adds the issued temporary credentials (access key ID, secret access key, session token, assumed role, and expiration) to the `token` log entry. Set to `false` to keep credentials out of the log. |
| `combine.tap.log.tokenRequest.trailEvent.enable` | `false` | `true` adds the Trail Event to the `token` log entry (only when `combine.tap.trails.enable` is `true`). |


------

## Sample Queries

Here are some sample queries that can be run from the CloudWatch Log Groups dashboard:

To find Combine application-level errors: 

```
{ $.errorLogCount > 0 }
```


To find logs relating to a particular AWS service (replace `lambda` with any other AWS service):

```
{ $.transaction.metadata.service = "lambda" }
```

We will add more queries here in the near future.