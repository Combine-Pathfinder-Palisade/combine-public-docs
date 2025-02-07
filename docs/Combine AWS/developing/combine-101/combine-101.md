# Combine 101

TODO make one page for each of these top-level bullets, move combine 101 to its own directory
- Get into bastion VM inside Combine network
  - find bastion/test server/jumpbox from Ec2 console
    - search 'ec2' in the aws console inside our combine account
    - find a bastion instance corresponding to the namespace/shard of the Combine deployment you're trying to get into. Note the public ip and keypair name.
    - the keypair is not downloadable from the ec2 console, but lives in the s3 bucket that corresponds to the Combine shard. To find the bucket, click into s3 on the console and:
      - find the `devops` bucket corresponding to the shard
      - inside the `/keys` directory of the bucket, there'll be a `Combine.pem` (which is a bug, it should be named the same as the keypair name in the ec2 instance details - but we'll pass over that bug for now 😊)
      - download it!
    - you'll have to `chmod +x Combine.pem`, or whatever the windows equivalent to `chmod +x` is. It gives you execute permissions on the key file.
    - run this ssh command, or whatever windows equivalent it is, gathering the info you've gotten so far, namely the public ip and the key of the bastion:
      `ssh -i Combine.pem ec2-user@<public-ip-of-bastion>`
    - hopefully it works!
    - when you're in, you can run `aws sts get-caller-identity` to see if you get back an `iso` ARN (an ARN that has the `aws-iso` in one of the quadrants)

- Walk through `EndpointServletImplementationAWS` in `combine-aws`
- look at recent bricks version tag changes to see how releases work
- get to TAP dashboard
  - get credential email
  - use readme, install certs


<div style={{ maxWidth: "1280px" }}>
  <div
    style={{
      position: "relative",
      paddingBottom: "56.25%",
      height: 0,
      overflow: "hidden",
    }}
  >
    <iframe
      src="https://sequoiaholdingsllc-my.sharepoint.com/personal/bking_sequoiainc_com/_layouts/15/embed.aspx?UniqueId=ff054d63-149d-48fb-b2c5-c6aa69022dc4&embed=%7B%22ust%22%3Atrue%2C%22hv%22%3A%22CopyEmbedCode%22%7D&referrer=StreamWebApp&referrerScenario=EmbedDialog.Create"
      width="1280"
      height="720"
      frameBorder="0"
      scrolling="no"
      allowFullScreen
      title="Welcome to Combine AWS - TRM Labs-20241120_140337-Meeting Recording.mp4"
      style={{
        border: "none",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: "100%",
        maxWidth: "100%",
      }}
    ></iframe>
  </div>
</div>
