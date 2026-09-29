# View Combine Logs

## Overview

Combine logs detailed information about _every_ http request that it proxies. All logs are injected into three CloudWatch Log Groups:
- `Combine_Server_Endpoint` logs AWS Endpoint traffic,
- `Combine_Firewall` logs Firewall traffic, and
- `Combine_Server_TAP` logs the TAP Dashboard traffic.

If your Combine Deployment has a Shard ID, the Shard ID is included in each name (for example `Combine_<shard id>_Server_Endpoint`).

Each of these log groups captures the entirety of information that passes through Combine. Additionally, for the Endpoint and TAP log groups, the traffic is decorated with Combine's application-level logging.

Here are some guidelines to determine which Log Group to search in:
- If you are looking to find traffic that was blocked due to Combine's airgapping, look in the Firewall Log Group.
- If you are looking to find traffic relating to AWS Endpoint emulation, look at the Endpoint Log Group.
- If you are looking for User Management issues, look at the TAP Dashboard Log Group (unlikely).


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