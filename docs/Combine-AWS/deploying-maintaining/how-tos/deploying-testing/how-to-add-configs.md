# Adding configs to DynamoDB

The config is named: 

    combine.endpoints.aws.filter.eks.clusterVersion.aws_sc2s.versions.allowed
    
You can set the value to the allowed versions. As of 17, July 2025, up to 1.33 is supported on the high side.

To do this, you can go into DynamoDB and create a new entry in the below table:

    combine-configuration table; 

`parameter_name` = `combine.endpoints.aws.filter.eks.clusterVersion.aws_sc2s.versions.allowed`
   
`parameter_value` = `1.29 1.30 1.31`


