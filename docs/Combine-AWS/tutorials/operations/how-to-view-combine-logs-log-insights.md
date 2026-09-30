# Use CloudWatch Logs Insights

## Overview

This guide shows how to use CloudWatch Logs Insights to troubleshoot and monitor emulation issues, for example in a Combine Deployment that emulates C2S or SC2S. It works through a real-world example: investigating a potential emulation issue from a customer's request.

For the Log Groups that Combine writes to and the structure of a log entry, see [View Combine Logs](how-to-view-combine-logs.md).

## Example Scenario

A customer reported a potential emulation issue and sent the following log snippet from their application:

```json
{
    "@timestamp": "2025-01-29T21:15:47.257+00:00",
    "@version": 1,
    "message": "com.netflix.spinnaker.clouddriver.aws.provider.AwsProvider:aws-iam-account/us-iso-east-1/AmazonApplicationLoadBalancerCachingAgent completed with one or more failures in 0s",
    "logger_name": "com.netflix.spinnaker.clouddriver.cache.LoggingInstrumentation",
    "thread_name": "AgentExecutionAction-57",
    "level": "WARN",
    "level_value": 30000,
    "stack_trace": "com.amazonaws.services.securitytoken.model.AWSSecurityTokenServiceException: null (Service: AWSSecurityTokenService; Status Code: 400; Error Code: 400 ; Request ID: null; Proxy: proxy.example.com)"
}
```

### What to Look For

Look for patterns in the error messages, such as:

- Permissions denied
- Mismatched Regions or endpoints
- The error code or type
- The account of origin
- The service

Other troubleshooting steps:

- Verify that the Role ARN exists in the target account.
- Check the IAM permissions of the source account.
- Confirm that the AssumeRole policy allows the intended access.
- Make sure the request is routed to the correct STS endpoint.

## Step-by-Step Guide

### Step 1: Open CloudWatch Logs Insights

1. Open the CloudWatch console.
2. In the left navigation pane, choose **Logs Insights**.
3. Choose the Log Group to search, for example `Combine_Server_Endpoint` (or `Combine_<shard id>_Server_Endpoint` if your Combine Deployment has a Shard ID).

### Step 2: Write the Query

Use a query like the following to find errors, in this case errors related to AWS STS AssumeRole operations:

```sql
fields @timestamp, @message
| filter transaction.response.code = "400"
| filter transaction.request.host = "sts.us-iso-east-1.c2s.ic.gov"
| sort @timestamp desc
| limit 50
```

### Step 3: Understand the Query

| Line | What it does |
|---|---|
| `fields @timestamp, @message` | Displays the timestamp and message of each log entry. |
| `filter transaction.response.code = "400"` | Keeps log entries whose response code indicates an error (HTTP 400). |
| `filter transaction.request.host = "sts.us-iso-east-1.c2s.ic.gov"` | Keeps log entries for the STS service in the C2S Region. |
| `sort @timestamp desc` | Sorts the results, most recent first. |
| `limit 50` | Limits the output to the first 50 log entries. |

Combine writes each log entry as JSON, so Logs Insights automatically discovers nested fields such as `transaction.response.code` and `transaction.request.host`.

### Step 4: Analyze the Results

The query returns the transaction log entry for the failed request:

```json
{
  "transaction": {
    "success": "false",
    "duration": 14,
    "metadata": {
      "api": "AWS",
      "accountNumber": "111122223333",
      "cloudPartition": "AWS_C2S",
      "cloudPartitionHost": "AWS",
      "service": "sts",
      "serviceEndpointPrefix": "sts",
      "serviceEndpoint": "https://sts.us-east-1.amazonaws.com",
      "reflected": "false",
      "hostHeaderMismatched": "false",
      "regionId": "us-iso-east-1",
      "regionHostId": "us-east-1",
      "authorizationScheme": "AWS",
      "signingScheme": "<unknown>",
      "roleArn": "<unknown>"
    },
    "request": {
      "scheme": "https",
      "host": "sts.us-iso-east-1.c2s.ic.gov",
      "uriPath": "/",
      "uriPathRaw": "/",
      "method": "POST",
      "headers": {
        "amz-sdk-invocation-id": ["2c85a594-14e8-d4e3-9c13-1c76cdf61005"],
        "amz-sdk-request": ["ttl=20250130T151349Z;attempt=1;max=4"],
        "amz-sdk-retry": ["0/0/500"],
        "authorization": ["AWS4-HMAC-SHA256 Credential=ASIAIOSFODNN7EXAMPLE/20250130/us-iso-east-1/sts/aws4_request, SignedHeaders=amz-sdk-invocation-id;amz-sdk-request;amz-sdk-retry;host;user-agent;x-amz-date;x-amz-security-token, Signature=<redacted>"],
        "content-length": ["138"],
        "content-type": ["application/x-www-form-urlencoded; charset=utf-8"],
        "host": ["sts.us-iso-east-1.c2s.ic.gov"],
        "user-agent": ["aws-sdk-java/1.12.261 Linux/5.10.223-212.873.amzn2.x86_64 OpenJDK_64-Bit_Server_VM/17.0.11.0.101+3-LTS java/17.0.11.0.101 groovy/3.0.19 kotlin/1.6.21 vendor/Azul_Systems,_Inc. cfg/retry-mode/legacy"],
        "x-amz-date": ["20250130T151259Z"],
        "x-amz-security-token": ["<redacted>"],
        "x-amzn-trace-id": ["Root=1-679b96fb-78d87d7c5ba01a9451da5d50"],
        "x-forwarded-for": ["203.0.113.10"],
        "x-forwarded-port": ["443"],
        "x-forwarded-proto": ["https"]
      },
      "parameters": {
        "Action": ["AssumeRole"],
        "DurationSeconds": ["900"],
        "RoleArn": ["arn:aws:iam::444455556666:WLDEVELOPER"],
        "RoleSessionName": ["Spinnaker"],
        "Version": ["2011-06-15"]
      },
      "body": []
    },
    "response": { "code": "400", "headers": {}, "body": [] },
    "id": "7d0c6f3e-2b1a-4c5d-9e8f-0a1b2c3d4e5f"
  },
  "type": "transaction",
  "date": "2025-01-30T15:12:59Z",
  "dateEpoch": 1738249979916,
  "messages": [
    "Handling as AWS API Request.",
    "Request Rewriting : URI : Applying Rewriter [com.sequoia.combine.endpoints.aws.api.rewriters.ApiRequestRewriterNormalizeURL] with strict mode [true]",
    "Request Rewriting : Parameters : Applying Rewriter [com.sequoia.combine.endpoints.aws.api.rewriters.services.ApiRequestRewriterStsArn] with strict mode [true]",
    "ERROR: API Call to [sts:AssumeRole] encountered unexpected ARN value [arn:aws:iam::444455556666:WLDEVELOPER]!"
  ],
  "errorLog": [],
  "errorLogCount": 0
}
```

_NOTE: `errorLogCount` counts only the entries in `errorLog`. A message that begins with `ERROR:` in `messages`, as in this example, does not count toward it, so a filter on `errorLogCount` does not find this entry. To find failed AWS API Calls, filter on `transaction.success` or the response code instead._

For what each part of a transaction log entry holds, see [Endpoint Logs](how-to-view-combine-logs.md#endpoint-logs).

### Step 5: Extract the Key Details

The log entry shows:

- **Account:** `111122223333` (`transaction.metadata.accountNumber`)
- **Source IP:** `203.0.113.10` (the `x-forwarded-for` header)
- **Invalid role:** `arn:aws:iam::444455556666:WLDEVELOPER` (the `RoleArn` parameter and the `ERROR` entry in `messages`)
- **Error code:** `400` (`transaction.response.code`)
- **User agent:** `aws-sdk-java` (the `user-agent` header)

### Step 6: Respond to the Customer

In this example, the response to the customer was:

> We see that account **111122223333** attempted an **AssumeRole** operation from a **Java program** using **IP 203.0.113.10**. The request included an invalid role **arn:aws:iam::444455556666:WLDEVELOPER**.

## Best Practices

- **Use descriptive filters.** Filter by error code and endpoint.
- **Monitor regularly.** Set up scheduled queries or CloudWatch alarms.
- **Document what you find.** Track known issues and their resolutions.

## Logs Insights Compared With Searching Log Streams

Compared with searching a Log Group's log streams with a filter pattern (see [Sample Queries](how-to-view-combine-logs.md#sample-queries)), CloudWatch Logs Insights offers:

- SQL-like queries (for example `fields`, `filter`, `sort`, and `parse`)
- Aggregations with `stats` (for example `count()`, `avg()`, and `sum()`)
- Regular expressions (the `parse` command) to extract values
- Filtering and sorting
- Statistical analysis and metrics <!-- TODO: Add wiki for this  -->
- Querying several Log Groups at once (cross-log analysis) <!-- TODO: Add wiki for this  -->
- Performance and cost efficiency <!-- TODO: Add wiki for this  -->
- Visualization and dashboards <!-- TODO: Add wiki for this  -->
