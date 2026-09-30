# View Combine Logs

## Overview

Combine can log detailed information about every HTTP request that it proxies. It writes its logs to three CloudWatch Log Groups:

| Log Group | Contents | Search it for |
|---|---|---|
| `Combine_Server_Endpoint` | AWS Endpoint traffic (the Endpoint Server). | Traffic related to AWS Endpoint emulation. |
| `Combine_Firewall` | Traffic that the Combine Firewall alerts on or blocks. | Traffic blocked by the Combine AirGap Layer. See [View Combine Firewall Logs](firewall-airgap/how-to-view-combine-firewall-logs.md). |
| `Combine_Server_TAP` | The TAP Server (TAP Dashboard traffic). | User Management issues (rarely needed). |

If your Combine Deployment has a Shard ID, the Shard ID is included in each name (for example `Combine_<shard id>_Server_Endpoint`). Each Log Group keeps log entries for 7 days.

The Endpoint and TAP Log Groups hold Combine's application-level logging and the output of the servers themselves (see [Log Streams](#log-streams)). The [Logging Configuration Values](#logging-configuration-values) control what Combine writes to them. By default, a Combine Deployment does not log AWS API Calls that succeed (`2xx` responses).

To search the logs, use a filter pattern (see [Sample Queries](#sample-queries)) or CloudWatch Logs Insights (see [Use CloudWatch Logs Insights](how-to-view-combine-logs-log-insights.md)).


## Log Streams

The Endpoint Server and TAP Server instances send their logs to CloudWatch with the Amazon CloudWatch Agent, which the server's bootstrap script installs. `Combine_Server_Endpoint` and `Combine_Server_TAP` use the same Log Stream names, built from the VPC Name of the Combine VPC (the `VpcName` Parameter of the `combine-vpc.yaml` template, `Combine` by default):

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

### Where to Look When a Server Fails to Start

The bootstrap script stops at the first command that fails. It starts the server service without waiting for the server to finish starting, and installs the CloudWatch Agent after that. Check the Log Streams in this order:

1. **`<VpcName>-Cloud-Init`**: if the instance's bootstrap output never appears here, the bootstrap script stopped before it installed the CloudWatch Agent, so none of the instance's logs reach CloudWatch. Connect to the instance and read the end of `/var/log/cloud-init-output.log`. (You can connect with AWS Systems Manager Session Manager, for example. The Endpoint Server and TAP Server instance roles include the `AmazonSSMManagedInstanceCore` policy.) The last lines show the command that failed, for example a failed download from the Combine DevOps bucket, or `ERROR: Instance does not have enough memory.`
2. **`<VpcName>-Service-Error`**: if the bootstrap script finished, a failure of the server itself shows up here as Tomcat errors and Java stack traces.
3. **`<VpcName>-Service`**: if Tomcat fails to start, the server writes `SERVER CRASH: ERROR: Server encountered error and is shutting down!` here (the stack trace is in `<VpcName>-Service-Error`).
4. **`<VpcName>`**: once the server is running, Combine's own errors appear here, either as log entries with `type` set to `error` or in the `errorLog` of another log entry (see [Sample Queries](#sample-queries)).
5. **`<VpcName>-NGINX-Error`** (Endpoint Server only): NGINX errors, for example when NGINX cannot reach Tomcat because the server process is not running.


## Endpoint Logs

The Endpoint Server emulates the reserved Region by acting as a man-in-the-middle between your workload and the AWS endpoints. Private DNS routes traffic addressed to the emulated Region's endpoints to a Load Balancer, which passes it to the Endpoint Servers. An Endpoint Server opens a connection to AWS in the host Region, receives the response, and sends the response back to your workload.

While it proxies this traffic, Combine rewrites parts of the request from the emulated Region to the host Region, and rewrites the response on its way back to your workload.

The Endpoint Logs record this traffic. Each transaction log entry (`type` set to `transaction`) captures one HTTP request lifecycle, from request to response. A transaction log entry has this structure:

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

For a complete example of a failed transaction log entry, including its `type`, `messages`, and `errorLog` fields, see [Step 4: Analyze the Results](how-to-view-combine-logs-log-insights.md#step-4-analyze-the-results) in Use CloudWatch Logs Insights.


## Logging Configuration Values

These Configuration Values control what the Endpoint Server and TAP Server write to the `<VpcName>` Log Stream. To set a Configuration Value, see [Edit Combine Configuration Values](how-to-edit-combine-configuration.md). Separate list values with a single space (for example `s3 dynamodb`).

An ignored request is dropped from the log entirely: its request, its response, and any `messages` and `errorLog` Combine recorded for it are not written. On the Endpoint Server, the ignore rules apply only to transactions with a known `service`, and never to a service listed in `combine.endpoints.log.ignore.services.never`.

The `combine.yaml` template sets `combine.log.level` and `combine.endpoints.log.ignore.response.codes.success` from its `LogLevel` (default `DEBUG`) and `LogIgnoreResponseCodesSuccess` (default `true`) Parameters, so the defaults shown below are those of a Combine Deployment. Without these Parameters, Combine's built-in defaults are `INFO` and `false`. Changing either Parameter writes the new value to the [Configuration Store](how-to-edit-combine-configuration.md#configuration-store) and replaces any value you set there directly.

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


## Sample Queries

Run these filter patterns from the CloudWatch console when you search a Log Group (for example with **Search all log streams**). For CloudWatch Logs Insights queries, see [Use CloudWatch Logs Insights](how-to-view-combine-logs-log-insights.md).

To find Combine application-level errors (entries with at least one item in `errorLog`):

```text
{ $.errorLogCount > 0 }
```

To find every failed transaction, including failures that Combine logs only in `messages`:

```text
{ $.transaction.success = "false" }
```

To find log entries for one AWS service (replace `lambda` with any other AWS service):

```text
{ $.transaction.metadata.service = "lambda" }
```

We will add more queries here in the near future.