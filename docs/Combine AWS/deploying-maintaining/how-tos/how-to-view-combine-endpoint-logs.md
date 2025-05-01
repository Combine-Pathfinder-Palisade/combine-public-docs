# How To: View Combine Logs

## Overview

Combine logs detailed information about _every_ http request that it proxies. All logs are injected into three CloudWatch Log Groups:
- `Combine_<namespace>_Log_Group_Endpoint` logs AWS Endpoint traffic,
- `Combine_<namespace>_Log_Group_Firewall` logs Firewall traffic, and
- `Combine_<namespace>_Log_Group_TAP` logs the TAP Dashboard traffic.

Each of these log groups captures the entirety of information that passes through Combine. Additionally, for the Endpoint and TAP log groups, the traffic is decorated with Combine's application-level logging.

Here are some guidelines to determine which Log Group to search in:
- If you are looking to find traffic that was blocked to due Combine's airgapping, look in the Firewall Log Group.
- If you are looking to find traffic relating to AWS Endpoint emulation, look at the Endpoint Log Group.
- If you are looking for User Management issues, look at the TAP Dashboard Log Group (unlikely).


## Endpoint Logs

The Endpoint server achieves reserved region emulation by performing a man-in-the-middle "attack", inserting itself between your workload and AWS endpoints by way of Private DNS. Any traffic that is directed to the reserved region's endpoints is routed from that DNS name to a Load Balancer through to Combine's Endpoints Server(s), which establish a connection to AWS in the hosted region, receives the response back, and sends the response back to your workload.

When proxying traffic between your workload and AWS, Combine 'rewrites' various portions of the request from reserved region parlance to the hosted region, and 'rewrites' the response on its way back to your workload.

The Endpoints Logs captures this traffic in an intuitive manner. An individual log message (sometimes referred to as a 'Transaction' log) captures one HTTP request lifecycle, from request to response.

The Log structure for a 'transaction' log looks like this:

```json
{
  "transaction": {
    "metadata": {
      "accountNumber": "123456789012",
      "service": "ec2",
      "serviceEndpoint": "https://ec2.us-east-1.amazonaws.com",
      "environment": "<emulated-partition>",
      "api": "AWS",
      "region": "<emulated region>",
      "regionHosted": "us-east-1",
      "authorizationScheme": "AWS",
      "signingScheme": "Signed"
    },
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
{ $.errorCountLog > 0 }
```


To find logs relating to a particular AWS service:

```
{ $.transaction.metadata.service = "lambda" } // or any other AWS service
```

We will add more queries here in the near future.