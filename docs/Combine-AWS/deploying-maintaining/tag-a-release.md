# Tag a Release

### How to Build and Tag a Release

1. Go into the `combine-account-automation` repo and checkout the master branch. Perform a `git pull`.
  - If tagging from a non-master branch, you'll have to do some extra work detailed below.

2. Run `update_versions.sh <major>.<minor>.<patch>` in `combine-account-automation/scripts`
  - If tagging from a non-master branch, you can grab this script from `master` and run it - it'll work even in prior versions.

3. Run `mvn clean install` in the `combine-aws` repo root directory to ensure a clean build.
  - If tagging from a non-master branch:
    - Run the relevant `mvn` commands on the following directories:
      - `combine-commons` - `mvn clean install`
      - `combine-endpoints` - `mvn clean package`
      - `combine-tap` - Use the `build.txt.` file
      - `combine-tomcat` - `mvn clean package`
    - Place all `.war` files (endpoints, tap, tomcat jar - found in each project dir/target) in their corresponding dirs in the following root directory:
      - `combine-account-automation/src/main/resources/com/sequoia/combine/servers`

      Example commands:
      - `mv combine-tap/tap-api/target/tap-api-3.12.1.war combine-account-automation/src/main/resources/com/sequoia/combine/servers/tap`
      - `mv combine-endpoints/target/endpoints-3.12.1.war combine-account-automation/src/main/resources/com/sequoia/combine/servers/endpoints`
      - `mv combine-tomcat/target/combine-tomcat-1.2.jar combine-account-automation/src/main/resources/com/sequoia/combine/servers/tomcat`

4. Tag the branch:
    - `git add -A`
    - `git commit -m "Updated release number."`
    - `git push`
    - `git tag <bricks version>`
    - `git push origin tag <bricks version>`

5. Checkout dev and merge master into it and resolve. those. conflicts.