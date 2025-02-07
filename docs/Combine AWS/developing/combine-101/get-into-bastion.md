# Connecting to the Bastion Server via SSH

1. Log in to the AWS interface.
2. Navigate to **"Instances"**.
3. Find the server instance name that matches the intended bastion target.
4. Note the public IPv4 address / dns name.

---

# [Navigate to S3](https://us-east-1.console.aws.amazon.com/s3/)

1. Find the bucket that matches the naming convention of the target host or shard.
   - In this instance, navigate to the **"public"** directory.
2. Locate the file **"admin.zip"**.
3. Dig for **"Combine.pem"**.

---

# Digging for keys!

1. Should all else fail find the `list_s3_files.sh` script in `combine-aws\combine-account-automation\scripts`
2. Ensure that the AWS CLI is properly configured by running `aws configure list`
3. If the AWS CLI has not been properly configured then run `aws configure` and enter the required information.
4. Upon completion of `list_s3_files.sh` a file named `s3_bucket_files.csv` will be created in the same directory as the `list_s3_files.sh` script.
5. This file contains two columns, `Bucket Name` and `File Path` for all buckets within the current account.
6. Use filters in a speadsheet application to search the the desired `Combine.pem` key. (Or just grep the name of the key you're looking for)

---

# Connect via SSH

1. Modify the permissions on the **"Combine.pem"** key with the following command

   ```bash
   chmod 600 /path/to/key/Combine.pem
   ```

2. Use the Combine.pem key to ssh in to the target bastion server:

   ```bash
   ssh -i /path/to/key/Combine.pem ec2-user@ec2-1-2-3-4.compute-1.amazonaws.com
   ```