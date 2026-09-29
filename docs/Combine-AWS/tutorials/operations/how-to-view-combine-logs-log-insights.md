# Use Logs Insights

## Overview

This guide provides a step-by-step approach to utilizing AWS Logs Insights for troubleshooting and monitoring simulation issues, particularly in environments such as AWS C2S and SC2S. The following example demonstrates how to investigate a potential simulation issue based on a real-world request.

## Example Scenario

- **Request from Client:** 
    - A simulation issue was reported, and the following log snippet sent to us by the client needs investigating.

- **Log Snippet from Client:**

 ``` json
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

- **Look for patterns in the error messages**
    - Common issues may include:
        - **Permissions Denied**
        - **Mismatched Regions or Endpoints**
        - **Error Code/Type**
        - **Account of origin**
        - **Services**

    - Other Troubleshooting Steps:
        - **Verify if the Role ARN exists in the target account**
        - **Check IAM permissions for the source account**
        - **Confirm the AssumeRole policy allows intended access**
        - **Ensure the request is routed to the correct STS endpoint**

## Step-by-Step Guide

1. **Access Logs Insights**

    - Navigate to the AWS CloudWatch console

    - Select Logs Insights from the left-hand menu

    - Choose the relevant log group (e.g. `Combine_Server_Endpoint`, or `Combine_<shard id>_Server_Endpoint` if your Combine Deployment has a Shard ID)

2. **Construct Your Query**
    - Use the following query to identify errors, e.g. related to AWS STS AssumeRole operations:

 ``` sql
fields @timestamp, @message
| filter transaction.response.code = "400"
| filter transaction.request.host = "sts.us-iso-east-1.c2s.ic.gov"
| sort @timestamp desc
| limit 50
 ```

3. **Query Breakdown**
- `fields @timestamp, @message`
    - Displays the timestamp and message for each log entry
    - Combine writes each log entry as JSON, so Logs Insights automatically discovers nested fields such as `transaction.response.code` and `transaction.request.host`

- `filter transaction.response.code = "400"`
    - Filters logs where the response code indicates an error (HTTP 400)

- `filter transaction.request.host = "sts.us-iso-east-1.c2s.ic.gov"`
    - Focuses on logs related to the STS service in the C2S region

- `sort @timestamp desc`
    - Sorts results by the most recent first

- `limit 50`
    - Limits the output to the top 50 records

4. **Analyze the Results**

- Result Log Snippet from Log Insights Query

``` json
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

5. **Key Insights Extracted from the Logs**
    - **Account:** `111122223333`
    - **Source IP:** `203.0.113.10`
    - **Invalid Role:** `ARN: arn:aws:iam::444455556666:WLDEVELOPER`
    - **Error Code:** `400`
    - **user-agent:** `aws-sdk-java`

6. **Response to client**
    - "We see that account **111122223333** attempted an **AssumeRole** operation from a **Java program** using **IP 203.0.113.10**. The request included an invalid role **arn:aws:iam::444455556666:WLDEVELOPER**."

## Best Practices

- Use Descriptive Filters: Filter by error codes and endpoints
- Regular Monitoring: Set up scheduled queries or CloudWatch alarms
- Documentation: Track known issues and resolutions

## Key differences searching Raw Logs vs Log Insights 
- SQL-like queries (e.g., `fields`, `filter`, `sort`, `parse`)
- Aggregations using stats (e.g., `count()`, `avg()`, `sum()`)
- Regular expressions (`parse` function) to extract values
- Real-time Filtering & Sorting
- Statistical Analysis & Metrics <!-- TODO: Add wiki for this  -->
- Log Group Joins (Cross-Log Analysis) <!-- TODO: Add wiki for this  -->
- Performance & Cost Efficiency <!-- TODO: Add wiki for this  -->
- Visualization & Dashboards <!-- TODO: Add wiki for this  -->