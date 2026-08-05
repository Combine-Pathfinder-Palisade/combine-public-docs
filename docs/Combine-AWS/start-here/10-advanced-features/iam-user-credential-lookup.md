# IAM User Credential Lookup

While IAM Users are not frequently allowed by the sponsors of emulated Partitions, there are occasional scenarios where they are needed. When Combine is proxying a Request it needs to infer the IAM Credentials that signed that Request (see [Orientation](../../tutorials/operations/how-to-edit-combine-configuration.md) for a summary of this process under the `Rewriting` section).

Since an IAM User cannot be directly assumed like an IAM Role, the IAM User credentials must be registered in AWS Secrets Manager for Combine to access.

## Configuration

Due to the specialized nature of this integration, it is disabled by default. To enable it, you must set the following Configuration Value:

`combine.endpoints.aws.authorization.userCredential.lookup` to `true`

(See [Edit Combine Configuration Values](../../tutorials/operations/how-to-edit-combine-configuration.md) for instructions.)

## IAM User Credential Registration

Once the User Credential Lookup is enabled, the IAM Credentials for the IAM User must be registered in AWS Secrets Manager.

To do this, you must create a Secret with the following Key:

`combine/<shardId>/authorization/user/credentials/key/secret/<accessKeyId>`

For example, if your Shard ID is `dev` and your `accessKeyId` is `AKIA123123123123` then the Secret would have the following Key:

`combine/dev/authorization/user/credentials/key/secret/AKIA123123123123`

If your Shard ID is blank, and your `accessKeyId` is `AKIA123123123123` then the Secret would have the following Key:

`combine/authorization/user/credentials/key/secret/AKIA123123123123`

The Secret should have a value of the `secretAccessKey` of the IAM User as a String.

## Conclusion

Once the User Credential Lookup is enabled, and the IAM Credentials for the IAM User are registered in AWS Secrets Manager, then Combine will be able to proxy a Request signed by that IAM User while preserving the caller identity.

## Notes

Prior to Combine `3.14.2` there was a latent issue with the IAM User Credential lookup that could cause throttling under heavy load due to a restrictive AWS Service Quota. Use caution enabling this on earlier Combine versions.
