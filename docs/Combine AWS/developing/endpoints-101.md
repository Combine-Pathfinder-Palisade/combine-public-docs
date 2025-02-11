# Endpoints 101

Sparse checklist to get feet wet/troubleshooting:

1. Locate keys for ssh'ing into (EC2) bastion
    - look in AWS console to find which keypair is used in bastion ec2 instance
2. get into Combine test server from bastion
    - via keypair for _that_ ec2 instance
3. install ca chain on test server (see tap documentation for instructions on how to do this, i.e. `update-ca-trust`)
4. `aws sts get-caller-identity` to diagnose whether you're actually 'in' Combine, should get `iso` values
5. look in cloudwatch for the log corresponding to the aws cli call you just made

Starting point for code: `EndpointServletImplementationAWS.java`
- needs to be surfaced to new team members early!

TODO add content for:
- more detail on how the translation works
- be very clear
- more screenshots


Here's the inheritance bulleted structure for some of the more important classes in the endpoints code:

# Inheritance Structure

- **ApiHandler**
  - **ApiFilter**
    - **AwsApiFilter**
      - **ApiFilterApiGatewayV1Authorizers**
      - **ApiFilterApiGatewayV1RestAPI**
      - **ApiFilterApiGatewayV1SDKType**
      - **ApiFilterAwsApiCallLogger**
        - **ApiFilterAwsApiCallLoggerAMI**
        - **ApiFilterAwsApiCallLoggerAction**
        - **ApiFilterAwsApiCallLoggerArtifactECR**
        - **ApiFilterAwsApiCallLoggerArtifactS3**
      - (Many other subclasses...)
  - **ApiRewriter**
    - **ApiRequestRewriter**
      - **AwsApiRewriterRequest**
        - **ApiRequestRewriterAllTagsArn**
        - **ApiRequestRewriterApiGatewayArn**
        - (Many other subclasses...)
      - **AzureApiRewriterRequest**
        - **ApiRequestRewriterKeyVaultUri**
        - **ApiRequestRewriterOAuthTokenScope**
    - **ApiResponseRewriter**
      - **AwsApiRewriterResponse**
        - **ApiResponseRewriterApiGatewayArn**
        - **ApiResponseRewriterAppConfigArn**
        - (Many other subclasses...)
      - **AzureApiRewriterResponse**
        - **ApiResponseRewriterKeyVaultUri**
        - **ApiResponseRewriterLocationHeader**
        - **ApiResponseRewriterOperationHeader**

- **EndpointServletImplementation**
  - **EndpointServletImplementationAWS**
  - **EndpointServletImplementationAzure**
  - **EndpointServletImplementationOracle**

- **LogAggregate**
  - **TransactionLog**
    - **TransactionLogAWS**
  - **WebSocketTransactionLog**

- **Transaction**
  - **TransactionAWS**
