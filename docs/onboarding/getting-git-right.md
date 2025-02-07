# Getting Git Right

This page reserved for general future documentation on how to:
- branch and merge #Mostly in here now
- tag
- IDE integrations
- tab/space wars
- etc

# Git Configuration and Workflow Notes

## Git Config (Set up prior to commit/push)
```bash
git config --global user.email "username@sequoiainc.com" 
git config --global user.name "username" 
git remote add origin https://github.com/Combine-Pathfinder-Palisade/combine-docs.git # This sets the origin as the remote repository
```

---

## Personal Access Token Setup (via WebUI)
1. A "legacy" token seems to be the only way to make this work.
2. Login to the site.
3. Click on your user icon > select **Settings**.
4. Find **Developer settings** in the lower left of the menu on the next page (search in the page if it isn't obvious).
5. Click **Personal access tokens** and select **Tokens (classic)**.
6. Click **Generate new token**.
7. Select **Generate new token (classic)**.
8. Set **custom** for the expiration and enter a date 1 year from now (maximum possible range).
9. Choose all the permissions (for now anyway) and issue the token.
10. Click **Generate token** at the bottom.
    - **IMPORTANT**: Copy the token text string as you'll only see it once.
    - This string will be used in lieu of a password when authenticating via the CLI to GitHub.

---

## Git Commands

### Clone a Repository
#### Initial clone of repository into a directory:
```bash
git clone https://github.com/Combine-Pathfinder-Palisade/combine-docs.git
```
- **NOTE**: This creates a parent directory titled `combine-docs` in the working directory.
- **NOTE**: This pulls only the "main" (or default) branch.

#### Clone a specific branch of a repository:
```bash
git clone -b docs_update https://github.com/Combine-Pathfinder-Palisade/combine-docs.git
```

---

### Branch Management
#### Create a new branch locally:
```bash
git checkout -b <branchname>
```

#### List all branches:
```bash
git branch # Local branches
git branch -r # Remote branches
```

#### Sync a remote branch into the local repo (if it doesn’t currently exist locally):
```bash
git fetch
git switch <remote_branch_name>
```
#### Push a newly created branch to the remote repository:
```bash
git push --set-upstream <branchname>
```

#### Delete local branches that have been removed from remote repo
```bash
git fetch --prune
```

#### Delete local branch
```bash
git branch -D branchname
```

#### Delete remote branch
```bash
git push origin --delete branchname
```

---

### Committing and Pushing Changes
#### Commit new code to the local repository and push to the remote:
```bash
git add . # Add all changed files into the upcoming commit.
git status # Shows what files are ready to be committed.
git commit -m "Updated cheat sheet notes." # Commit with a message.
git push # Sends changed code up to the remote repo.
```

---

### Merge Branches
1. Ensure that all desired changes are present and committed in the branch to be merged.
2. Fetch the remote repo to ensure that any new changes are present:
```
git fetch
```
3. Create a pull request:
```bash
gh pr create --base main --head doc_update --title "Merge Documentation Updates"
```
4. Check out the main branch (target branch)
```bash
git checkout main
```
5. Test the merge for any conflicts:
```bash
git merge --no-commit --no-ff doc_update
```
 - This will stage the merge without committing it, allowing for resolution of merge conflicts
 - The `--no-ff` flag means `no fast forward` which preserves the commit history of the branch
 - Without the `--no-ff` flag the commit history of the branch creation will be lost and new features (once deconflicted) will be merged in to the target branch
```bash
git merge --no-ff doc_update
git push # Send merged branches up to the remote repository.
```

---

### Get Remote Source of Current Repository:
```bash
git remote get-url origin
```

---

### Ignoring Files in a Git Repository

#### **1. Ignoring Files Locally**
To instruct Git to ignore certain files or directories:

1. **Navigate to the Root of Your Git Repository**:
   ```bash
   cd /path/to/your/git/repo
   ```

2. **Create or Open the `.gitignore` File**:
   If the file doesn’t exist yet, create it:
   ```bash
   touch .gitignore
   ```

3. **Add Files or Directories to Ignore**:
   Open `.gitignore` in a text editor and add each file or directory you want to ignore on a separate line:
   ```plaintext
   # Ignore a specific file
   scripts/debug_scratch.txt

   # Ignore all files in a directory
   directory_name/
   ```

4. **Save the Changes**:
   After adding the desired files or directories, save the `.gitignore` file.

---

#### **2. Retaining a Directory but Ignoring Its Files**
If you want to keep a directory in the repository but ignore its contents (e.g., temporary or generated files), follow these steps:

1. **Navigate to the Target Directory**:
   ```bash
   cd /path/to/your/git/repo/directory_name
   ```

2. **Create an Empty Placeholder File (`.gitkeep`)**:
   This file is a convention (not a Git rule) used to ensure the directory is tracked in Git, even though its contents are ignored:
   ```bash
   touch .gitkeep
   ```

3. **Navigate Back to the Repository Root**:
   ```bash
   cd ..
   ```

4. **Modify `.gitignore` to Ignore All Files but Retain the Directory**:
   Open `.gitignore` and add the following lines:
   ```plaintext
   # Ignore all files in the directory
   directory_name/*

   # But do not ignore the .gitkeep file
   !directory_name/.gitkeep
   ```

   - `directory_name/*`: Tells Git to ignore all files in `directory_name`.
   - `!directory_name/.gitkeep`: Ensures the `.gitkeep` file is **not ignored** and remains in the repository.

5. **Save Your Changes**:
   This configuration ensures the directory is tracked but its contents are ignored.

---

### Ignore Files Use Case:
You have a directory named `build/` that stores temporary files generated during code execution. To avoid tracking these files but keep the directory structure in the repository:
1. Add a `.gitkeep` file to the `build/` directory.
2. Update `.gitignore` as shown above.

This is useful for:
- Preventing large or unnecessary files from cluttering your repository.
- Retaining the directory structure for other developers or environments.

---

### View Files Under Source Control
 Files not under source control (such as those in `.gitignore`) will not be included in this output
#### Show files per branch:
```bash
git ls-tree -r main --name-only
git ls-tree -r doc_update --name-only
```
- `-r`: Recursive.
- `--name-only`: Show only file names (without this flag, file type and hash are also displayed).

---

### Overwrite a local branch
#### This would be done to reset a branch back to the code stored in the remote repository
```bash
git checkout doc_update #Checkout the local branch to be reset
git fetch origin #Pull down the remote repository
git reset --hard origin/doc_update #Overwrite the local branch with the remote version
git status #Check that the local branch is now the same as the remote branch
```

---

### Restore remote repo with local copy
### WARNING
#### **DO NOT DO THIS**: Push local repo and overwrite remote repo (this will delete the remote repo):
```bash
git push -u -f origin main
```