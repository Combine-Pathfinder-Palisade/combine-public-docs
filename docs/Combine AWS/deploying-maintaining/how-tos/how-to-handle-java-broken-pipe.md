# How to handle `java.io.IOException: Broken pipe`

This issue happens when the endpoints server tries to do rewriting on a large payload.

The error can be found in the Endpoints server log group in CloudWatch (ends in `_Log_Group_Endpoint`), and looks something like:

```bash
"errorLog": [
  {
    "errorMessage": "Could not proxy request!",
    "error": [
      "org.apache.catalina.connector.ClientAbortException: java.io.IOException: Broken pipe", // 👈
      "\tat org.apache.catalina.connector.OutputBuffer.realWriteBytes(OutputBuffer.java:341)",
      "\tat org.apache.catalina.connector.OutputBuffer.flushByteBuffer(OutputBuffer.java:776)",
...
```

To fix it, you can try to lower the tunneling threshold with these two parameters in configuration (these would be entries in the `combine-configuration` DynamoDb table):
- `combine.endpoints.aws.request.tunneling.threshold`
- `combine.endpoints.aws.response.tunneling.threshold`

The default for these is `2147483647`, try setting them to `134217728`.

To do this via DynamoDb, create an item and set `parameter_name` to `combine.endpoints.aws.request.tunneling.threshold`, and add an attribute for `parameter_value` with the value set to `134217728`, shown below:

![Image](/aws/broken-pipe.png)