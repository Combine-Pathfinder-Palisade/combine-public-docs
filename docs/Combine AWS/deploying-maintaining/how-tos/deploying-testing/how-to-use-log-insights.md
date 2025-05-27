# Use Logs Insights

## Overview

This guide provides a step-by-step approach to utilizing AWS Logs Insights for troubleshooting and monitoring simulation issues, particularly in environments such as AWS C2S and SC2S. The following example demonstrates how to investigate a potential simulation issue based on a real-world request.

## Example Scenario

- **Request from Client:** 
    - A simulation issue was reported and the following log snippet was sent to us by the client needs investigating.

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
    "stack_trace": "com.amazonaws.services.securitytoken.model.AWSSecurityTokenServiceException: null (Service: AWSSecurityTokenService; Status Code: 400; Error Code: 400 ; Request ID: null; Proxy: publicproxy.publicproxy.local.sfdc.net)"
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

    - Choose the relevant log group (e.g.endpoints)

2. **Construct Your Query**
    - Use the following query to identify errors, e.g. related to AWS STS AssumeRole operations:

 ``` sql
fields @timestamp, @message
| parse @message '"transaction": {*}' as transaction
| filter transaction.response.code = "400"
| filter transaction.request.host = "sts.us-iso-east-1.c2s.ic.gov"
| sort @timestamp desc
| limit 50
 ```

3. **Query Breakdown**
- `fields @timestamp, @message`
    - Displays the timestamp and message for each log entry

- `parse @message '"transaction": {*}' as transaction`
    - Extracts the transaction object from the log message

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
    "type": "transaction",
    "date": "2025-01-30T15:12:59Z",
    "dateEpoch": 1738249979916,
    "transaction":
      {
        "metadata":
          {
            "accountNumber": "533266978856",
            "service": "sts",
            "serviceEndpoint": "https://sts.us-east-1.amazonaws.com",
            "environment": "AWS_C2S",
            "api": "AWS",
            "region": "us-iso-east-1",
            "regionHosted": "us-east-1",
            "authorizationScheme": "AWS",
            "signingScheme": "<unknown>",
            "reflected": false,
          },
        "request":
          {
            "scheme": "https",
            "host": "sts.us-iso-east-1.c2s.ic.gov",
            "uri": "/",
            "method": "POST",
            "headers":
              [
                {
                  "name": "amz-sdk-invocation-id",
                  "value": "2c85a594-14e8-d4e3-9c13-1c76cdf61005",
                },
                {
                  "name": "amz-sdk-request",
                  "value": "ttl=20250130T151349Z;attempt=1;max=4",
                },
                { "name": "amz-sdk-retry", "value": "0/0/500" },
                {
                  "name": "authorization",
                  "value": "AWS4-HMAC-SHA256 Credential=ASIAXYKJQLAULWGR5IMC/20250130/us-iso-east-1/sts/aws4_request, SignedHeaders=amz-sdk-invocation-id;amz-sdk-request;amz-sdk-retry;host;user-agent;x-amz-date;x-amz-security-token, Signature=7bb8b78a52e4558816ad6f1bc47e7f2da4af467ecf4a044944790f9c18f22ef9",
                },
                { "name": "content-length", "value": "138" },
                {
                  "name": "content-type",
                  "value": "application/x-www-form-urlencoded; charset=utf-8",
                },
                { "name": "host", "value": "sts.us-iso-east-1.c2s.ic.gov" },
               {
                  "name": "user-agent",
                  "value": "aws-sdk-java/1.12.261 Linux/5.10.223-212.873.amzn2.x86_64 OpenJDK_64-Bit_Server_VM/17.0.11.0.101+3-LTS java/17.0.11.0.101 groovy/3.0.19 kotlin/1.6.21 vendor/Azul_Systems,_Inc. cfg/retry-mode/legacy",
                },
                { "name": "x-amz-date", "value": "20250130T151259Z" },
                {
                  "name": "x-amz-security-token",
                  "value": "IQoJb3JpZ2luX2VjEJ///////////wEaCXVzLWVhc3QtMSJHMEUCIGj2AXyhmujugVO/TKaw3+FGR5dGH8LzkktTMTDO+OFpAiEAr8f0AOvMfvcbxGmrgUhQDpY/iU0hstdTRnzF7Ew8ZsMqmgUIqP//////////ARAAGgw1MzMyNjY5Nzg4NTYiDNDw1PEfc+u7h8gkrCruBA+iVQaJEzmuvE6NcSr+GFprBDx6xMqqhSfqU2tGwgKgJWiso6Pufpz26FUt/uSBEv78JuySnE0jMRGOOdnD+uumfUGts42BwBytdh5q9L1iOzvSRrmR7H5bXRd6Yz8vpScVJ+mH6nNoLqFKS7CloFcGKXgHOawrfppOoe0XwUNGsKSz2T9qYJ3+bpt2wY2ecwrWWbfLy5g87PI64Y+AzV7jMc8eASnjSz+seEF1JT9qa3bEavvK71qHR75cdesnh6dHa3qbhwktFVMu7guWQZS2yuHPoUF6Ixq7RP8c/lMV/hFdM0JIK5SpeQtrXuCtKcJLM8xQ7Bshx7lf4B/29j7h9QppziDHGfLE47dVrZDfKPJKnkyF15uACfKj+Sk+gd7YG4MSd8pXgmsLXbv7MBQP4PQ4w2WMEv1/Ax/XdBzuKNiePpr6nyTQoOal/bMiCTTDLPsOiFOhGSKyPxTi2/6QMlFcBtGi0zXzhwN0Ii8kX3mAr6R+ORy8tSiSQWlmL2gLLagQwneDGqk9guy8auAuCndh31/0nV7oIyM9vJj7nwl5Cm8TkOcM5ReHWixXJWDkzFMCCYFcrnj0M6ixLZFwA8jV0C15TpGwFlhVW6IbMpWLGH/I8nk9njsX7G+Y8rQgDCQ7v/6F9icw7Ej4jn7lkQt7n9u+N5meaSLtqWaCEwvAbvHdftjANYfAksHlP9o/wx0fZFRxpe55IA0I2eqL5xV9ROpGr8Z65KaSA3Hkuxo5wwYv43J4ZIcSVD36g0LUUEPqxBSXSv96rraRuprRCfXGaTHmOQvjFVV1Yz6WEfztOvsxD78BsR1v96QwpqHuvAY6mwEQAo6xKBwca1mSBiqJoQMEnHu8DFb1ThPL6jtYb3MF8DnfkMhsbyyKyy6hyhhAmGVKXRGcKv7CNFQ1GIYaW8NW/vixhLSNYHje9UaLjGdo6LsaoCc6zKMYGKbi4Yyz0CnHPyF6Qb2k3mW0j0GXt27iIfikdXbkOzz+/C9KHHbnCfRHAn5xSDKZu3BUb3IGF6M1EDH638QuI4Pt2A==",
                },
                {
                  "name": "x-amzn-trace-id",
                  "value": "Root=1-679b96fb-78d87d7c5ba01a9451da5d50",
                },
                { "name": "x-forwarded-for", "value": "54.204.96.140" },
                { "name": "x-forwarded-port", "value": "443" },
                { "name": "x-forwarded-proto", "value": "https" },
              ],
            "parameters":
              [
                { "name": "Action", "value": "AssumeRole" },
                { "name": "DurationSeconds", "value": "900" },
                {
                  "name": "RoleArn",
                  "value": "arn:aws:iam::654654571291:WLDEVELOPER",
                },
                { "name": "RoleSessionName", "value": "Spinnaker" },
                { "name": "Version", "value": "2011-06-15" },
              ],
            "body": [],
          },
        "requestProxy": {},
        "responseProxy": {},
        "response": { "code": "400", "headers": [], "body": [] },
        "duration": 14,
      },
    "messages":
      [
        "Handling as AWS API Request.",
        "Request Rewriting : URI : Applying Rewriter [com.sequoia.combine.endpoints.aws.api.rewriters.ApiRequestRewriterNormalizeURL] with strict mode [true]",
        "Request Rewriting : Parameters : Applying Rewriter [com.sequoia.combine.endpoints.aws.api.rewriters.services.ApiRequestRewriterStsArn] with strict mode [true]",
        "ERROR: API Call to [sts:AssumeRole] encountered unexpected ARN value [arn:aws:iam::654654571291:WLDEVELOPER]!",
      ],
    "errorLog": [],
    "errorLogCount": 0
  }
  
```

5. **Key Insights from Extracted from the Logs**
    - **Account:** `533266978856`
    - **Source IP:** `54.204.96.140`
    - **Invalid Role:** `ARN: arn:aws:iam::654654571291:WLDEVELOPER`
    - **Error Code:** `400`
    - **user-agent:** `aws-sdk-java`

6. **Response to client**
    - "We see that account **533266978856** attempted an **AssumeRole** operation from a **Java program** using **IP 54.204.96.140**. The request included an invalid role **arn:aws:iam::654654571291:WLDEVELOPER**."

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