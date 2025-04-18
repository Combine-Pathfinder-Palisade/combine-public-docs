import fs from 'fs-extra';
import path from 'path';

// Define path
const docsDir = path.join(__dirname, '../docs'); 
const markdownLinkRegex = /\[([^\]]+)\]\((?!http)([^)]+)\)/g; // Matches [text](link) + relative links

// Function to check if a file exists in docs
const linkExists = (baseDir: string, link: string): boolean => {
  const withoutHash = link.split('#')[0]; // remove pound if present
  const potentialPath = path.resolve(baseDir, withoutHash + (path.extname(withoutHash) ? '' : '.md'));
  return fs.existsSync(potentialPath);
};

//Replace "broken links" with Restricted
const processFiles = (dir: string): void => {
  fs.readdirSync(dir).forEach((file: string) => {
    const fullPath = path.join(dir, file);

    if (fs.statSync(fullPath).isDirectory()) {
      processFiles(fullPath); 
    } else if (file.endsWith('.md')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      let updatedContent = content;

      updatedContent = updatedContent.replace(
        markdownLinkRegex, 
        (match: string, text: string, link: string): string => {
        if (!linkExists(path.dirname(fullPath), link)) {
          console.log(`❌ Broken link found: ${link} in ${file} → Replacing with Restricted Access.`);
          return `[${text}](#) (Restricted Access)`;
        }
        return match; 
      });

      if (content !== updatedContent) {
        fs.writeFileSync(fullPath, updatedContent, 'utf-8');
        console.log(`✅ Updated: ${file}`);
      }
    }
  });
};

// Run script
console.log('🔍 Scanning for broken links...');
processFiles(docsDir);
console.log('🚀 Link cleaning completed!');