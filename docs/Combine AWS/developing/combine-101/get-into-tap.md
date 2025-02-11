# Connecting to the TAP Server via SSH

1. Start by creating an SSH connection in to the bastion server
 - See 'get-into-bastion' if a connection to the bastion server has not yet been established

 # Locate the CombineRestricted.pem key

1. Return to the S3 bucket that contained the original Combine.pem key used to connect to the bastion host. See [getting-in-to-bastion.md](./get-into-bastion.md)
2. Search within this bucket or other related buckets for the CombineRestricted.pem key

# SCP the CombineRestricted.pem key on to the bastion host

1. Transfer the restricted key on to the bastion using SCP
2. Open a second terminal window on the local system and use the following syntax:

   ```bash
   scp -i /path/to/key/Combine.pem /local/path/to/CombineRestricted.pem ec2-user@ec2-1-2-3-4.compute-1.amazonaws.com:/home/ec2-user
   ```
3. Note that the syntax is as follows: 

   ```bash
   scp -i <bastion_key.pem> <local_copy_of_CombineRestricted.pem> <remote_username>@<remote_system_dns_name>:<remote_filepath_for_upload>
   ```

# Connecting to the TAP server dashboard via web browser

1. Access the [EC2 dasbhboard](https://us-east-1.console.aws.amazon.com/ec2) in AWS
2. Scroll down to the "Load Balancing" menu on the left side of the dashboard and select "Load Balancers"
3. If desired, add a filter to the list that uses the name of the target shard
4. Find the `<Shard>-Combine-T-E` load balancer (this stands for Combine-Tap-External) and click on it
5. In the details window find the `DNS name` field - it should be formatted like so:
   ```bash
   ShardName-Combine-T-E-4787a73e2dc82fc5.elb.us-east-1.amazonaws.com
   ```
6. Use that address in a web browser to connect to the public web front end of the TAP server dashboard.
  - Be sure to add the Combine certificate authority to the operating system or browser CAs prior to connecting
  - See [Set up the CA on the local system](./build-dev-shard.md#5-set-up-the-ca-on-the-local-system) in the "Building a Developer Shard" article.

7. Add the user's `.pem` file to the browser for authentication (add to this)