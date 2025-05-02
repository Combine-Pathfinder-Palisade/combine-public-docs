# How To: Rotate the Combine CA and Signer Certificates

On reserved regions, the CA and Signer certificates expire every few years. Therefore it is a useful exercise to roleplay and even work through rotation of these certificates while your workload is running in Combine.

Here is a standard operating procedure to do so, in order. 

Note that 'customer' below refers not to the sponsoring agency, but to the Combine customer. 

1. Sequoia issues a new Certificate Authority.

2. Sequoia provides a combined trust chain containing both the old and the new Certificate Authorities.

3. Customer deploys/rotates this combined trust chain throughout its infrastructure.

4. Sequoia updates TAP and Endpoint servers to use certificiates issued by new CA and the combined trust chain. 
	- At this point any customer infrastructure that did not trust the combined trust chain will not be able to connect to the TAP / Endpoints servers.
	- Calls to the CAP API will continue to functions since Combine authentication is based on trust of CA (which is provided by the combined trust chain) plus the serial number of the certificate (which is unchanged for existing certificates).

5. Customer issues new certificates to all active users and server / NPE certificates. These certificates are deployed / rotated throughout each applicable service.
	- At this point any customer peer-to-peer connections that did not trust the combined trust chain will not be able to connect to each other. All connections that use the combined trust chain will work even with certificates issued by different authorities.
	- There is no interruption of service because Combine TAP servers are serving combined trust chain. Endpoints servers do not validate client certificates.

6. Sequoia removes combined trust chain and replaces it with new Certificate Authority trust chain only.

7. Customer deploys/rotates this new Certificate Authority trust chain only throughout its infrastructure.
