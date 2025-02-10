# How To: Deploy a Hotfix Release

(more detail coming!)

Branching off of the last stable tag from master is what we want to do when we're doing a very precise bug fix. If so, the version will have a fourth quadrant, i.e. if you were fixing a bug on `3.13.1`, you'd move to `3.13.1.1` ideally, instead of `3.13.2`.

In rare cases, i.e. for Salesforce, we will have to branch from a tag prior to the last stable version.

Here's the process:

- branch from last stable tag on master, suffix with `_branch` or `_hotfix`
- make change, be sure to add release note in `release-notes.html` (if you can do it one commit that'd be easiest)
- update versions on separate commit (see `update_bricks_version.sh` in `/combine-automation-tool/scripts`, copy it from `master` if it's not there), add 4th quadrant release number
- test change, locally if possible
  - TODO add guide for testing rewriters, as these are the most common case
- deploy to customer
- upon successful deploy (i..e hear back from customer that it works):
	- push the _first_ commit (i.e. the code change + release note change) into master via squash commit
    - you can also `cherrypick`, just as long as the change and the release notes are merged into `master`
- tag your new tag from your hotfix branch, with `git tag bricks_v_3_13_1_1` in this case
- push the tag, i.e. `git push origin tag bricks_v_3_13_1_1`

`master` is merged into `dev` regularly.

